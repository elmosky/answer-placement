/**
 * @elmosky/factory-db — tenant-safe access to the shared factory Supabase.
 *
 * The factory database is one Postgres shared by every content site, partitioned
 * by site_id. Four sites hand-rolled this client and one of them (soyfreesnacks'
 * monetizer) shipped a query without the tenant filter, which let sites link each
 * other's products. This package exists so that mistake is structurally
 * impossible: the filter, the site_id stamping, the error-throwing, and the
 * 1000-row pagination all live HERE, not at call sites.
 *
 * Rules baked in:
 *  - Reads via from(t).select() are scoped to (site_id = this site OR site_id is null).
 *    Global-null rows are the shared catalog pattern (e.g. affiliate_links).
 *  - Writes stamp site_id; update/delete refuse to run unscoped.
 *  - Every wrapped builder has throwOnError() applied — supabase-js RETURNS
 *    errors rather than throwing, and unchecked calls look like success while
 *    writing nothing (the silent no-op-write trap).
 *  - Known-global tables (sites, airlines, ...) must go through fromGlobal(),
 *    which is greppable. from() on one throws with the pointer.
 *  - The factory project ref is pinned: when the URL comes from env, it must
 *    contain the ref. A clobbered shared Doppler slot once pointed tools at a
 *    different database for three weeks (the AnswerPlacement incident).
 */
import { type SupabaseClient } from "@supabase/supabase-js";
export declare const FACTORY_REF = "plvuwopoqzgyddadtsvn";
/**
 * Tables with no site_id column that are genuinely cross-site. Access them via
 * fromGlobal() so every cross-tenant read is an explicit, greppable decision.
 * This list doubles as the classified inventory of the unscoped tables.
 */
export declare const KNOWN_GLOBAL_TABLES: readonly ["sites", "pipeline_config", "airlines", "bank_rates", "rate_changes", "verification_runs", "cms_users", "cms_post_authors", "profiles", "digest_parser_configs"];
/**
 * Tables scoped only through a parent row (no site_id column of their own).
 * from() on these would ask PostgREST for a column that doesn't exist; the
 * error message should say what to do instead.
 */
export declare const TRANSITIVELY_SCOPED_TABLES: Record<string, string>;
export interface FactoryClientOptions {
    /** Defaults to NEXT_PUBLIC_SITE_SLUG. */
    siteSlug?: string;
    /** Defaults to NEXT_PUBLIC_SUPABASE_URL, then SUPABASE_URL. Env values must contain the factory ref. */
    url?: string;
    /** Defaults to SUPABASE_SERVICE_ROLE_KEY. Server-only — never expose to a browser bundle. */
    serviceKey?: string;
    /** Set true only if deliberately pointing at a non-factory database. */
    allowNonFactory?: boolean;
}
export declare class ScopedTable {
    private readonly sb;
    private readonly table;
    private readonly siteId;
    constructor(sb: SupabaseClient, table: string, siteId: string);
    /** Rows for this site plus global (site_id null) shared rows. Chain filters freely — they AND-compose. */
    select(columns?: string): import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, ({
        error: true;
    } & "Received a generic string")[], string, unknown, "GET", true>;
    /** Only rows owned by this site — excludes the global/shared rows. */
    selectOwn(columns?: string): import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, ({
        error: true;
    } & "Received a generic string")[], string, unknown, "GET", true>;
    /** Inserts with site_id stamped on every row (a passed site_id is overwritten on purpose). */
    insert(rows: Record<string, unknown> | Record<string, unknown>[]): import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, null, string, unknown, "POST", true>;
    /** Upserts with site_id stamped. `onConflict` names the unique constraint, as in supabase-js. */
    upsert(rows: Record<string, unknown> | Record<string, unknown>[], opts?: {
        onConflict?: string;
    }): import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, null, string, unknown, "POST", true>;
    /** Updates constrained to this site's rows. Global rows are shared property — edit those via fromGlobal, deliberately. */
    update(values: Record<string, unknown>): import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, null, string, unknown, "PATCH", true>;
    /** Deletes constrained to this site's rows. */
    delete(): import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, null, string, unknown, "DELETE", true>;
}
export declare class FactoryClient {
    /** The underlying supabase-js client. Using it directly bypasses every guard — grep for `.raw` in review. */
    readonly raw: SupabaseClient;
    readonly siteSlug: string;
    readonly siteId: string;
    constructor(
    /** The underlying supabase-js client. Using it directly bypasses every guard — grep for `.raw` in review. */
    raw: SupabaseClient, siteSlug: string, siteId: string);
    from(table: string): ScopedTable;
    /** Explicit escape hatch for global and transitively-scoped tables. Errors still throw. */
    fromGlobal(table: string): {
        select: (columns?: string) => import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, ({
            error: true;
        } & "Received a generic string")[], string, unknown, "GET", true>;
        insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, null, string, unknown, "POST", true>;
        update: (values: Record<string, unknown>) => import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, null, string, unknown, "PATCH", true>;
        delete: () => import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, null, string, unknown, "DELETE", true>;
    };
    /**
     * Drain a query past the 1000-row cap. A single Supabase response silently
     * caps at 1000 rows regardless of .range() — an unpaged count over the
     * affiliate catalog once reported 994 rows when the truth was 1170.
     * Pass a FACTORY that builds a fresh query; ordering is applied here so
     * pages are stable.
     */
    all<T = Record<string, unknown>>(makeQuery: () => unknown, { orderBy, pageSize }?: {
        orderBy?: string;
        pageSize?: number;
    }): Promise<T[]>;
    /**
     * Guard for by-id mutations (the generalized postBelongsToSite): confirm the
     * row is this site's before writing. allowGlobal mirrors read scoping for
     * tables where acting on a shared row is legitimate.
     */
    rowBelongsToSite(table: string, id: string, { allowGlobal }?: {
        allowGlobal?: boolean;
    }): Promise<boolean>;
}
/** Site-scoped client. Resolves the site row once; throws if the slug isn't registered. */
export declare function createFactoryClient(opts?: FactoryClientOptions): Promise<FactoryClient>;
/**
 * Public-page reads run through this so a missing/misconfigured Supabase renders
 * an empty section instead of a 500 — logged loudly, because a silently empty
 * blog is the failure mode that matters.
 */
export declare function safeRead<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T>;
