/**
 * Newsletter signup for factory sites.
 *
 * The order is the whole point: **the subscriber lands in our own database
 * first**, then we try to sync them to the sending platform. If beehiiv is
 * down, rate-limiting us, or simply not configured yet, the person still
 * subscribed and we still have their email. A signup form that silently drops
 * a lead because a third party had a bad minute is the worst failure mode
 * here, and it is the default one if you call the provider first.
 *
 * Sending (confirmation, welcome, broadcasts) is the platform's job, not ours.
 * We do not run our own SMTP: deliverability is a full-time problem and the
 * free tier of a real platform solves it better than we can.
 */
/**
 * The subset of the factory client this module needs. Structural on purpose,
 * so the package does not depend on factory-db just to name a type.
 *
 * upsert returns PromiseLike, not Promise: supabase-js query builders are
 * thenables, not real Promises.
 */
export { checkAbuseGuard, clientIp, } from "./abuse-guard";
/** Reads beehiiv config from the environment; undefined when not set up yet. */
export function beehiivFromEnv() {
    const apiKey = process.env.BEEHIIV_API_KEY;
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
    if (!apiKey || !publicationId)
        return undefined;
    return { apiKey, publicationId };
}
export function isValidEmail(email) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
/**
 * Push one subscriber to beehiiv.
 *
 * `reactivate_existing: false` matters: someone who previously unsubscribed
 * should stay unsubscribed even if they hit the form again, because silently
 * resurrecting them is how a sender ends up in spam folders and, in some
 * jurisdictions, in trouble.
 *
 * beehiiv owns double opt-in and the welcome email (both on its free tier);
 * we do not duplicate them here.
 */
export async function syncToBeehiiv(email, cfg, opts = {}) {
    const url = `https://api.beehiiv.com/v2/publications/${cfg.publicationId}/subscriptions`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                reactivate_existing: false,
                send_welcome_email: true,
                utm_source: opts.source ?? cfg.utmSource ?? "site",
                ...(opts.referringSite ? { referring_site: opts.referringSite } : {}),
            }),
            signal: controller.signal,
        });
        const body = (await res.json().catch(() => ({})));
        if (!res.ok) {
            return { ok: false, error: `beehiiv ${res.status}: ${JSON.stringify(body).slice(0, 200)}` };
        }
        return { ok: true, status: body.data?.status };
    }
    catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    finally {
        clearTimeout(timeout);
    }
}
/**
 * The one call a site's /api/subscribe route should make.
 *
 * Local save first, provider second, and a provider failure is reported but
 * never turns into an error for the person who just typed their email: from
 * their side they subscribed, and they did.
 */
export async function subscribe(store, input, cfg = beehiivFromEnv()) {
    const email = input.email.trim().toLowerCase();
    await store.from("subscribers").upsert({ email, source: input.source ?? "site", status: "subscribed" }, { onConflict: "site_id,email" });
    if (!cfg)
        return { ok: true, synced: false, providerUnconfigured: true };
    const sync = await syncToBeehiiv(email, cfg, { source: input.source, referringSite: input.referringSite });
    if (!sync.ok) {
        // Loud in the logs, invisible to the visitor. The row is already saved, so
        // this is a reconciliation problem, not a lost lead.
        console.error("[newsletter] beehiiv sync failed for a saved subscriber:", sync.error);
        return { ok: true, synced: false, syncError: sync.error };
    }
    return { ok: true, synced: true };
}
/**
 * Subscribers saved locally while the platform was unconfigured or failing.
 * Run after adding the beehiiv keys so the backlog is not stranded.
 */
export async function backfillToBeehiiv(emails, cfg, opts = {}) {
    let synced = 0;
    let failed = 0;
    for (const email of emails) {
        const r = await syncToBeehiiv(email, cfg, { source: "backfill" });
        if (r.ok)
            synced++;
        else
            failed++;
        opts.onResult?.(email, r.ok, r.ok ? r.status : r.error);
        // beehiiv rate-limits; a backfill is never urgent enough to trip it.
        await new Promise((res) => setTimeout(res, 350));
    }
    return { synced, failed };
}
