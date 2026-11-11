/**
 * Monetize an article at publish time: convert outbound brand-site product links
 * into affiliate links, strip the un-monetizable ones, and add catalog-product
 * links — so no article goes live leaking clicks to sites we don't earn from.
 *
 * Ported from soyfreesnacks/src/lib/monetize.ts, with the two site-specific
 * things lifted into config (the affiliate tag and the reference/whitelist
 * policy) and the catalog read moved onto @elmosky/factory-db. That last part
 * matters: the original shipped without the site_id filter for months, which
 * let one tenant's products be linked into another's articles. Here the tenant
 * filter and the >1000-row pagination come from the client and cannot be
 * dropped by a fork.
 *
 * Deterministic + $0 by default (catalog match only). Pass `resolveAmazon`
 * (e.g. a search API) to also resolve brands not yet in the catalog — do that
 * OFFLINE (backfill), never inside a publish cron, so publishing stays fast.
 */
import type { FactoryClient } from "@elmosky/factory-db";
/** Authority / reference domains — never converted (citations, not products). */
export declare const DEFAULT_REFERENCE_DOMAINS: RegExp;
/** Anchor text that signals a reference link (keep, don't convert to a product page). */
export declare const DEFAULT_REFERENCE_ANCHOR: RegExp;
export type MonetizeConfig = {
    /** Categories whose external links are references to the subject, not shoppable products. */
    referenceCategories?: RegExp;
    /** Domains never converted. Defaults to the authority list above. */
    referenceDomains?: RegExp;
    /** Anchor text that marks a citation. Defaults to the list above. */
    referenceAnchor?: RegExp;
    /** Max catalog links added to the prose (also capped at 1 per 250 words). */
    maxLinks?: number;
};
export interface MonetizeResult {
    html: string;
    converted: number;
    unwrapped: number;
    kept: number;
    added: number;
    tableAdded: number;
    tableSkipped: number;
    tracked: number;
    unwrappedBrands: string[];
}
type CatalogRow = {
    id: string;
    brand: string | null;
    product_name: string | null;
    url: string | null;
    match_keywords: string[] | null;
};
/** The site's active catalog: its own rows plus global (site_id null) shared rows, fully paged. */
export declare function loadCatalog(db: FactoryClient): Promise<CatalogRow[]>;
export declare function monetizeArticle(db: FactoryClient, bodyHtml: string, opts?: {
    category?: string | null;
    postId?: string;
    config?: MonetizeConfig;
    resolveAmazon?: (dom: string) => Promise<string | null>;
}): Promise<MonetizeResult>;
export {};
