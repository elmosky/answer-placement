import { monetizeArticle } from "./monetize.js";
/**
 * Inline affiliate links already baked into a body: catalog links (tagged with
 * data-aff-link-id) plus raw Amazon hrefs.
 *
 * Counted per anchor rather than per pattern. The original summed two
 * independent regexes, which counted a catalog link pointing at Amazon twice —
 * harmless for the "> 0" gap check it was used in, wrong for anything that
 * reports the number.
 */
export function affiliateLinkCount(html) {
    const anchors = (html || "").match(/<a\s[^>]*>/gi) || [];
    return anchors.filter((a) => /data-aff-link-id/i.test(a) || /href=["']https?:\/\/(?:www\.)?(?:amazon\.|amzn\.)/i.test(a)).length;
}
/** Comparison-chart rows and how many carry a link (first cell = product name). */
export function countTableRows(html) {
    let rows = 0;
    let linked = 0;
    for (const table of (html || "").match(/<table[\s\S]*?<\/table>/gi) || []) {
        for (const row of table.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
            const cell = /<td[^>]*>([\s\S]*?)<\/td>/i.exec(row); // header rows have no <td>
            if (!cell)
                continue;
            rows++;
            if (/<a[\s>]/i.test(cell[1]))
                linked++;
        }
    }
    return { rows, linked };
}
/**
 * Audit (and optionally heal) coverage across every published post for a site.
 * @param fix rewrites zero-link prose posts in place via monetizeArticle.
 * @param slug limit to one post.
 */
export async function auditCoverage(db, { fix = false, slug, config = {} } = {}) {
    const posts = await db.all(() => {
        const q = db.from("posts").selectOwn("id, slug, category, body_html").eq("status", "published");
        return slug ? q.eq("slug", slug) : q;
    });
    const res = {
        fix, scanned: 0, ok: 0, healed: 0, gaps: 0, noMatch: 0, reference: 0,
        listOk: 0, listGaps: 0, tableRows: 0, tableRowsLinked: 0, findings: [], unhealed: 0,
    };
    for (const p of posts) {
        res.scanned++;
        const category = p.category ?? "";
        const body = p.body_html ?? "";
        // Reference categories are citation-only by design — no product links expected.
        if (config.referenceCategories?.test(category)) {
            res.reference++;
            continue;
        }
        // List categories are monetized through slots, not inline links.
        // list_items has no site_id of its own (it is scoped through post_id), so
        // it is read via fromGlobal — an explicit, greppable cross-scope read.
        if (config.listCategories?.test(category)) {
            const { data: slots } = await db.fromGlobal("list_items").select("link_id").eq("post_id", p.id);
            const rows = (slots ?? []);
            const linked = rows.filter((s) => s.link_id).length;
            if (rows.length === 0 || linked < rows.length) {
                res.listGaps++;
                res.findings.push({ slug: p.slug, category, status: "toplist_gap", detail: `${linked}/${rows.length} slots linked` });
            }
            else {
                res.listOk++;
            }
            continue;
        }
        // Comparison charts are counted separately from prose. A guide can carry its
        // prose links and still have a completely bare chart, which the >=1-link
        // test below would report as covered. Report it, never heal it here: chart
        // linking is exact-match-or-nothing, never best-effort.
        const chart = countTableRows(body);
        if (chart.rows > 0) {
            res.tableRows += chart.rows;
            res.tableRowsLinked += chart.linked;
            if (chart.linked === 0) {
                res.findings.push({ slug: p.slug, category, status: "table_gap", detail: `chart has ${chart.rows} rows, 0 linked` });
            }
        }
        if (affiliateLinkCount(body) > 0) {
            res.ok++;
            continue;
        }
        // Zero links on a prose post is the exact failure this guards against.
        // Never let one bad post abort the sweep.
        try {
            // Gate on the monetized BODY, not on `added`: `added` counts the prose
            // pass only, so a post whose only catalog match sits in a comparison
            // table was reported "no catalog match" while the monetizer had in fact
            // linked it.
            const mon = await monetizeArticle(db, body, {
                category,
                ...(fix ? { postId: p.id } : {}), // dry run writes no link_usage rows
                config,
            });
            const would = mon.added + mon.tableAdded;
            if (affiliateLinkCount(mon.html) === 0) {
                res.noMatch++;
                res.findings.push({ slug: p.slug, category, status: "no_match", detail: "no catalog product matches — needs catalog/sponsorship coverage" });
                continue;
            }
            if (!fix) {
                res.gaps++;
                res.findings.push({ slug: p.slug, category, status: "gap", added: would, detail: `monetizer would add ${would} (${mon.added} prose, ${mon.tableAdded} table)` });
                continue;
            }
            await db.from("posts").update({ body_html: mon.html, updated_at: new Date().toISOString() }).eq("id", p.id);
            res.healed++;
            res.findings.push({ slug: p.slug, category, status: "healed", added: would, detail: `+${would} link(s) (${mon.added} prose, ${mon.tableAdded} table), link_usage: ${mon.tracked}` });
        }
        catch (e) {
            res.gaps++;
            res.findings.push({ slug: p.slug, category, status: "error", detail: e instanceof Error ? e.message : String(e) });
        }
    }
    res.unhealed = res.gaps + res.listGaps + res.noMatch;
    return res;
}
