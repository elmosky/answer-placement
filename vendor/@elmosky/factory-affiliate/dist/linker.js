const PROTECTED = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'td', 'th', 'caption', 'figure', 'figcaption', 'script', 'style',
]);
/** A linkable URL must be a specific product page, never an Amazon search results page. */
export function isProductUrl(url) {
    const u = (url || '').trim();
    if (!u)
        return false;
    if (/\/(?:dp|gp\/product|gp\/aw\/d)\/[A-Z0-9]/i.test(u))
        return true;
    if (!/amazon\./i.test(u))
        return true; // non-Amazon = direct deal, already specific
    return false;
}
function phraseRegex(phrase) {
    const esc = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-\s]+/g, '[-\\s]+');
    return new RegExp(`\\b${esc}\\b`, 'i');
}
function wordCount(html) {
    return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}
function candidatesFor(targets) {
    const out = [];
    for (const t of targets)
        for (const k of t.keywords)
            if (k && k.trim())
                out.push({ target: t, keyword: k.trim() });
    return out.sort((a, b) => b.keyword.length - a.keyword.length); // longest = most specific anchor first
}
export function insertAffiliateLinks(bodyHtml, targets, opts = {}) {
    const maxLinks = opts.maxLinks ?? 3;
    const cap = Math.min(Math.floor(wordCount(bodyHtml) / 250), maxLinks);
    const inserted = [];
    if (cap === 0 || targets.length === 0)
        return { html: bodyHtml, inserted, cap };
    const usable = targets.filter((t) => isProductUrl(t.url) && !bodyHtml.includes(`data-aff-link-id="${t.id}"`));
    const candidates = candidatesFor(usable);
    const usedTargets = new Set();
    const tokens = bodyHtml.split(/(<[^>]+>)/);
    const stack = [];
    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        if (!tok)
            continue;
        if (tok.startsWith('<')) {
            const m = tok.match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)/);
            if (m) {
                const closing = m[1] === '/';
                const name = m[2].toLowerCase();
                const selfClosing = /\/>\s*$/.test(tok) || ['br', 'img', 'hr', 'col', 'input', 'meta'].includes(name);
                if (PROTECTED.has(name) && !selfClosing) {
                    if (closing) {
                        const idx = stack.lastIndexOf(name);
                        if (idx !== -1)
                            stack.splice(idx, 1);
                    }
                    else
                        stack.push(name);
                }
            }
            continue;
        }
        if (stack.length > 0)
            continue;
        if (inserted.length >= cap)
            continue;
        tokens[i] = linkifyText(tok, candidates, usedTargets, () => inserted.length >= cap, (anchor, keyword, t, context) => {
            inserted.push({ link_id: t.id, product_name: t.product_name, brand: t.brand, url: t.url, anchor, keyword, context });
            usedTargets.add(t.id);
        });
    }
    return { html: tokens.join(''), inserted, cap };
}
/* ------------------------------------------------------------------ *
 * Comparison-table linking
 *
 * The prose pass above deliberately skips tables (they're in PROTECTED), so a
 * comparison chart — the highest-intent block on a guide — could never earn a
 * link. This pass handles tables only, and links the product-name cell (first
 * column) of each body row.
 *
 * It is far stricter than the prose matcher, because a table cell IS a product
 * name rather than a phrase buried in a sentence. A row is linked only when
 * EXACTLY ONE catalog product matches it. Zero matches or two-plus matches both
 * mean "no link" — a row is left bare rather than pointed at a near-miss.
 *
 * The exactness guarantees, in order:
 *   1. URL must carry a real /dp/<ASIN>. Search pages can't reach this code.
 *   2. The product's brand must appear in the cell.
 *   3. After removing the brand, the descriptor words of one side must be a
 *      subset of the other's ("YumEarth Lollipops" ⊆ "YumEarth Organic
 *      Lollipops" links; "YumEarth Licorice" does not).
 *   4. Ties are resolved only by an exact descriptor match; otherwise skipped.
 * ------------------------------------------------------------------ */
/** A real Amazon product page, identified by ASIN. Stricter than isProductUrl. */
export function hasAsin(url) {
    return /\/(?:dp|gp\/product|gp\/aw\/d)\/(B[0-9A-Z]{9})\b/i.test(url || '');
}
/** Packaging/marketing words that never distinguish one product from another. */
const NOISE = new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'with', 'for', 'by',
    'pack', 'packs', 'count', 'ct', 'oz', 'ounce', 'ounces', 'lb', 'lbs',
    'net', 'wt', 'size', 'inc', 'llc', 'co', 'brand',
]);
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&[mn]dash;/g, '-').replace(/&[a-z]+;/gi, ' ');
/** Lowercase, de-punctuate, drop noise, singularise. Order preserved. */
function tokens(s) {
    return decode(s || '').toLowerCase().replace(/[^a-z0-9%]+/g, ' ').split(/\s+/)
        .filter(Boolean).filter((t) => !NOISE.has(t))
        .map((t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t));
}
const glue = (t) => t.join('');
/** Brand present in the cell? Tolerates "Yum Earth" vs "YumEarth". */
function brandMatches(brandToks, cellToks) {
    if (!brandToks.length)
        return false;
    if (brandToks.every((b) => cellToks.includes(b)))
        return true;
    const bg = glue(brandToks);
    return bg.length >= 4 && glue(cellToks).includes(bg);
}
/** Descriptor words = everything that isn't part of the brand. */
function descriptors(toks, brandToks) {
    const bg = glue(brandToks);
    return new Set(toks.filter((t) => !brandToks.includes(t) && !(t.length >= 3 && bg.includes(t))));
}
const isSubset = (a, b) => [...a].every((x) => b.has(x));
/**
 * Resolve one table cell to at most one catalog product.
 * Returns null when nothing matches or when the match is ambiguous.
 */
function resolveCell(cellText, targets) {
    const cellToks = tokens(cellText);
    if (cellToks.length === 0)
        return { cell: cellText, reason: 'no-match', matches: [] };
    const hits = [];
    for (const t of targets) {
        const brandToks = tokens(t.brand || t.product_name.split(/\s+/)[0] || '');
        if (!brandMatches(brandToks, cellToks))
            continue;
        const dCell = descriptors(cellToks, brandToks);
        const dProd = descriptors(tokens(t.product_name), brandToks);
        if (!isSubset(dCell, dProd) && !isSubset(dProd, dCell))
            continue;
        hits.push({ t, exact: dCell.size === dProd.size && isSubset(dCell, dProd) });
    }
    if (hits.length === 0)
        return { cell: cellText, reason: 'no-match', matches: [] };
    // Collapse rows that are duplicate catalog entries for the SAME product page —
    // two rows pointing at one ASIN is a catalog dupe, not a genuine ambiguity.
    const byAsin = new Map();
    for (const h of hits) {
        const asin = (h.t.url.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/(B[0-9A-Z]{9})/i) || [])[1]?.toUpperCase() || h.t.id;
        const prev = byAsin.get(asin);
        if (!prev || (h.exact && !prev.exact))
            byAsin.set(asin, h);
    }
    const uniq = [...byAsin.values()];
    if (uniq.length === 1)
        return { target: uniq[0].t };
    const exacts = uniq.filter((h) => h.exact);
    if (exacts.length === 1)
        return { target: exacts[0].t };
    return { cell: cellText, reason: 'ambiguous', matches: uniq.map((h) => h.t.product_name) };
}
/**
 * Link the first (product-name) cell of every body row in every table.
 * Pure + deterministic. Never touches prose, headers, or cells that already
 * contain a link. One link per row; no article-wide cap (rows are finite and
 * each one is a distinct product the reader is actively comparing).
 */
export function linkTableRows(bodyHtml, targets, opts = {}) {
    const inserted = [];
    const skipped = [];
    const blocked = new Set([...(opts.blockAsins ?? [])].map((a) => a.toUpperCase()));
    let rows = 0;
    if (!bodyHtml || !/<table/i.test(bodyHtml) || targets.length === 0) {
        return { html: bodyHtml, inserted, skipped, rows };
    }
    // Only products with a real ASIN are eligible here — no search pages, ever.
    const usable = targets.filter((t) => isProductUrl(t.url) && hasAsin(t.url));
    if (usable.length === 0)
        return { html: bodyHtml, inserted, skipped, rows };
    const html = bodyHtml.replace(/<table[\s\S]*?<\/table>/gi, (table) => table.replace(/<tr[\s\S]*?<\/tr>/gi, (row) => {
        // First data cell only. Header rows (<th> only) have no <td> and are skipped.
        const cellRe = /<td([^>]*)>([\s\S]*?)<\/td>/i;
        const m = cellRe.exec(row);
        if (!m)
            return row;
        rows++;
        const [full, attrs, inner] = m;
        if (/<a[\s>]/i.test(inner))
            return row; // already linked (hand-written or a prior run)
        const text = decode(inner.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
        if (!text)
            return row;
        const hit = resolveCell(text, usable);
        if ('reason' in hit) {
            skipped.push(hit);
            return row;
        }
        const t = hit.target;
        const asin = (t.url.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/(B[0-9A-Z]{9})/i) || [])[1]?.toUpperCase();
        if (asin && blocked.has(asin)) {
            skipped.push({ cell: text, reason: 'blocked', matches: [t.product_name] });
            return row;
        }
        const anchor = `<td${attrs}><a rel="sponsored nofollow" data-aff-link-id="${t.id}" href="${t.url}">${inner.trim()}</a></td>`;
        inserted.push({
            link_id: t.id, product_name: t.product_name, brand: t.brand, url: t.url,
            anchor: text, keyword: t.product_name, context: `table row: [${text}]`,
        });
        return row.slice(0, m.index) + anchor + row.slice(m.index + full.length);
    }));
    return { html, inserted, skipped, rows };
}
function linkifyText(text, candidates, usedTargets, capReached, onInsert) {
    let out = '';
    let rest = text;
    while (rest && !capReached()) {
        let best = null;
        for (const c of candidates) {
            if (usedTargets.has(c.target.id))
                continue;
            const m = phraseRegex(c.keyword).exec(rest);
            if (!m)
                continue;
            if (best === null || m.index < best.idx || (m.index === best.idx && m[0].length > best.len)) {
                best = { idx: m.index, len: m[0].length, anchor: m[0], cand: c };
            }
        }
        if (!best)
            break;
        const before = rest.slice(0, best.idx);
        const after = rest.slice(best.idx + best.len);
        const context = `${before.slice(-60)}[${best.anchor}]${after.slice(0, 60)}`.replace(/\s+/g, ' ').trim();
        out += before;
        out += `<a rel="sponsored nofollow" data-aff-link-id="${best.cand.target.id}" href="${best.cand.target.url}">${best.anchor}</a>`;
        onInsert(best.anchor, best.cand.keyword, best.cand.target, context);
        rest = after;
    }
    return out + rest;
}
