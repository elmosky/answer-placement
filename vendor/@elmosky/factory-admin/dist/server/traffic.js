/**
 * GA4 + Search Console for the traffic panel. Ported from willmybagfuckingfit's
 * google-traffic.ts — the fork with the Promise.allSettled fix, so a broken GSC
 * (e.g. site not verified yet) never blanks out GA4.
 *
 * Env: GOOGLE_OAUTH_CLIENT_ID / _SECRET / _REFRESH_TOKEN are shared across all
 * sites (one offline-access user grant); GA4_PROPERTY_ID and GSC_SITE_URL are
 * the two per-site values.
 */
const DAYS = 28;
function env(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`${name} not set`);
    return v;
}
async function getAccessToken() {
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
            client_secret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
            refresh_token: env("GOOGLE_OAUTH_REFRESH_TOKEN"),
            grant_type: "refresh_token",
        }),
        cache: "no-store",
    });
    if (!res.ok)
        throw new Error(`OAuth token exchange failed (${res.status}): ${await res.text()}`);
    const json = (await res.json());
    if (!json.access_token)
        throw new Error("OAuth token exchange returned no access_token");
    return json.access_token;
}
async function getGa4(token) {
    const propertyId = env("GA4_PROPERTY_ID");
    const dateRange = { startDate: `${DAYS}daysAgo`, endDate: "today" };
    async function runReport(body) {
        const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
        });
        if (!res.ok)
            throw new Error(`GA4 runReport failed (${res.status}): ${await res.text()}`);
        return res.json();
    }
    const totals = await runReport({
        dateRanges: [dateRange],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }],
    });
    const totalMetrics = totals.rows?.[0]?.metricValues ?? [];
    const pages = await runReport({
        dateRanges: [dateRange],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
    });
    return {
        users: Number(totalMetrics[0]?.value ?? 0),
        sessions: Number(totalMetrics[1]?.value ?? 0),
        topPages: (pages.rows ?? []).map((r) => ({
            path: r.dimensionValues?.[0]?.value ?? "",
            views: Number(r.metricValues?.[0]?.value ?? 0),
        })),
    };
}
async function getGsc(token) {
    const siteUrl = env("GSC_SITE_URL");
    const end = new Date();
    const start = new Date(end.getTime() - DAYS * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);
    async function query(body) {
        const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), ...body }),
            cache: "no-store",
        });
        if (!res.ok)
            throw new Error(`GSC query failed (${res.status}): ${await res.text()}`);
        return res.json();
    }
    const totals = await query({});
    const totalRow = totals.rows?.[0];
    const queries = await query({ dimensions: ["query"], rowLimit: 10 });
    const pages = await query({ dimensions: ["page"], rowLimit: 10 });
    return {
        clicks: Math.round(totalRow?.clicks ?? 0),
        impressions: Math.round(totalRow?.impressions ?? 0),
        topQueries: (queries.rows ?? []).map((r) => ({
            query: r.keys?.[0] ?? "",
            clicks: Math.round(r.clicks ?? 0),
            impressions: Math.round(r.impressions ?? 0),
        })),
        topPages: (pages.rows ?? []).map((r) => ({
            page: r.keys?.[0] ?? "",
            clicks: Math.round(r.clicks ?? 0),
            impressions: Math.round(r.impressions ?? 0),
        })),
    };
}
export async function getTrafficData() {
    const token = await getAccessToken();
    const [ga4Res, gscRes] = await Promise.allSettled([getGa4(token), getGsc(token)]);
    const reason = (r) => (r.reason instanceof Error ? r.reason.message : String(r.reason));
    return {
        rangeDays: DAYS,
        ga4: ga4Res.status === "fulfilled" ? ga4Res.value : null,
        ga4Error: ga4Res.status === "rejected" ? reason(ga4Res) : undefined,
        gsc: gscRes.status === "fulfilled" ? gscRes.value : null,
        gscError: gscRes.status === "rejected" ? reason(gscRes) : undefined,
    };
}
