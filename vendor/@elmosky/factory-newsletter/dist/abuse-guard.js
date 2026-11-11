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
const MIN_FILL_MS = 2500; // faster than this after render ⇒ a script
const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 6; // a 6h-old form token is stale
/** Verify a Turnstile token with Cloudflare. Skipped when no secret is set. */
async function verifyTurnstile(token, ip) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret)
        return { ok: true }; // not configured yet — do not block
    if (!token)
        return { ok: false, reason: "turnstile-missing" };
    try {
        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ secret, response: token, remoteip: ip }),
        });
        const body = (await res.json().catch(() => ({})));
        return body.success
            ? { ok: true }
            : { ok: false, reason: "turnstile-failed" };
    }
    catch {
        // A Cloudflare outage should not take the form down; the other layers hold.
        return { ok: true };
    }
}
/** Atomic durable rate check via the rate_limit_hit RPC. Fail-open on error. */
async function rateOk(store, bucket, max, windowSeconds) {
    const { data, error } = await store.rpc("rate_limit_hit", {
        p_bucket: bucket,
        p_max: max,
        p_window_seconds: windowSeconds,
    });
    if (error) {
        console.error("[abuse-guard] rate_limit_hit failed, allowing:", error);
        return true; // fail-open: never lock out real users over a store hiccup
    }
    return data === true;
}
export async function checkAbuseGuard(input) {
    // 1. Honeypot — a filled hidden field is a bot, every time.
    if (input.honeypot && input.honeypot.trim() !== "") {
        return { ok: false, reason: "honeypot" };
    }
    // 2. Time trap — too fast, or an implausibly stale form.
    if (typeof input.formLoadedAt === "number" && input.formLoadedAt > 0) {
        const age = Date.now() - input.formLoadedAt;
        if (age < MIN_FILL_MS)
            return { ok: false, reason: "too-fast" };
        if (age > MAX_FORM_AGE_MS)
            return { ok: false, reason: "stale-form" };
    }
    // 3. Turnstile (skipped when unconfigured).
    const t = await verifyTurnstile(input.turnstileToken, input.ip);
    if (!t.ok)
        return t;
    // 4. Durable rate limit (skipped when no store passed).
    if (input.store) {
        const perIpPerHour = input.limits?.perIpPerHour ?? 5;
        const perEmailPerDay = input.limits?.perEmailPerDay ?? 3;
        const ip = input.ip || "unknown";
        if (!(await rateOk(input.store, `${input.scope}:ip:${ip}`, perIpPerHour, 3600))) {
            return { ok: false, reason: "ip-rate-limited" };
        }
        if (input.email) {
            const email = input.email.trim().toLowerCase();
            if (!(await rateOk(input.store, `${input.scope}:email:${email}`, perEmailPerDay, 86400))) {
                return { ok: false, reason: "email-rate-limited" };
            }
        }
    }
    return { ok: true };
}
/** x-forwarded-for → first hop. Shared helper so every route reads IP alike. */
export function clientIp(req) {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd)
        return fwd.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "unknown";
}
