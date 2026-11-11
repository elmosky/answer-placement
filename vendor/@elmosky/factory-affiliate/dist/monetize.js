import { insertAffiliateLinks, linkTableRows, isProductUrl } from "./linker.js";
/** Authority / reference domains — never converted (citations, not products). */
export const DEFAULT_REFERENCE_DOMAINS = /(^|\.)(fda|usda|cdc|nih|ncbi|nlm\.nih|mayoclinic|clevelandclinic|aaaai|acaai|foodallergy|eatright)\.(gov|org|com)$|\.edu$|\.gov$/i;
/** Anchor text that signals a reference link (keep, don't convert to a product page). */
export const DEFAULT_REFERENCE_ANCHOR = /\b(allergen|ingredient|guidance|guideline|official|page|list|statement|menu|study|report|policy|labeling|label|learn more|read more|source|website)\b/i;
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const brandRoot = (dom) => dom.replace(/^www\./, "").replace(/\.(com|net|org|co|us)$/, "");
const isBareDomain = (t) => /^\s*(https?:\/\/)?[a-z0-9-]+\.(com|net|org|co)\b/i.test(t.trim());
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
/** Match a brand-site domain to a catalog product that has a real Amazon /dp/ link. */
function catalogMatch(dom, catalog) {
    const root = norm(brandRoot(dom));
    let best = null;
    for (const c of catalog) {
        if (!c.brand || !/\/dp\/B[0-9A-Z]{9}/.test(c.url || ""))
            continue;
        const nb = norm(c.brand);
        if (nb.length >= 4 && (root.includes(nb) || nb.includes(root))) {
            if (!best || nb.length > norm(best.brand || "").length)
                best = c;
        }
    }
    return best;
}
/** The site's active catalog: its own rows plus global (site_id null) shared rows, fully paged. */
export async function loadCatalog(db) {
    return db.all(() => db.from("affiliate_links").select("id, brand, product_name, url, match_keywords").eq("active", true));
}
export async function monetizeArticle(db, bodyHtml, opts = {}) {
    const cfg = opts.config ?? {};
    const referenceDomains = cfg.referenceDomains ?? DEFAULT_REFERENCE_DOMAINS;
    const referenceAnchor = cfg.referenceAnchor ?? DEFAULT_REFERENCE_ANCHOR;
    const catalog = await loadCatalog(db);
    const referenceOnly = cfg.referenceCategories?.test(opts.category || "") ?? false;
    let html = bodyHtml;
    const res = {
        html, converted: 0, unwrapped: 0, kept: 0, added: 0,
        tableAdded: 0, tableSkipped: 0, tracked: 0, unwrappedBrands: [],
    };
    const placements = [];
    const linkRe = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    for (const m of [...html.matchAll(linkRe)]) {
        const [full, href, inner] = m;
        const anchor = inner.replace(/<[^>]+>/g, "").trim();
        const dom = (href.match(/https?:\/\/([^/]+)/) || [])[1] || "";
        if (!dom)
            continue; // internal/relative link
        if (/amazon\.|amzn\./i.test(href)) {
            res.kept++;
            continue;
        } // already ours
        if (referenceOnly || referenceDomains.test(dom) || referenceAnchor.test(anchor)) {
            res.kept++;
            continue;
        }
        let url = null;
        let name = null;
        let linkId = null;
        const c = catalogMatch(dom, catalog);
        if (c) {
            url = c.url;
            name = c.brand;
            linkId = c.id;
        }
        else if (opts.resolveAmazon) {
            url = await opts.resolveAmazon(dom);
            name = titleCase(brandRoot(dom).replace(/([a-z])([A-Z])/g, "$1 $2"));
        }
        if (url) {
            const text = isBareDomain(anchor) && name ? name : inner;
            html = html.replace(full, `<a href="${url}" target="_blank" rel="sponsored nofollow noopener noreferrer">${text}</a>`);
            res.converted++;
            if (linkId)
                placements.push({ link_id: linkId, anchor_text: (name || anchor).slice(0, 120), url_snapshot: url });
        }
        else {
            html = html.replace(full, inner); // unwrap: keep the text, drop the un-monetizable link
            res.unwrapped++;
            res.unwrappedBrands.push(brandRoot(dom));
        }
    }
    // Add catalog-product links on unlinked product mentions (idempotent, capped).
    const realTargets = catalog
        .filter((r) => isProductUrl(r.url))
        .map((r) => ({
        id: r.id,
        url: r.url,
        product_name: r.product_name,
        brand: r.brand,
        keywords: r.match_keywords ?? [],
    }));
    const add = insertAffiliateLinks(html, realTargets, { maxLinks: cfg.maxLinks });
    html = add.html;
    res.added = add.inserted.length;
    for (const p of add.inserted)
        placements.push({ link_id: p.link_id, anchor_text: p.anchor.slice(0, 120), url_snapshot: p.url });
    // Comparison charts: the prose pass skips tables by design, so link the
    // product-name cell of each row separately. Exact match only — an ambiguous
    // row stays bare rather than pointing at a near-miss.
    const tbl = linkTableRows(html, realTargets);
    html = tbl.html;
    res.tableAdded = tbl.inserted.length;
    res.tableSkipped = tbl.skipped.length;
    for (const p of tbl.inserted)
        placements.push({ link_id: p.link_id, anchor_text: p.anchor.slice(0, 120), url_snapshot: p.url });
    // Record placements in link_usage so the affiliate manager tracks every link that went live.
    //
    // Deduped by link_id first. A product can legitimately be placed twice in one
    // article (once in the prose, once in a comparison-table row), and handing
    // Postgres two rows with the same (link_id, post_id) in a single upsert fails
    // the WHOLE command with "ON CONFLICT DO UPDATE command cannot affect row a
    // second time" — which took down the publish, not just the tracking. The
    // prose placement is kept because it comes first and reads as the recommendation.
    if (opts.postId && placements.length) {
        const byLink = new Map();
        for (const p of placements)
            if (!byLink.has(p.link_id))
                byLink.set(p.link_id, p);
        const rows = [...byLink.values()].map((p) => ({ ...p, post_id: opts.postId, status: "applied" }));
        await db.from("link_usage").upsert(rows, { onConflict: "link_id,post_id" });
        res.tracked = rows.length;
    }
    res.html = html;
    res.unwrappedBrands = [...new Set(res.unwrappedBrands)];
    return res;
}
