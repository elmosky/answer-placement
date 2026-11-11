"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * AdminApp — the whole /admin UI as one component. Site integration
 * (app/admin/page.tsx):
 *
 *   'use client'
 *   import { AdminApp } from "@elmosky/factory-admin";
 *   import adminConfig from "../../admin.config.json";
 *   export default function Admin() { return <AdminApp config={adminConfig} />; }
 *
 * Styling uses the factory's semantic Tailwind tokens (surface, primary, ...).
 * The site's Tailwind must scan this package: add to globals.css
 *   @source "../node_modules/@elmosky/factory-admin/dist";
 */
import { useCallback, useEffect, useState } from "react";
import { PostEditor } from "./post-editor.js";
import { Pitches } from "./pitches.js";
/** Published with a future date: the site 404s it until then, so it is not live. */
const isScheduled = (p) => p.status === "published" && !!p.published_at && new Date(p.published_at) > new Date();
import { defaultPostPath } from "../config.js";
export { PostEditor } from "./post-editor.js";
export { SeoPanel } from "./seo-panel.js";
export { TiptapEditor } from "./tiptap.js";
export { Pitches } from "./pitches.js";
export function AdminApp({ config }) {
    const [session, setSession] = useState(undefined);
    useEffect(() => {
        fetch("/api/admin/auth/session")
            .then((r) => r.json())
            .then((d) => setSession(d.session ?? null))
            .catch(() => setSession(null));
    }, []);
    if (session === undefined)
        return _jsx(Shell, { config: config, children: _jsx("p", { className: "text-on-surface-variant p-8", children: "Loading\u2026" }) });
    if (!session)
        return _jsx(Shell, { config: config, children: _jsx(Gate, {}) });
    return _jsx(Panels, { config: config, session: session });
}
/** Signed-out frame: the sign-in card under a plain site header. */
function Shell({ config, children }) {
    return (_jsxs("div", { className: "min-h-screen bg-surface-container-low", children: [_jsx("header", { className: "bg-surface border-b border-surface-variant px-6 py-4", children: _jsxs("h1", { className: "font-headline-md text-on-surface", children: [config.site.name, " ", _jsx("span", { className: "text-on-surface-variant font-normal", children: "admin" })] }) }), _jsx("main", { className: "max-w-6xl mx-auto px-6 py-8", children: children })] }));
}
function Gate() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState("email");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    /**
     * Never call res.json() straight on an error response. A 500 from the edge
     * can have an empty body, and the parse failure then REPLACES the real
     * problem with "Unexpected end of JSON input" in front of the user.
     */
    async function errorFrom(res, fallback) {
        const body = await res.text().catch(() => "");
        try {
            return JSON.parse(body).error || fallback;
        }
        catch {
            return fallback;
        }
    }
    async function submit() {
        setBusy(true);
        setError("");
        try {
            if (mode === "email") {
                const res = await fetch("/api/admin/auth/request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
                if (!res.ok)
                    throw new Error(await errorFrom(res, "Could not send the link. Try again in a minute."));
                setSent(true);
            }
            else {
                const res = await fetch("/api/admin/auth/bootstrap", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password }),
                });
                if (!res.ok)
                    throw new Error(await errorFrom(res, "Invalid"));
                location.reload();
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Failed");
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsx("div", { className: "max-w-sm mx-auto mt-16 bg-surface rounded-xl border border-surface-variant p-6", children: sent ? (_jsx("p", { className: "text-on-surface", children: "Check your email for the sign-in link. You can close this tab." })) : (_jsxs(_Fragment, { children: [_jsx("h2", { className: "font-label-bold text-on-surface mb-4", children: "Sign in" }), mode === "email" ? (_jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), onKeyDown: (e) => e.key === "Enter" && submit(), placeholder: "you@example.com", className: "w-full px-3 py-2.5 border-2 border-outline-variant rounded-lg bg-surface text-on-surface" })) : (_jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), onKeyDown: (e) => e.key === "Enter" && submit(), placeholder: "Break-glass password", className: "w-full px-3 py-2.5 border-2 border-outline-variant rounded-lg bg-surface text-on-surface" })), _jsx("button", { onClick: submit, disabled: busy, className: "w-full mt-3 bg-primary text-on-primary py-2.5 rounded-full font-label-bold disabled:opacity-50", children: busy ? "…" : mode === "email" ? "Email me a sign-in link" : "Sign in" }), error && _jsx("p", { className: "text-error text-sm mt-2", children: error }), _jsx("button", { onClick: () => setMode(mode === "email" ? "password" : "email"), className: "w-full mt-3 text-xs text-on-surface-variant hover:underline", children: mode === "email" ? "Use break-glass password instead" : "Use email link instead" })] })) }));
}
function pagesFor(config, role) {
    const pages = [];
    if (config.panels.pitches?.enabled) {
        pages.push({
            key: "pitches",
            label: role === "partner" ? "Pitch an idea" : "Pitches",
            emoji: "💡",
            description: "Ideas, copy and pictures sent in by partners",
        });
    }
    // A partner gets the pitches page and nothing else. The server enforces the
    // same thing on every route, so this is only about not showing a door that
    // does not open.
    if (role === "admin") {
        if (config.panels.subscribers?.enabled) {
            pages.push({ key: "subscribers", label: "Subscribers", emoji: "📬", description: "Newsletter list with CSV export" });
        }
        if (config.panels.data?.enabled) {
            const first = config.panels.data.tables[0]?.label;
            pages.push({
                key: "data",
                label: config.panels.data.tables.length === 1 && first ? first : "Data",
                emoji: "🗂️",
                description: config.panels.data.tables.length === 1 && first
                    ? `Latest ${first.toLowerCase()}, newest first`
                    : config.panels.data.tables.map((t) => t.label).join(", "),
            });
        }
        if (config.panels.traffic?.enabled) {
            pages.push({ key: "traffic", label: "Traffic", emoji: "📊", description: "GA4 + Search Console: visitors, top pages and queries (28d)" });
        }
        if (config.panels.health?.enabled) {
            pages.push({ key: "health", label: "Health", emoji: "🩺", description: "Recent scheduled runs and whether they went stale" });
        }
    }
    return pages;
}
function useHashPage(fallback) {
    const read = () => (typeof location === "undefined" ? "" : location.hash.replace(/^#/, ""));
    const [page, setPage] = useState(() => read() || fallback);
    useEffect(() => {
        const onHash = () => setPage(read() || fallback);
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, [fallback]);
    const go = (key) => {
        location.hash = key === fallback ? "" : key;
        setPage(key);
        window.scrollTo(0, 0);
    };
    return [page, go];
}
function Panels({ config, session }) {
    const role = session.role ?? "admin";
    const pages = pagesFor(config, role);
    const blogOn = role === "admin" && config.panels.blog?.enabled !== false;
    const home = blogOn ? "home" : pages[0]?.key ?? "home";
    const [page, go] = useHashPage(home);
    const [editingPost, setEditingPost] = useState(null);
    const [counts, setCounts] = useState("");
    const extra = role === "admin" ? config.links?.nav ?? [] : [];
    const linkClass = (active) => `font-label-bold text-sm whitespace-nowrap hover:text-primary ${active ? "text-primary" : "text-on-surface-variant"}`;
    return (_jsxs("div", { className: "min-h-screen bg-surface-container-low", children: [_jsx("header", { className: "bg-surface border-b border-surface-variant", children: _jsxs("div", { className: "max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-x-6 gap-y-3 flex-wrap", children: [_jsxs("div", { className: "flex items-baseline gap-3 min-w-0 flex-wrap", children: [_jsxs("button", { onClick: () => { setEditingPost(null); go(home); }, className: "font-headline-md text-primary", children: [config.site.name, " ", _jsx("span", { className: "text-on-surface-variant font-normal", children: "admin" })] }), counts && _jsx("span", { className: "font-label-sm text-on-surface-variant", children: counts })] }), _jsxs("nav", { className: "flex items-center gap-x-5 gap-y-2 flex-wrap", children: [blogOn && (_jsx("button", { onClick: () => { setEditingPost(null); go("home"); }, className: linkClass(page === "home"), children: "\uD83D\uDCDD Posts" })), pages.map((p) => (_jsxs("button", { onClick: () => { setEditingPost(null); go(p.key); }, className: linkClass(page === p.key), children: [p.emoji, " ", p.label] }, p.key))), extra.map((l) => (_jsxs("a", { href: l.href, className: linkClass(false), children: [l.emoji ?? "↗", " ", l.label] }, l.href))), _jsx("a", { href: config.site.url, target: "_blank", rel: "noreferrer", className: linkClass(false), children: "\uD83C\uDF10 View site \u2192" }), _jsx("button", { onClick: () => fetch("/api/admin/auth/logout", { method: "POST" }).then(() => location.reload()), className: linkClass(false), title: session.email, children: "Sign out" })] })] }) }), _jsxs("main", { className: "max-w-6xl mx-auto px-6 py-8", children: [!blogOn && pages.length === 0 && (_jsx("p", { className: "text-on-surface-variant bg-surface rounded-xl border border-surface-variant px-5 py-8", children: "This account has no panels enabled. Ask the site owner." })), page === "home" && blogOn && editingPost && (_jsxs("div", { children: [_jsx("button", { onClick: () => setEditingPost(null), className: "text-primary text-sm hover:underline mb-4", children: "\u2190 All posts" }), _jsx(PostEditor, { post: editingPost, siteUrl: config.site.url, postPath: config.panels.blog?.postPath ?? defaultPostPath, dripQueue: config.panels.blog?.dripQueue, sourceRow: config.links?.sourceRow, editorClass: config.panels.blog?.editorClass, editorWidth: config.panels.blog?.editorWidth, onSaved: () => { } })] })), page === "home" && blogOn && !editingPost && (_jsx(Home, { config: config, pages: pages, extra: extra, go: go, onOpen: setEditingPost, onCounts: setCounts })), page === "pitches" && _jsx(Pitches, { role: role, categories: config.panels.pitches?.categories }), role === "admin" && page === "subscribers" && _jsx(Subscribers, {}), role === "admin" && page === "data" && _jsx(DataPanel, { config: config }), role === "admin" && page === "traffic" && _jsx(Traffic, {}), role === "admin" && page === "health" && _jsx(Health, {})] })] }));
}
function PageTitle({ title, sub, action }) {
    return (_jsxs("section", { className: "mb-6 flex items-end justify-between gap-4 flex-wrap", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display-lg text-primary", children: title }), sub && _jsx("div", { className: "text-on-surface-variant text-sm mt-1", children: sub })] }), action] }));
}
/**
 * Work first: drafts (latest edit first), then scheduled (soonest first), then
 * live posts newest first. Ordering by last edit alone put whatever was
 * touched last at the top, which says nothing about what goes out next.
 */
function sortForQueue(posts) {
    const rank = (p) => (p.status !== "published" ? 0 : isScheduled(p) ? 1 : 2);
    const t = (v) => (v ? new Date(v).getTime() : 0);
    return [...posts].sort((a, b) => {
        const r = rank(a) - rank(b);
        if (r)
            return r;
        if (rank(a) === 0)
            return t(b.updated_at) - t(a.updated_at);
        if (rank(a) === 1)
            return t(a.published_at) - t(b.published_at);
        return t(b.published_at) - t(a.published_at);
    });
}
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");
function Home({ config, pages, extra, go, onOpen, onCounts, }) {
    const [posts, setPosts] = useState(null);
    const [creating, setCreating] = useState(false);
    const postPath = config.panels.blog?.postPath ?? defaultPostPath;
    const load = useCallback(() => {
        fetch("/api/admin/posts")
            .then((r) => r.json())
            .then((d) => setPosts(sortForQueue(d.posts ?? [])));
    }, []);
    useEffect(load, [load]);
    useEffect(() => {
        if (!posts)
            return;
        const scheduled = posts.filter(isScheduled).length;
        const live = posts.filter((p) => p.status === "published").length - scheduled;
        const drafts = posts.filter((p) => p.status === "draft").length;
        onCounts(`${live} published · ${scheduled ? `${scheduled} scheduled · ` : ""}${drafts} drafts · ${posts.length} total`);
    }, [posts, onCounts]);
    async function openFull(id) {
        const res = await fetch(`/api/admin/posts/${id}`);
        const d = await res.json();
        if (d.post)
            onOpen(d.post);
    }
    async function createPost() {
        setCreating(true);
        const res = await fetch("/api/admin/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        const d = await res.json();
        setCreating(false);
        if (d.post)
            onOpen(d.post);
    }
    const tools = [
        ...pages.map((p) => ({ key: p.key, href: `#${p.key}`, emoji: p.emoji, title: p.label, description: p.description, onClick: () => go(p.key) })),
        ...extra.map((l) => ({ key: l.href, href: l.href, emoji: l.emoji ?? "↗", title: l.label, description: l.description ?? "", onClick: undefined })),
    ];
    return (_jsxs("div", { children: [tools.length > 0 && (_jsxs("section", { className: "mb-10", children: [_jsx("h2", { className: "font-headline-md text-primary mb-3", children: "Tools" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: tools.map((t) => (_jsxs("a", { href: t.href, onClick: (e) => {
                                if (!t.onClick)
                                    return;
                                e.preventDefault();
                                t.onClick();
                            }, className: "bg-surface rounded-xl border border-surface-variant p-5 hover:border-primary transition-colors block", children: [_jsx("p", { className: "text-2xl mb-2", children: t.emoji }), _jsx("p", { className: "font-label-bold text-on-surface", children: t.title }), t.description && _jsx("p", { className: "font-label-sm text-on-surface-variant mt-1", children: t.description })] }, t.key))) })] })), _jsx(PageTitle, { title: "Posts", action: _jsx("button", { onClick: createPost, disabled: creating, className: "bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-bold text-sm disabled:opacity-50", children: creating ? "Creating…" : "+ New post" }) }), !posts ? (_jsx("p", { className: "text-on-surface-variant", children: "Loading posts\u2026" })) : posts.length === 0 ? (_jsx("div", { className: "bg-surface rounded-xl border border-surface-variant p-12 text-center text-on-surface-variant", children: "No posts yet. Press + New post to write the first one." })) : (_jsx("div", { className: "bg-surface rounded-xl border border-surface-variant overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-4 py-3", children: "Title" }), _jsx("th", { className: "text-left px-4 py-3", children: "Status" }), _jsx("th", { className: "text-left px-4 py-3 hidden sm:table-cell", children: "SEO" }), _jsx("th", { className: "text-left px-4 py-3 hidden md:table-cell", children: "Published" }), _jsx("th", { className: "text-left px-4 py-3 hidden md:table-cell", children: "Updated" })] }) }), _jsx("tbody", { children: posts.map((p) => (_jsxs("tr", { className: "border-t border-surface-variant hover:bg-surface-container-low transition-colors", children: [_jsxs("td", { className: "px-4 py-3", children: [_jsx("button", { onClick: () => openFull(p.id), className: "font-label-bold text-primary hover:underline text-left", children: p.title || "Untitled" }), _jsx("p", { className: "font-label-sm text-on-surface-variant mt-0.5 break-all", children: p.status === "published" && !isScheduled(p) ? (_jsxs("a", { href: `${config.site.url}${postPath(p)}`, target: "_blank", rel: "noreferrer", className: "hover:text-primary", children: [postPath(p), " \u2197"] })) : (postPath(p)) })] }), _jsxs("td", { className: "px-4 py-3", children: [_jsx("span", { className: `text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${isScheduled(p)
                                                    ? "bg-secondary-fixed text-on-secondary-fixed"
                                                    : p.status === "published"
                                                        ? "bg-primary-fixed text-on-primary-fixed"
                                                        : p.status === "archived"
                                                            ? "bg-surface-container text-on-surface-variant"
                                                            : "bg-secondary-fixed text-on-secondary-fixed"}`, children: isScheduled(p) ? "scheduled" : p.status }), p.publish_queued_at && _jsx("span", { className: "ml-2 text-xs text-on-surface-variant", children: "queued" })] }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant hidden sm:table-cell", children: p.seo_score ?? "—" }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant hidden md:table-cell", children: fmtDate(p.published_at) }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant hidden md:table-cell", children: fmtDate(p.updated_at) })] }, p.id))) })] }) }))] }));
}
function countBy(rows, key) {
    const m = new Map();
    for (const r of rows) {
        const v = (r[key] || "—").toString();
        m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
function Subscribers() {
    const [subs, setSubs] = useState(null);
    useEffect(() => {
        fetch("/api/admin/subscribers").then((r) => r.json()).then((d) => setSubs(d.subscribers ?? []));
    }, []);
    if (!subs)
        return _jsx("p", { className: "text-on-surface-variant", children: "Loading\u2026" });
    const byStatus = countBy(subs, "status");
    const bySource = countBy(subs, "source");
    return (_jsxs("div", { children: [_jsx(PageTitle, { title: "Newsletter subscribers", sub: _jsxs(_Fragment, { children: [_jsxs("p", { children: [subs.length, " total", byStatus.length > 0 && _jsxs(_Fragment, { children: [" \u00B7 ", byStatus.map(([s, n]) => `${n} ${s}`).join(" · ")] })] }), bySource.length > 0 && _jsxs("p", { className: "font-label-sm mt-1", children: ["Sources: ", bySource.map(([s, n]) => `${s} (${n})`).join(", ")] })] }), action: _jsx("a", { href: "/api/admin/subscribers/export", className: "bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-bold text-sm", children: "Export CSV" }) }), subs.length === 0 ? (_jsx("div", { className: "bg-surface rounded-xl border border-surface-variant p-12 text-center text-on-surface-variant", children: "No subscribers yet. Signups from the newsletter form will appear here." })) : (_jsx("div", { className: "bg-surface rounded-xl border border-surface-variant overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-4 py-2", children: "Email" }), _jsx("th", { className: "text-left px-4 py-2", children: "Source" }), _jsx("th", { className: "text-left px-4 py-2", children: "Status" }), _jsx("th", { className: "text-left px-4 py-2", children: "Signed up" })] }) }), _jsx("tbody", { children: subs.map((s) => (_jsxs("tr", { className: "border-t border-surface-variant", children: [_jsx("td", { className: "px-4 py-3 font-label-bold text-on-surface break-all", children: s.email }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant", children: s.source ?? "—" }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `text-xs px-2 py-0.5 rounded-full font-medium ${s.status === "confirmed"
                                                ? "bg-primary-fixed text-on-primary-fixed"
                                                : s.status === "unsubscribed"
                                                    ? "bg-error-container text-on-error-container"
                                                    : "bg-secondary-fixed text-on-secondary-fixed"}`, children: s.status ?? "—" }) }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant", children: fmtDate(s.created_at) })] }, s.id))) })] }) }))] }));
}
function DataPanel({ config }) {
    const tables = config.panels.data?.tables ?? [];
    const [idx, setIdx] = useState(0);
    const [rows, setRows] = useState(null);
    useEffect(() => {
        setRows(null);
        fetch(`/api/admin/data/${idx}`).then((r) => r.json()).then((d) => setRows(d.rows ?? []));
    }, [idx]);
    const cols = rows?.[0] ? Object.keys(rows[0]) : [];
    // Timestamps come back as ISO strings; show them as dates people read.
    const cell = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v).toLocaleString() : String(v ?? "—");
    return (_jsxs("div", { children: [_jsx(PageTitle, { title: tables[idx]?.label ?? "Data", sub: rows ? `${rows.length} rows` : undefined }), tables.length > 1 && (_jsx("div", { className: "flex gap-1 mb-4 flex-wrap", children: tables.map((t, i) => (_jsx("button", { onClick: () => setIdx(i), className: `px-3 py-1.5 rounded-full text-xs font-label-bold ${i === idx ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"}`, children: t.label }, i))) })), !rows ? (_jsx("p", { className: "text-on-surface-variant", children: "Loading\u2026" })) : rows.length === 0 ? (_jsx("div", { className: "bg-surface rounded-xl border border-surface-variant p-12 text-center text-on-surface-variant", children: "No rows yet." })) : (_jsx("div", { className: "bg-surface rounded-xl border border-surface-variant overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant", children: _jsx("tr", { children: cols.map((c) => (_jsx("th", { className: "text-left px-4 py-2 whitespace-nowrap", children: c.replace(/_/g, " ") }, c))) }) }), _jsx("tbody", { children: rows.map((r, i) => (_jsx("tr", { className: "border-t border-surface-variant", children: cols.map((c) => (_jsx("td", { className: "px-4 py-3 text-on-surface", children: cell(r[c]) }, c))) }, i))) })] }) }))] }));
}
function Traffic() {
    const [data, setData] = useState(undefined);
    useEffect(() => {
        fetch("/api/admin/traffic").then((r) => r.json()).then(setData).catch(() => setData(null));
    }, []);
    if (data === undefined)
        return _jsx("p", { className: "text-on-surface-variant", children: "Loading traffic\u2026" });
    const days = data?.rangeDays ?? 28;
    return (_jsxs("div", { className: "space-y-8", children: [_jsx(PageTitle, { title: "Traffic", sub: `Google Analytics 4 + Search Console · last ${days} days` }), !data || data.error ? (_jsxs("div", { className: "bg-error-container text-on-error-container rounded-xl p-5", children: [_jsx("p", { className: "font-label-bold mb-1", children: "Couldn\u2019t load traffic data" }), _jsxs("p", { className: "text-xs font-mono break-words", children: [data?.error ?? "The traffic request failed.", " Needs GA4_PROPERTY_ID, GSC_SITE_URL and the Google OAuth trio."] })] })) : (_jsxs(_Fragment, { children: [_jsxs("section", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx(Stat, { label: "Users", value: data.ga4?.users, source: "GA4" }), _jsx(Stat, { label: "Sessions", value: data.ga4?.sessions, source: "GA4" }), _jsx(Stat, { label: "Clicks", value: data.gsc?.clicks, source: "Search" }), _jsx(Stat, { label: "Impressions", value: data.gsc?.impressions, source: "Search" })] }), data.ga4Error && _jsx(SourceError, { name: "Google Analytics", error: data.ga4Error }), data.gscError && _jsx(SourceError, { name: "Search Console", error: data.gscError }), _jsxs("section", { children: [_jsx("h2", { className: "font-headline-md text-primary mb-3", children: "Top pages (GA4 \u00B7 by views)" }), _jsx(DataTable, { head: ["Page", "Views"], empty: !data.ga4?.topPages.length, children: data.ga4?.topPages.map((p) => (_jsxs("tr", { className: "border-t border-surface-variant", children: [_jsx("td", { className: "px-4 py-3 font-mono text-xs text-on-surface-variant break-all", children: p.path }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant", children: p.views.toLocaleString() })] }, p.path))) })] }), _jsxs("section", { children: [_jsx("h2", { className: "font-headline-md text-primary mb-3", children: "Top search queries" }), _jsx(DataTable, { head: ["Query", "Clicks", "Impressions"], empty: !data.gsc?.topQueries.length, children: data.gsc?.topQueries.map((q) => (_jsxs("tr", { className: "border-t border-surface-variant", children: [_jsx("td", { className: "px-4 py-3 font-label-bold text-on-surface", children: q.query }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant", children: q.clicks.toLocaleString() }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant", children: q.impressions.toLocaleString() })] }, q.query))) })] }), _jsxs("section", { children: [_jsx("h2", { className: "font-headline-md text-primary mb-3", children: "Top search pages" }), _jsx(DataTable, { head: ["Page", "Clicks", "Impressions"], empty: !data.gsc?.topPages.length, children: data.gsc?.topPages.map((p) => (_jsxs("tr", { className: "border-t border-surface-variant", children: [_jsx("td", { className: "px-4 py-3 font-mono text-xs text-on-surface-variant break-all", children: p.page }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant", children: p.clicks.toLocaleString() }), _jsx("td", { className: "px-4 py-3 text-on-surface-variant", children: p.impressions.toLocaleString() })] }, p.page))) })] })] }))] }));
}
function Stat({ label, value, source }) {
    return (_jsxs("div", { className: "bg-surface rounded-xl border border-surface-variant p-5", children: [_jsx("p", { className: "font-label-sm text-on-surface-variant", children: label }), _jsx("p", { className: "font-display-lg text-primary mt-1", children: value == null ? "—" : value.toLocaleString() }), _jsx("p", { className: "text-xs text-on-surface-variant mt-1", children: source })] }));
}
function SourceError({ name, error }) {
    return (_jsxs("p", { className: "text-xs text-on-surface-variant bg-surface rounded-xl border border-surface-variant px-4 py-3 break-words", children: [name, " unavailable: ", error] }));
}
function DataTable({ head, empty, children }) {
    if (empty) {
        return _jsx("div", { className: "bg-surface rounded-xl border border-surface-variant p-8 text-center text-on-surface-variant", children: "No data for this period." });
    }
    return (_jsx("div", { className: "bg-surface rounded-xl border border-surface-variant overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant", children: _jsx("tr", { children: head.map((h) => (_jsx("th", { className: "text-left px-4 py-2", children: h }, h))) }) }), _jsx("tbody", { children: children })] }) }));
}
function Health() {
    const [data, setData] = useState(null);
    useEffect(() => {
        fetch("/api/admin/health").then((r) => r.json()).then(setData);
    }, []);
    if (!data)
        return _jsx("p", { className: "text-on-surface-variant", children: "Loading\u2026" });
    return (_jsxs("div", { children: [_jsx("p", { className: `mb-4 font-label-bold ${data.stale ? "text-error" : "text-primary"}`, children: data.stale ? `⚠ Stale — no run in the last ${data.staleAfterHours}h` : "● Healthy" }), _jsxs("div", { className: "bg-surface rounded-xl border border-surface-variant divide-y divide-surface-variant text-xs", children: [data.runs.map((r, i) => (_jsx("pre", { className: "px-4 py-2.5 overflow-x-auto text-on-surface", children: JSON.stringify(r) }, i))), data.runs.length === 0 && _jsx("p", { className: "px-5 py-8 text-on-surface-variant text-sm", children: "No runs recorded." })] })] }));
}
