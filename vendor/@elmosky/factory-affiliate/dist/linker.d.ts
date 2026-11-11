/**
 * Affiliate link inserter — CMS-side fork of affiliate-manager's lib/affiliate-linker.ts
 * (which is itself a fork of this site's internal-linker). Pure, deterministic, $0:
 * tokenizes body_html, links only top-level prose, one link per product, caps at
 * 1/250 words (max 3), idempotent by data-aff-link-id, and REFUSES non-product URLs
 * (search links can't leak in). Used by the CMS one-click "Add affiliate links" button.
 */
export interface AffiliateTarget {
    id: string;
    url: string;
    product_name: string;
    brand: string | null;
    keywords: string[];
}
export interface Placement {
    link_id: string;
    product_name: string;
    brand: string | null;
    url: string;
    anchor: string;
    keyword: string;
    context: string;
}
export interface InsertResult {
    html: string;
    inserted: Placement[];
    cap: number;
}
/** A linkable URL must be a specific product page, never an Amazon search results page. */
export declare function isProductUrl(url: string): boolean;
export declare function insertAffiliateLinks(bodyHtml: string, targets: AffiliateTarget[], opts?: {
    maxLinks?: number;
}): InsertResult;
/** A real Amazon product page, identified by ASIN. Stricter than isProductUrl. */
export declare function hasAsin(url: string): boolean;
export interface TableSkip {
    cell: string;
    reason: 'no-match' | 'ambiguous' | 'blocked';
    matches: string[];
}
export interface TableLinkOptions {
    /**
     * ASINs that must not receive links (e.g. a catalog row whose ASIN is known to resolve to
     * the wrong product). A blocked product STILL competes for its cell, so blocking one cannot
     * silently promote a rival variant that was correctly ambiguous before — the row is reported
     * as 'blocked' and left bare instead.
     */
    blockAsins?: Iterable<string>;
}
export interface TableLinkResult {
    html: string;
    inserted: Placement[];
    skipped: TableSkip[];
    rows: number;
}
/**
 * Link the first (product-name) cell of every body row in every table.
 * Pure + deterministic. Never touches prose, headers, or cells that already
 * contain a link. One link per row; no article-wide cap (rows are finite and
 * each one is a distinct product the reader is actively comparing).
 */
export declare function linkTableRows(bodyHtml: string, targets: AffiliateTarget[], opts?: TableLinkOptions): TableLinkResult;
