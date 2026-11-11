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
import { createClient } from "@supabase/supabase-js";
export const FACTORY_REF = "plvuwopoqzgyddadtsvn";
/**
 * Tables with no site_id column that are genuinely cross-site. Access them via
 * fromGlobal() so every cross-tenant read is an explicit, greppable decision.
 * This list doubles as the classified inventory of the unscoped tables.
 */
export const KNOWN_GLOBAL_TABLES = [
    "sites",
    "pipeline_config",
    "airlines",
    "bank_rates",
    "rate_changes",
    "verification_runs",
    "cms_users",
    "cms_post_authors",
    "profiles",
    "digest_parser_configs",
];
/**
 * Tables scoped only through a parent row (no site_id column of their own).
 * from() on these would ask PostgREST for a column that doesn't exist; the
 * error message should say what to do instead.
 */
export const TRANSITIVELY_SCOPED_TABLES = {
    list_items: "post_id",
    revisions: "post_id",
    outreach_contacts: "prospect_id",
    outreach_drafts: "prospect_id",
    outreach_replies: "prospect_id",
};
export class ScopedTable {
    sb;
    table;
    siteId;
    constructor(sb, table, siteId) {
        this.sb = sb;
        this.table = table;
        this.siteId = siteId;
    }
    /** Rows for this site plus global (site_id null) shared rows. Chain filters freely — they AND-compose. */
    select(columns = "*") {
        return this.sb
            .from(this.table)
            .select(columns)
            .or(`site_id.eq.${this.siteId},site_id.is.null`)
            .throwOnError();
    }
    /** Only rows owned by this site — excludes the global/shared rows. */
    selectOwn(columns = "*") {
        return this.sb.from(this.table).select(columns).eq("site_id", this.siteId).throwOnError();
    }
    /** Inserts with site_id stamped on every row (a passed site_id is overwritten on purpose). */
    insert(rows) {
        const stamped = (Array.isArray(rows) ? rows : [rows]).map((r) => ({ ...r, site_id: this.siteId }));
        return this.sb.from(this.table).insert(stamped).throwOnError();
    }
    /** Upserts with site_id stamped. `onConflict` names the unique constraint, as in supabase-js. */
    upsert(rows, opts) {
        const stamped = (Array.isArray(rows) ? rows : [rows]).map((r) => ({ ...r, site_id: this.siteId }));
        return this.sb.from(this.table).upsert(stamped, opts).throwOnError();
    }
    /** Updates constrained to this site's rows. Global rows are shared property — edit those via fromGlobal, deliberately. */
    update(values) {
        return this.sb.from(this.table).update(values).eq("site_id", this.siteId).throwOnError();
    }
    /** Deletes constrained to this site's rows. */
    delete() {
        return this.sb.from(this.table).delete().eq("site_id", this.siteId).throwOnError();
    }
}
export class FactoryClient {
    raw;
    siteSlug;
    siteId;
    constructor(
    /** The underlying supabase-js client. Using it directly bypasses every guard — grep for `.raw` in review. */
    raw, siteSlug, siteId) {
        this.raw = raw;
        this.siteSlug = siteSlug;
        this.siteId = siteId;
    }
    from(table) {
        if (KNOWN_GLOBAL_TABLES.includes(table)) {
            throw new Error(`"${table}" is a global (cross-site) table — use fromGlobal("${table}") to make that explicit.`);
        }
        if (table in TRANSITIVELY_SCOPED_TABLES) {
            throw new Error(`"${table}" has no site_id column; it is scoped through ${TRANSITIVELY_SCOPED_TABLES[table]}. ` +
                `Query it via fromGlobal("${table}") with a join/filter on ${TRANSITIVELY_SCOPED_TABLES[table]}.`);
        }
        return new ScopedTable(this.raw, table, this.siteId);
    }
    /** Explicit escape hatch for global and transitively-scoped tables. Errors still throw. */
    fromGlobal(table) {
        return {
            select: (columns = "*") => this.raw.from(table).select(columns).throwOnError(),
            insert: (rows) => this.raw.from(table).insert(rows).throwOnError(),
            update: (values) => this.raw.from(table).update(values).throwOnError(),
            delete: () => this.raw.from(table).delete().throwOnError(),
        };
    }
    /**
     * Drain a query past the 1000-row cap. A single Supabase response silently
     * caps at 1000 rows regardless of .range() — an unpaged count over the
     * affiliate catalog once reported 994 rows when the truth was 1170.
     * Pass a FACTORY that builds a fresh query; ordering is applied here so
     * pages are stable.
     */
    async all(makeQuery, { orderBy = "id", pageSize = 1000 } = {}) {
        const rows = [];
        for (let from = 0;; from += pageSize) {
            const q = makeQuery();
            const { data } = await q.order(orderBy).range(from, from + pageSize - 1);
            const page = (data ?? []);
            rows.push(...page);
            if (page.length < pageSize)
                break;
        }
        return rows;
    }
    /**
     * Guard for by-id mutations (the generalized postBelongsToSite): confirm the
     * row is this site's before writing. allowGlobal mirrors read scoping for
     * tables where acting on a shared row is legitimate.
     */
    async rowBelongsToSite(table, id, { allowGlobal = false } = {}) {
        const { data } = await this.raw.from(table).select("site_id").eq("id", id).maybeSingle().throwOnError();
        if (!data)
            return false;
        const sid = data.site_id;
        return sid === this.siteId || (allowGlobal && sid == null);
    }
}
function resolveUrl(opts) {
    const explicit = opts.url;
    const fromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const url = explicit ?? fromEnv;
    if (!url)
        throw new Error("factory-db: no Supabase URL (NEXT_PUBLIC_SUPABASE_URL).");
    if (!opts.allowNonFactory && !url.includes(FACTORY_REF)) {
        throw new Error(`factory-db: URL does not contain the factory ref ${FACTORY_REF} — a shared env slot is clobbered ` +
            `(this has happened before) or you meant allowNonFactory: true.`);
    }
    return url;
}
/** Site-scoped client. Resolves the site row once; throws if the slug isn't registered. */
export async function createFactoryClient(opts = {}) {
    const siteSlug = opts.siteSlug ?? process.env.NEXT_PUBLIC_SITE_SLUG;
    if (!siteSlug)
        throw new Error("factory-db: no site slug (NEXT_PUBLIC_SITE_SLUG or opts.siteSlug).");
    const url = resolveUrl(opts);
    const key = opts.serviceKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key)
        throw new Error("factory-db: no SUPABASE_SERVICE_ROLE_KEY (server-only).");
    const raw = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data } = await raw.from("sites").select("id").eq("slug", siteSlug).maybeSingle().throwOnError();
    if (!data) {
        throw new Error(`factory-db: site "${siteSlug}" is not registered in the factory. Run: factory-launch db ${siteSlug} --domain <domain> --apply`);
    }
    return new FactoryClient(raw, siteSlug, data.id);
}
/**
 * Public-page reads run through this so a missing/misconfigured Supabase renders
 * an empty section instead of a 500 — logged loudly, because a silently empty
 * blog is the failure mode that matters.
 */
export async function safeRead(label, fn, fallback) {
    try {
        return await fn();
    }
    catch (err) {
        console.error(`[factory-db] ${label} failed:`, err);
        return fallback;
    }
}
