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
export { checkAbuseGuard, clientIp, type AbuseGuardInput, type GuardResult, type RateLimitStore, } from "./abuse-guard";
export interface SubscriberStore {
    from(table: string): {
        upsert(rows: Record<string, unknown> | Record<string, unknown>[], opts?: {
            onConflict?: string;
        }): PromiseLike<unknown>;
    };
}
export type SubscribeResult = {
    ok: boolean;
    /** True when the sending platform accepted the subscriber. */
    synced: boolean;
    /** Set when the platform rejected or was unreachable; the local save still happened. */
    syncError?: string;
    /** True when no platform is configured yet, so signups collect locally only. */
    providerUnconfigured?: boolean;
};
export interface BeehiivConfig {
    apiKey: string;
    publicationId: string;
    /** Where the signup happened, passed through so beehiiv reporting is useful. */
    utmSource?: string;
}
/** Reads beehiiv config from the environment; undefined when not set up yet. */
export declare function beehiivFromEnv(): BeehiivConfig | undefined;
export declare function isValidEmail(email: string): boolean;
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
export declare function syncToBeehiiv(email: string, cfg: BeehiivConfig, opts?: {
    source?: string;
    referringSite?: string;
}): Promise<{
    ok: true;
    status?: string;
} | {
    ok: false;
    error: string;
}>;
/**
 * The one call a site's /api/subscribe route should make.
 *
 * Local save first, provider second, and a provider failure is reported but
 * never turns into an error for the person who just typed their email: from
 * their side they subscribed, and they did.
 */
export declare function subscribe(store: SubscriberStore, input: {
    email: string;
    source?: string;
    referringSite?: string;
}, cfg?: BeehiivConfig | undefined): Promise<SubscribeResult>;
/**
 * Subscribers saved locally while the platform was unconfigured or failing.
 * Run after adding the beehiiv keys so the backlog is not stranded.
 */
export declare function backfillToBeehiiv(emails: string[], cfg: BeehiivConfig, opts?: {
    onResult?: (email: string, ok: boolean, detail?: string) => void;
}): Promise<{
    synced: number;
    failed: number;
}>;
