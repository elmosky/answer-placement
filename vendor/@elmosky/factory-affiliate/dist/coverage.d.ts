/**
 * Affiliate-coverage reconciliation — the failsafe that catches published
 * articles carrying no affiliate links at all.
 *
 * The problem it exists for: monetization runs on the in-app publish paths. Any
 * post that reaches status='published' by another route — an external pipeline,
 * a bulk DB write, a script, a future path — bypasses it and ships link-free,
 * silently. A link checker only checks links that already exist, so a zero-link
 * article is invisible to it.
 *
 * This reconciles the published END STATE, so it is publish-path-agnostic by
 * design: it audits what is live, not how it got there. Healing reuses the same
 * monetizeArticle the publish path uses, so a heal is byte-identical to
 * monetizing at publish time.
 *
 * Ported from soyfreesnacks/src/lib/affiliate-coverage.ts. The category rules
 * that were hardcoded regexes there are config here, because "Top List" and
 * "Restaurant" are one site's taxonomy, not the factory's.
 */
import type { FactoryClient } from "@elmosky/factory-db";
import { type MonetizeConfig } from "./monetize.js";
export type CoverageStatus = "ok" | "healed" | "gap" | "no_match" | "reference" | "toplist_ok" | "toplist_gap" | "table_gap" | "error";
export interface CoverageFinding {
    slug: string;
    category: string;
    status: CoverageStatus;
    added?: number;
    detail?: string;
}
export type CoverageConfig = MonetizeConfig & {
    /**
     * Categories monetized through list_items slots rather than inline body
     * links (a ranked top-10 layout). Their coverage is "every slot has a
     * link_id", not "the prose has a link".
     */
    listCategories?: RegExp;
};
/**
 * Inline affiliate links already baked into a body: catalog links (tagged with
 * data-aff-link-id) plus raw Amazon hrefs.
 *
 * Counted per anchor rather than per pattern. The original summed two
 * independent regexes, which counted a catalog link pointing at Amazon twice —
 * harmless for the "> 0" gap check it was used in, wrong for anything that
 * reports the number.
 */
export declare function affiliateLinkCount(html: string): number;
/** Comparison-chart rows and how many carry a link (first cell = product name). */
export declare function countTableRows(html: string): {
    rows: number;
    linked: number;
};
export interface CoverageResult {
    fix: boolean;
    scanned: number;
    ok: number;
    healed: number;
    gaps: number;
    noMatch: number;
    reference: number;
    listOk: number;
    listGaps: number;
    tableRows: number;
    tableRowsLinked: number;
    /** Only the non-"ok" findings, for logging and alerting. */
    findings: CoverageFinding[];
    /** Total actionable items remaining: gaps + listGaps + noMatch. */
    unhealed: number;
}
/**
 * Audit (and optionally heal) coverage across every published post for a site.
 * @param fix rewrites zero-link prose posts in place via monetizeArticle.
 * @param slug limit to one post.
 */
export declare function auditCoverage(db: FactoryClient, { fix, slug, config }?: {
    fix?: boolean;
    slug?: string;
    config?: CoverageConfig;
}): Promise<CoverageResult>;
