/**
 * Abuse guard for public, unauthenticated form endpoints (newsletter signup,
 * contact, teardown requests). Layered on purpose so a bot has to beat all of
 * them, and every layer is cheap:
 *
 *   1. Honeypot   — a hidden field humans never fill. Filled ⇒ silently drop.
 *   2. Time trap  — a form submitted implausibly fast after render is a script.
 *   3. Turnstile  — Cloudflare's free bot check. The strong layer.
 *   4. Rate limit — a durable per-IP / per-email cap, so even a request that
 *                   clears the others cannot be looped into a bombing run.
 *
 * Every layer degrades safely: with no Turnstile secret set it is skipped (so a
 * site keeps working before the keys are added), and with no rate-limit store
 * passed the rate check is skipped. The honeypot and time trap always run.
 *
 * The caller decides what a failure looks like to the client. Prefer returning
 * a normal 200 "ok" on a guard failure so a bot learns nothing — the point is
 * to drop the work (no email, no DB write, no LLM call), not to argue with it.
 */
export interface RateLimitStore {
    /** Supabase client shape: rpc(fn, args) → { data, error }. */
    rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
        data: unknown;
        error: unknown;
    }>;
}
export interface AbuseGuardInput {
    /** Namespaces the rate buckets, e.g. "subscribe" | "teardown" | "contact". */
    scope: string;
    /** Client IP, from x-forwarded-for. */
    ip: string;
    /** Optional, lowercased before use. Enables the per-email cap. */
    email?: string;
    /** Hidden honeypot field value. Must be empty for a human. */
    honeypot?: string;
    /** ms-epoch the form was rendered (hidden field). Enables the time trap. */
    formLoadedAt?: number;
    /** Cloudflare Turnstile token (cf-turnstile-response). */
    turnstileToken?: string;
    /** Durable store for the rate limit. Omit to skip the rate check. */
    store?: RateLimitStore;
    /** Overrides for the caps. */
    limits?: {
        perIpPerHour?: number;
        perEmailPerDay?: number;
    };
}
export type GuardResult = {
    ok: true;
} | {
    ok: false;
    reason: string;
};
export declare function checkAbuseGuard(input: AbuseGuardInput): Promise<GuardResult>;
/** x-forwarded-for → first hop. Shared helper so every route reads IP alike. */
export declare function clientIp(req: Request): string;
