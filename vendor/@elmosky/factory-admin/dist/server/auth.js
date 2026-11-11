/**
 * Admin auth: Supabase magic link + ADMIN_EMAILS allowlist, carried by a signed
 * HMAC cookie (the mechanics proven in zulvata's lib/auth.ts). One model for
 * every new site — the ADMIN_PASSWORD/SESSION_SECRET dialects are retired.
 *
 * Flow: POST auth/request {email} → allowlist check → Supabase sends the magic
 * link → GET auth/callback?token_hash → verifyOtp → allowlist check again →
 * signed cookie. ONE-TIME factory setup: the Supabase magic-link email template
 * must link to {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email
 * (auth.users is shared factory-wide, so this is set once for all sites).
 *
 * Break-glass: if ADMIN_PASSWORD is set, POST auth/bootstrap {password} still
 * works so a broken mailer can never lock the panel.
 */
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const COOKIE_NAME = "factory_admin";
const MAX_AGE_S = 60 * 60 * 24 * 7;
/**
 * Cookie-signing secret derived from the service key — already server-only and
 * high-entropy, so magic-link sites need no SESSION_SECRET env var at all.
 * SESSION_SECRET still wins if set (lets a site rotate sessions independently).
 */
function secret() {
    const s = process.env.SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!s || s.length < 16)
        throw new Error("factory-admin: no SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY to sign sessions.");
    return createHmac("sha256", s).update("factory-admin-session-v1").digest("hex");
}
function sign(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const mac = createHmac("sha256", secret()).update(body).digest("hex");
    return `${body}.${mac}`;
}
function unsign(token) {
    if (!token)
        return null;
    const dot = token.lastIndexOf(".");
    if (dot < 1)
        return null;
    const body = token.slice(0, dot);
    const mac = token.slice(dot + 1);
    const expected = createHmac("sha256", secret()).update(body).digest("hex");
    const a = Buffer.from(mac, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b))
        return null;
    try {
        const d = JSON.parse(Buffer.from(body, "base64url").toString());
        if (!d.exp || Date.now() > d.exp)
            return null;
        // Sessions signed before roles existed carry no role and are admins, which
        // is what they were. The re-check in getSession corrects it on the next hit.
        return { email: d.email, via: d.via, role: d.role === "partner" ? "partner" : "admin" };
    }
    catch {
        return null;
    }
}
function emailList(varName) {
    return (process.env[varName] ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}
export function allowedEmails() {
    return emailList("ADMIN_EMAILS");
}
export function partnerEmails() {
    return emailList("PARTNER_EMAILS");
}
/**
 * The role this email gets, or null if it gets nothing.
 *
 * ADMIN_EMAILS wins over PARTNER_EMAILS. An address in both is a mistake, and
 * resolving it upward means the mistake never locks an owner out of their own
 * panel.
 */
export function roleFor(email) {
    const e = email.trim().toLowerCase();
    if (allowedEmails().includes(e))
        return "admin";
    if (partnerEmails().includes(e))
        return "partner";
    return null;
}
export function isAllowed(email) {
    return roleFor(email) !== null;
}
export async function getSession() {
    const c = await cookies();
    const s = unsign(c.get(COOKIE_NAME)?.value);
    if (!s)
        return null;
    // Re-read the role from the env on every request so promoting, demoting or
    // removing somebody takes effect immediately rather than waiting out a cookie
    // that could be six days old.
    if (s.via === "magic-link") {
        const role = roleFor(s.email);
        if (!role)
            return null;
        return { ...s, role };
    }
    return s;
}
/** True when the session may do anything beyond submitting and reading its own pitches. */
export function isAdmin(session) {
    return session?.role === "admin";
}
export async function setSession(session) {
    const c = await cookies();
    c.set(COOKIE_NAME, sign({ ...session, exp: Date.now() + MAX_AGE_S * 1000 }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: MAX_AGE_S,
        path: "/",
    });
}
export async function clearSession() {
    const c = await cookies();
    c.delete(COOKIE_NAME);
}
function anonClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key)
        throw new Error("factory-admin: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set.");
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
function serviceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key)
        throw new Error("factory-admin: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set.");
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
/**
 * Per-site sender, or nothing.
 *
 * Supabase's own mailer is configured once per PROJECT, and the factory runs
 * every site on one project, so its sender name is one value for all of them. A
 * Dessertsgram sign-in link arriving from "LiveNiches" reads like phishing, and
 * lands in spam often enough that a contributor clicks the button again and
 * trips the 60s resend throttle. Which is exactly what happened.
 *
 * When these are set, the site sends the link itself, from its own domain, so
 * SPF and DKIM line up with the site the person is actually signing in to.
 * When they are not, we fall back to Supabase's mailer and nothing changes.
 */
function siteMailer() {
    const host = process.env.ADMIN_MAIL_HOST;
    const user = process.env.ADMIN_MAIL_USER;
    const pass = process.env.ADMIN_MAIL_PASS;
    if (!host || !user || !pass)
        return null;
    const port = Number(process.env.ADMIN_MAIL_PORT ?? 465);
    return { host, port, secure: port === 465, user, pass, from: process.env.ADMIN_MAIL_FROM || user };
}
/** True when this site sends its own sign-in mail rather than leaning on Supabase's shared sender. */
export function hasSiteMailer() {
    return siteMailer() !== null;
}
function signInEmail(siteName, link) {
    return {
        subject: `Sign in to ${siteName}`,
        text: `Here's your sign-in link for ${siteName}:\n\n${link}\n\nIt works once and expires in 24 hours. If you didn't ask for it, ignore this email.\n`,
        html: `<p>Here's your sign-in link for <strong>${siteName}</strong>:</p>` +
            `<p><a href="${link}">Sign in to ${siteName}</a></p>` +
            `<p style="color:#666;font-size:13px">It works once and expires in 24 hours. ` +
            `If you didn't ask for it, ignore this email.</p>`,
    };
}
/**
 * Email the magic link. Response is identical whether or not the address is
 * allowlisted, so this can never be used to enumerate who has access.
 */
export async function requestMagicLink(email, callbackUrl, siteName = "the site") {
    if (!isAllowed(email))
        return; // silent — no user enumeration
    const mailer = siteMailer();
    if (!mailer) {
        const { error } = await anonClient().auth.signInWithOtp({
            email,
            options: { emailRedirectTo: callbackUrl },
        });
        if (error)
            throw new Error(`magic link send failed: ${error.message}`);
        return;
    }
    // generateLink mints the token WITHOUT sending anything, which is the whole
    // point: the send is ours, so the From line is ours.
    const { data, error } = await serviceClient().auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: callbackUrl },
    });
    if (error)
        throw new Error(`magic link send failed: ${error.message}`);
    const hash = data?.properties?.hashed_token;
    if (!hash)
        throw new Error("magic link send failed: no token returned");
    // callbackUrl already carries a query string, so this appends.
    const link = `${callbackUrl}&token_hash=${hash}&type=email`;
    const { subject, text, html } = signInEmail(siteName, link);
    // Imported lazily so a site that uses the Supabase mailer never pays for it.
    const { createTransport } = await import("nodemailer");
    const transport = createTransport({
        host: mailer.host,
        port: mailer.port,
        secure: mailer.secure,
        auth: { user: mailer.user, pass: mailer.pass },
    });
    await transport.sendMail({
        from: `"${siteName}" <${mailer.from}>`,
        to: email,
        subject,
        text,
        html,
    });
}
/** Verify the token_hash from the emailed link; returns the email if valid AND allowlisted. */
export async function verifyMagicLink(tokenHash) {
    const { data, error } = await anonClient().auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    const email = data?.user?.email;
    if (error || !email || !isAllowed(email))
        return null;
    return email;
}
function ctEq(a, b) {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && timingSafeEqual(ab, bb);
}
export function bootstrapOk(password) {
    const master = process.env.ADMIN_PASSWORD;
    return !!master && ctEq(password, master);
}
