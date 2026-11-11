/**
 * createAdminRoutes(config, hooks) — one catch-all Next.js route handler that
 * replaces the ~15 api/admin/* route files each site used to copy.
 *
 * Site integration (app/api/admin/[...route]/route.ts):
 *   import { createAdminRoutes } from "@elmosky/factory-admin/server";
 *   import { adminConfig, adminHooks } from "@/lib/admin-config";
 *   export const { GET, POST, PATCH, DELETE } = createAdminRoutes(adminConfig, adminHooks);
 */
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createFactoryClient } from "@elmosky/factory-db";
import { defaultPostPath } from "../config.js";
import { getSession, setSession, clearSession, requestMagicLink, verifyMagicLink, bootstrapOk, roleFor, } from "./auth.js";
import { getTrafficData } from "./traffic.js";
export { getSession } from "./auth.js";
export { getTrafficData } from "./traffic.js";
const POST_FIELDS = [
    "title", "slug", "status", "category", "excerpt", "body_html",
    "focus_keyword", "seo_title", "meta_description", "featured_image", "tags",
];
/**
 * Where supplied (as opposed to AI-generated) article images go. Same bucket the
 * writer pipeline and the image agent already publish into, so a site's pictures
 * live in one place regardless of which of the three made them.
 */
const IMAGE_BUCKET = "featured-images";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
};
/**
 * Uploads were stored byte-for-byte, and full-size images served straight from
 * the shared bucket are what used up the factory's egress and locked every site
 * on 2026-09-22. Shrink before storing: photos to JPEG q78 at most 1600px wide
 * (JPEG, not WebP, because the social-card renderer and link-preview scrapers
 * read it), images with transparency to WebP so the alpha survives. GIF (may be
 * animated) and AVIF (already small) pass through. If sharp can't load, the
 * original is stored as before.
 */
const UPLOAD_MAX_WIDTH = 1600;
async function shrinkUpload(bytes, type) {
    const original = { bytes, type, ext: ALLOWED_IMAGE_TYPES[type] };
    if (!["image/jpeg", "image/png", "image/webp"].includes(type))
        return original;
    try {
        const sharp = (await import("sharp")).default;
        const img = sharp(bytes).rotate().resize({ width: UPLOAD_MAX_WIDTH, withoutEnlargement: true });
        const { hasAlpha } = await sharp(bytes).metadata();
        const out = hasAlpha
            ? { bytes: await img.webp({ quality: 85 }).toBuffer(), type: "image/webp", ext: "webp" }
            : { bytes: await img.jpeg({ quality: 78, mozjpeg: true }).toBuffer(), type: "image/jpeg", ext: "jpg" };
        return out.bytes.length < bytes.length ? out : original;
    }
    catch (err) {
        console.warn("[factory-admin] image shrink skipped:", err instanceof Error ? err.message : err);
        return original;
    }
}
const json = (body, status = 200) => NextResponse.json(body, { status });
const unauthorized = () => json({ error: "unauthorized" }, 401);
const forbidden = () => json({ error: "forbidden" }, 403);
const notFound = () => json({ error: "not found" }, 404);
/** Columns a pitch submitter owns. Everything else on the row is the editor's. */
const PITCH_SUBMIT_FIELDS = ["title", "idea", "body", "source_urls", "images", "category"];
/** Columns only an admin may set: the triage half of the row. */
const PITCH_TRIAGE_FIELDS = ["status", "scheduled_for", "editor_notes"];
function pick(src, fields) {
    const out = {};
    for (const f of fields)
        if (f in src)
            out[f] = src[f];
    return out;
}
/**
 * Pitch text is pasted by a contributor and lands in a draft the editor opens in
 * a rich-text editor, so it is escaped on the way in. Treating it as HTML would
 * let a pasted <script> ride into the post body.
 */
function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
/** Blank-line-separated pasted text into <p> blocks, escaped. */
function paragraphs(s) {
    return s
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
        .join("\n");
}
// Best-effort in-memory brute-force limiter for the break-glass password
// (per warm instance) — ported from the wmbff login route.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 7;
const attempts = new Map();
function clientIp(req) {
    const fwd = req.headers.get("x-forwarded-for");
    return (fwd ? fwd.split(",")[0] : "").trim() || req.headers.get("x-real-ip") || "unknown";
}
export function createAdminRoutes(config, hooks = {}) {
    let fcPromise = null;
    const fc = () => (fcPromise ??= createFactoryClient({ siteSlug: config.site.slug }));
    const postPath = config.panels.blog?.postPath ?? defaultPostPath;
    /**
     * Every response from this route is JSON, including the failures.
     *
     * Without this, any throw became an empty 500 with no content-type, and the
     * panel's `await res.json()` on the error path turned it into "Failed to
     * execute 'json' on 'Response': Unexpected end of JSON input" — which tells a
     * contributor nothing and looks like the site is broken. That is exactly what
     * a partner saw when Supabase refused a second magic link inside its 60s
     * smtp_max_frequency window, which is an ordinary "wait a moment", not a fault.
     */
    async function handle(req, ctx) {
        try {
            return await route_(req, ctx);
        }
        catch (e) {
            const raw = e instanceof Error ? e.message : String(e);
            // Supabase phrases its per-address email throttle as "For security
            // purposes, you can only request this after N seconds".
            const wait = raw.match(/only request this after (\d+) seconds?/i);
            if (wait) {
                return json({ error: `A sign-in link was just sent. Wait ${wait[1]} seconds and check your email, including spam.` }, 429);
            }
            if (/magic link send failed/i.test(raw)) {
                return json({ error: "Could not send the sign-in link. Try again in a minute." }, 502);
            }
            console.error("factory-admin route error:", raw);
            return json({ error: "Something went wrong. Try again." }, 500);
        }
    }
    async function route_(req, ctx) {
        const { route = [] } = await ctx.params;
        const path = route.join("/");
        const method = req.method;
        // ── auth endpoints (no session required) ──
        if (path === "auth/request" && method === "POST") {
            const { email } = (await req.json());
            if (!email)
                return json({ error: "email required" }, 400);
            // Callback derives from the REQUEST origin, not config.site.url, so the
            // same flow works on localhost review, preview deploys, and production.
            // (The origin must be in the factory Supabase redirect allow-list.)
            const origin = new URL(req.url).origin;
            // The factory-wide email template appends "&token_hash=..." (ampersand),
            // so every callback URL must already carry a query string. liveniches set
            // the precedent (?next=...); the marker keeps the shared template universal.
            // The site's own name goes on the email, so the From line and the subject
            // match the site the person is signing in to.
            await requestMagicLink(email, `${origin}/api/admin/auth/callback?m=1`, config.site.name);
            return json({ ok: true }); // identical response either way — no enumeration
        }
        if (path === "auth/callback" && method === "GET") {
            const url = new URL(req.url);
            const tokenHash = url.searchParams.get("token_hash");
            const email = tokenHash ? await verifyMagicLink(tokenHash) : null;
            const role = email ? roleFor(email) : null;
            if (!email || !role)
                return NextResponse.redirect(`${url.origin}/admin?error=link`);
            await setSession({ email, via: "magic-link", role });
            return NextResponse.redirect(`${url.origin}/admin`);
        }
        if (path === "auth/bootstrap" && method === "POST") {
            const ip = clientIp(req);
            const now = Date.now();
            const rec = attempts.get(ip);
            if (rec && now < rec.resetAt && rec.fails >= MAX_FAILS)
                return json({ error: "too many attempts" }, 429);
            const { password } = (await req.json());
            if (!password || !bootstrapOk(password)) {
                const cur = rec && now < rec.resetAt ? rec : { fails: 0, resetAt: now + WINDOW_MS };
                cur.fails += 1;
                attempts.set(ip, cur);
                await new Promise((r) => setTimeout(r, 400));
                return json({ error: "invalid" }, 401);
            }
            attempts.delete(ip);
            // Break-glass is an owner recovering their own panel, so it is always an
            // admin session. Partners have no equivalent and use the magic link only.
            await setSession({ email: "bootstrap", via: "bootstrap", role: "admin" });
            return json({ ok: true });
        }
        if (path === "auth/logout" && method === "POST") {
            await clearSession();
            return json({ ok: true });
        }
        if (path === "auth/session" && method === "GET") {
            return json({ session: await getSession() });
        }
        // ── everything below requires a session ──
        const session = await getSession();
        if (!session)
            return unauthorized();
        const admin = session.role === "admin";
        // ── pitches: the only surface a partner can reach ──────────────────
        //
        // A partner sees their own rows and nothing else. That filter is applied
        // here on the server rather than in the panel, because a hidden tab is a
        // UI choice and this needs to be a rule.
        if (path === "pitches" && method === "GET") {
            if (!config.panels.pitches?.enabled)
                return notFound();
            const db = await fc();
            let q = db
                .from("pitches")
                .selectOwn(admin
                ? "id, title, idea, body, category, source_urls, images, status, scheduled_for, editor_notes, post_id, submitted_by, created_at, updated_at"
                : // A partner never receives editor_notes. It is where an editor says
                    // why they passed on something, and it is not written to be read
                    // by the person who pitched it.
                    "id, title, idea, body, category, source_urls, images, status, scheduled_for, post_id, created_at, updated_at")
                .order("created_at", { ascending: false });
            if (!admin)
                q = q.eq("submitted_by", session.email.toLowerCase());
            const { data } = await q;
            return json({ pitches: data ?? [], role: session.role });
        }
        if (path === "pitches" && method === "POST") {
            if (!config.panels.pitches?.enabled)
                return notFound();
            const raw = (await req.json().catch(() => ({})));
            const fields = pick(raw, PITCH_SUBMIT_FIELDS);
            const title = typeof fields.title === "string" ? fields.title.trim() : "";
            if (!title)
                return json({ error: "a title is required" }, 400);
            // Something has to be in the pitch besides a headline, or the queue fills
            // with one-line reminders nobody can act on.
            const hasSubstance = [fields.idea, fields.body, fields.source_urls].some((v) => typeof v === "string" && v.trim()) ||
                (Array.isArray(fields.images) && fields.images.length > 0);
            if (!hasSubstance)
                return json({ error: "add an idea, some copy, a link, or a picture" }, 400);
            const db = await fc();
            const { data } = await db
                .from("pitches")
                .insert({ ...fields, title, submitted_by: session.email.toLowerCase(), status: "new" })
                .select("id")
                .single();
            return json({ pitch: data });
        }
        const pitchMatch = path.match(/^pitches\/([0-9a-f-]{36})$/i);
        if (pitchMatch) {
            const id = pitchMatch[1];
            const db = await fc();
            if (!(await db.rowBelongsToSite("pitches", id)))
                return notFound();
            // Dynamic select strings defeat supabase-js's template-literal generics,
            // so the row is narrowed by hand here, as everywhere else in this file.
            const { data: existingRaw } = await db
                .from("pitches")
                .selectOwn("id, submitted_by, status")
                .eq("id", id)
                .single();
            const existing = existingRaw;
            const own = existing?.submitted_by === session.email.toLowerCase();
            if (!admin && !own)
                return notFound();
            if (method === "PATCH") {
                const raw = (await req.json().catch(() => ({})));
                // A partner may keep editing their own pitch until an editor has picked
                // it up. After that the row is the editor's working copy and changing it
                // underneath them loses their work.
                if (!admin) {
                    if (existing?.status !== "new")
                        return forbidden();
                    const fields = pick(raw, PITCH_SUBMIT_FIELDS);
                    if (!Object.keys(fields).length)
                        return json({ error: "nothing to update" }, 400);
                    await db.from("pitches").update(fields).eq("id", id);
                }
                else {
                    const fields = { ...pick(raw, PITCH_SUBMIT_FIELDS), ...pick(raw, PITCH_TRIAGE_FIELDS) };
                    if (!Object.keys(fields).length)
                        return json({ error: "nothing to update" }, 400);
                    await db.from("pitches").update(fields).eq("id", id);
                }
                const { data } = await db.from("pitches").selectOwn("*").eq("id", id).single();
                return json({ pitch: data });
            }
            if (method === "DELETE") {
                if (!admin && existing?.status !== "new")
                    return forbidden();
                await db.from("pitches").delete().eq("id", id);
                return json({ ok: true });
            }
        }
        /**
         * Promote a pitch into a draft post. Admin only.
         *
         * This is the handoff the whole panel exists for: it copies the pitch into a
         * real draft and records post_id on the pitch, so the article can always be
         * traced back to who brought it in. It deliberately does NOT publish, and it
         * does not run the rules, because what lands here is raw pasted copy that a
         * writer still has to turn into an article.
         */
        const promoteMatch = path.match(/^pitches\/([0-9a-f-]{36})\/promote$/i);
        if (promoteMatch && method === "POST") {
            if (!admin)
                return forbidden();
            const id = promoteMatch[1];
            const db = await fc();
            if (!(await db.rowBelongsToSite("pitches", id)))
                return notFound();
            const { data: pitchRaw } = await db
                .from("pitches")
                .selectOwn("id, title, idea, body, category, source_urls, images, submitted_by, post_id")
                .eq("id", id)
                .single();
            const pitch = pitchRaw;
            if (!pitch)
                return notFound();
            if (pitch.post_id)
                return json({ error: "this pitch already has a draft", postId: pitch.post_id }, 409);
            const slug = String(pitch.title)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 70) || `pitch-${id.slice(0, 8)}`;
            // The pitch's own words are carried into the draft as a brief the writer
            // works from, not as body copy pretending to be finished. Losing them in
            // the handoff is the failure this replaces.
            const brief = [
                pitch.idea ? `<p><strong>The pitch:</strong> ${escapeHtml(String(pitch.idea))}</p>` : "",
                pitch.source_urls ? `<p><strong>Links:</strong> ${escapeHtml(String(pitch.source_urls))}</p>` : "",
                `<p><em>Submitted by ${escapeHtml(String(pitch.submitted_by))}.</em></p>`,
                pitch.body ? `<hr /><p><strong>Pasted copy:</strong></p>${paragraphs(String(pitch.body))}` : "",
            ]
                .filter(Boolean)
                .join("\n");
            const { data: post } = await db
                .from("posts")
                .insert({
                title: pitch.title,
                slug: `${slug}-${id.slice(0, 4)}`,
                status: "draft",
                category: pitch.category ?? null,
                body_html: brief,
                featured_image: Array.isArray(pitch.images) && pitch.images.length ? pitch.images[0] : null,
            })
                .select("id, slug")
                .single();
            await db.from("pitches").update({ status: "writing", post_id: post?.id }).eq("id", id);
            return json({ post });
        }
        /**
         * Upload a supplied image (a real photograph, a hand-rendered card) into the
         * shared bucket and hand back its public URL.
         *
         * Until this existed the admin could only GENERATE an image via the agent, or
         * take a hand-typed path. Sites that deliberately use non-AI pictures — real
         * photos where the promise is that somebody actually made the thing, or
         * locally rendered art that costs no API spend — therefore had no way to store
         * one, and fell back to committing files into public/. That splits publishing
         * across two clocks: the database updates instantly, public/ only reaches
         * production on a deploy, so a post can reference a file the server does not
         * have yet. Every such image belongs here instead.
         *
         * The object key is content-addressed, which makes re-uploading the same file
         * idempotent and guarantees an edited image gets a NEW filename rather than
         * silently serving from a stale cache.
         *
         * Sits ABOVE the admin gate on purpose: a partner attaching pictures to a
         * pitch needs it. That is still an allowlisted, signed-in person, capped at
         * MAX_UPLOAD_BYTES and restricted to ALLOWED_IMAGE_TYPES, and an uploaded
         * object is not reachable from the site until an editor puts it in a post.
         */
        if (path === "upload-image" && method === "POST") {
            let form;
            try {
                form = await req.formData();
            }
            catch {
                return json({ error: "expected multipart/form-data with a 'file' field" }, 400);
            }
            const file = form.get("file");
            if (!(file instanceof File) || file.size === 0)
                return json({ error: "no file supplied" }, 400);
            const ext = ALLOWED_IMAGE_TYPES[file.type];
            if (!ext) {
                return json({ error: `unsupported type "${file.type || "unknown"}" — allowed: ${Object.keys(ALLOWED_IMAGE_TYPES).join(", ")}` }, 415);
            }
            if (file.size > MAX_UPLOAD_BYTES) {
                return json({ error: `file is ${(file.size / 1048576).toFixed(1)}MB, limit is ${MAX_UPLOAD_BYTES / 1048576}MB` }, 413);
            }
            const shrunk = await shrinkUpload(Buffer.from(await file.arrayBuffer()), file.type);
            const bytes = shrunk.bytes;
            const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 10);
            const stem = (file.name || "image")
                .replace(/\.[^.]+$/, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 60) || "image";
            const db = await fc();
            const key = `${db.siteSlug}/uploads/${stem}-${hash}.${shrunk.ext}`;
            const { error: upErr } = await db.raw.storage
                .from(IMAGE_BUCKET)
                .upload(key, bytes, { contentType: shrunk.type, upsert: true, cacheControl: "31536000" });
            if (upErr)
                return json({ error: `upload failed: ${upErr.message}` }, 502);
            const { data: pub } = db.raw.storage.from(IMAGE_BUCKET).getPublicUrl(key);
            return json({ url: pub.publicUrl, key, bytes: bytes.length });
        }
        // ── admin-only from here down ──────────────────────────────────────
        if (!admin)
            return forbidden();
        if (path === "posts" && method === "GET") {
            const db = await fc();
            const { data } = await db
                .from("posts")
                .selectOwn("id, title, slug, status, category, updated_at, published_at, publish_queued_at, seo_score")
                .order("updated_at", { ascending: false });
            return json({ posts: data ?? [] });
        }
        if (path === "posts" && method === "POST") {
            const body = (await req.json());
            const db = await fc();
            const { data } = await db
                .from("posts")
                .insert({
                title: body.title || "Untitled",
                slug: body.slug || `untitled-${Date.now()}`,
                status: "draft",
            })
                .select()
                .single();
            return json({ post: data });
        }
        const postMatch = path.match(/^posts\/([0-9a-f-]{36})$/);
        if (postMatch) {
            const id = postMatch[1];
            const db = await fc();
            if (!(await db.rowBelongsToSite("posts", id)))
                return notFound();
            if (method === "GET") {
                const { data } = await db.from("posts").selectOwn("*").eq("id", id).maybeSingle();
                return data ? json({ post: data }) : notFound();
            }
            if (method === "PATCH") {
                const body = (await req.json());
                const allowed = {};
                for (const k of POST_FIELDS)
                    if (k in body)
                        allowed[k] = body[k];
                // The editor sends a date to schedule a post or to publish a scheduled
                // one now. It was missing from POST_FIELDS, so both were dropped and the
                // old date stood: "Publish now instead" silently did nothing.
                if ("published_at" in body) {
                    const when = new Date(String(body.published_at));
                    if (Number.isNaN(when.getTime()))
                        return json({ error: "That publish date is not a valid date." }, 422);
                    allowed.published_at = when.toISOString();
                }
                const publishing = body.status === "published";
                if (publishing) {
                    // Publish gate: the site's hook runs rules (and the monetizer before
                    // them). A throw here rejects the publish with the message shown in
                    // the editor. It may also return field mutations (e.g. monetized body).
                    if (hooks.beforePublish) {
                        try {
                            const current = (await db.from("posts").selectOwn("*").eq("id", id).maybeSingle()).data ?? {};
                            const mutated = await hooks.beforePublish({ ...current, ...allowed });
                            if (mutated)
                                for (const k of POST_FIELDS)
                                    if (k in mutated)
                                        allowed[k] = mutated[k];
                        }
                        catch (e) {
                            return json({ error: e instanceof Error ? e.message : "publish rejected" }, 422);
                        }
                    }
                    // Only stamp a publish date when the post does not already have one.
                    //
                    // `allowed` holds the fields the editor SENT, so a save that does not
                    // touch the date left this undefined and stamped "now" over an
                    // existing one. Once the site began gating on published_at <= now,
                    // that turned every save of a scheduled post into an immediate
                    // publish: opening next Friday's article and fixing a typo would put
                    // it live on the spot, silently.
                    if (!("published_at" in allowed)) {
                        const existing = (await db.from("posts").selectOwn("published_at").eq("id", id).maybeSingle()).data;
                        allowed.published_at = existing?.published_at ?? new Date().toISOString();
                    }
                }
                allowed.updated_at = new Date().toISOString();
                const { data } = await db.from("posts").update(allowed).eq("id", id).select().single();
                const post = data;
                // Keep canonical_url in sync with the public URL — the affiliate
                // manager links to the live post through it.
                const canonical = `${config.site.url}${postPath({ category: post.category, slug: post.slug })}`;
                if (post.canonical_url !== canonical) {
                    await db.from("posts").update({ canonical_url: canonical }).eq("id", id);
                    post.canonical_url = canonical;
                }
                if (publishing && hooks.afterPublish)
                    hooks.afterPublish(post).catch(() => { });
                return json({ post });
            }
            if (method === "DELETE") {
                await db.from("posts").delete().eq("id", id);
                return json({ ok: true });
            }
        }
        const queueMatch = path.match(/^posts\/([0-9a-f-]{36})\/queue$/);
        if (queueMatch && method === "POST") {
            const { queued } = (await req.json());
            const db = await fc();
            if (!(await db.rowBelongsToSite("posts", queueMatch[1])))
                return notFound();
            await db
                .from("posts")
                .update({ publish_queued_at: queued ? new Date().toISOString() : null })
                .eq("id", queueMatch[1]);
            return json({ ok: true, queued: !!queued });
        }
        if (path === "subscribers" && method === "GET") {
            const db = await fc();
            const { data } = await db
                .from("subscribers")
                .selectOwn("id, email, source, status, created_at")
                .order("created_at", { ascending: false });
            return json({ subscribers: data ?? [] });
        }
        if (path === "subscribers/export" && method === "GET") {
            const db = await fc();
            const rows = await db.all(() => db.from("subscribers").selectOwn("email, created_at"));
            const csv = ["email,subscribed_at", ...rows.map((r) => `${r.email},${r.created_at}`)].join("\n");
            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="${config.site.slug}-subscribers.csv"`,
                },
            });
        }
        if (path === "traffic" && method === "GET") {
            if (!config.panels.traffic?.enabled)
                return json({ error: "traffic panel disabled" }, 404);
            try {
                return json(await getTrafficData());
            }
            catch (e) {
                return json({ error: e instanceof Error ? e.message : "traffic failed" }, 502);
            }
        }
        if (path === "health" && method === "GET") {
            const cfg = config.panels.health;
            if (!cfg?.enabled)
                return json({ error: "health panel disabled" }, 404);
            const db = await fc();
            const table = cfg.runsTable ?? "verification_runs";
            const { data } = await db.fromGlobal(table).select("*").order("created_at", { ascending: false }).limit(20);
            const rows = (data ?? []);
            const newest = rows[0]?.created_at ? new Date(rows[0].created_at).getTime() : 0;
            const staleAfterH = cfg.staleAfterHours ?? 36;
            return json({
                runs: rows,
                stale: !newest || Date.now() - newest > staleAfterH * 3600_000,
                staleAfterHours: staleAfterH,
            });
        }
        const dataMatch = path.match(/^data\/(\d+)$/);
        if (dataMatch && method === "GET") {
            const t = config.panels.data?.tables[Number(dataMatch[1])];
            if (!config.panels.data?.enabled || !t)
                return notFound();
            const db = await fc();
            // Dynamic select strings defeat supabase-js's generics — untyped on purpose.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let q = db.fromGlobal(t.table).select(t.select);
            if (t.siteScoped)
                q = q.eq("site_id", db.siteId);
            if (t.order) {
                const [col, dir] = t.order.split(".");
                q = q.order(col, { ascending: dir !== "desc" });
            }
            const { data } = await q.limit(t.limit ?? 100);
            return json({ label: t.label, rows: data ?? [] });
        }
        if (path === "regenerate-image" && method === "POST") {
            const agentUrl = process.env.FEATURED_IMAGE_AGENT_URL;
            const agentKey = process.env.FEATURED_IMAGE_AGENT_KEY;
            if (!agentUrl || !agentKey) {
                return json({ error: "featured-image-agent not configured (FEATURED_IMAGE_AGENT_URL / _KEY)" }, 501);
            }
            const { postId, guidance } = (await req.json());
            if (!postId)
                return json({ error: "postId required" }, 400);
            const db = await fc();
            if (!(await db.rowBelongsToSite("posts", postId)))
                return notFound();
            // The agent owns art direction via brandkit/<site>.json — the site passes
            // only identity, so a forked site can never inherit another site's style.
            const res = await fetch(`${agentUrl.replace(/\/$/, "")}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": agentKey },
                body: JSON.stringify({ site: config.site.slug, postId, guidance }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                return json({ error: data.error ?? `image agent ${res.status}` }, 502);
            return json(data);
        }
        return notFound();
    }
    return { GET: handle, POST: handle, PATCH: handle, DELETE: handle };
}
