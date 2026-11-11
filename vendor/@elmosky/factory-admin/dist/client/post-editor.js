"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { TiptapEditor } from "./tiptap.js";
import { SeoPanel } from "./seo-panel.js";
export function PostEditor({ post, siteUrl, postPath, dripQueue, sourceRow, editorClass, editorWidth, onSaved }) {
    const [form, setForm] = useState({
        title: post.title,
        slug: post.slug,
        status: post.status,
        category: post.category ?? "",
        excerpt: post.excerpt ?? "",
        body_html: post.body_html ?? "",
        focus_keyword: post.focus_keyword ?? "",
        seo_title: post.seo_title ?? "",
        meta_description: post.meta_description ?? "",
        featured_image: post.featured_image ?? "",
        tags: (post.tags ?? []).join(", "),
    });
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState(null);
    const [error, setError] = useState("");
    const [regenerating, setRegenerating] = useState(false);
    const [imageGuidance, setImageGuidance] = useState("");
    const [uploading, setUploading] = useState(false);
    const [queued, setQueued] = useState(!!post.publish_queued_at);
    const [queueing, setQueueing] = useState(false);
    function update(k, v) {
        setForm((prev) => ({ ...prev, [k]: v }));
    }
    async function toggleQueue() {
        setQueueing(true);
        setError("");
        try {
            const next = !queued;
            const res = await fetch(`/api/admin/posts/${post.id}/queue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ queued: next }),
            });
            if (!res.ok)
                throw new Error((await res.json()).error ?? "Queue update failed");
            setQueued(next);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Queue update failed");
        }
        finally {
            setQueueing(false);
        }
    }
    // A supplied picture (real photo, hand-rendered card) goes into the same bucket
    // the agent and the writer publish into. Without this the only options were an
    // AI image or a hand-typed path, and a hand-typed path means a file committed to
    // public/, which does not reach production until someone remembers to deploy.
    async function uploadImage(file) {
        setUploading(true);
        setError("");
        try {
            const body = new FormData();
            body.append("file", file);
            const res = await fetch("/api/admin/upload-image", { method: "POST", body });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error ?? "Upload failed");
            update("featured_image", data.url);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed");
        }
        finally {
            setUploading(false);
        }
    }
    // On-brand featured image via the shared featured-image-agent (brandkit-driven).
    async function regenerateImage() {
        setRegenerating(true);
        setError("");
        try {
            const res = await fetch("/api/admin/regenerate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: post.id, guidance: imageGuidance.trim() || undefined }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error ?? "Regenerate failed");
            if (data.url)
                update("featured_image", data.url);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Regenerate failed");
        }
        finally {
            setRegenerating(false);
        }
    }
    // published_at is not part of `form` (it is not an edited field) but "Publish
    // now instead" has to send one, so overrides are widened by that key alone.
    async function save(overrides) {
        setSaving(true);
        setError("");
        // Merge any explicit overrides (e.g. { status: 'published' }) so the PATCH
        // can't be lost to a stale-closure read of `form` from before a state update.
        const payload = { ...form, ...overrides };
        if (overrides) {
            const { published_at: _pa, ...formOnly } = payload;
            setForm(formOnly);
        }
        try {
            const res = await fetch(`/api/admin/posts/${post.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...payload,
                    tags: payload.tags.split(",").map((t) => t.trim()).filter(Boolean),
                }),
            });
            if (!res.ok)
                throw new Error((await res.json()).error ?? "Save failed");
            setSavedAt(new Date().toLocaleTimeString());
            onSaved?.();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Save failed");
        }
        finally {
            setSaving(false);
        }
    }
    const wordCount = form.body_html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    // Published, but its date has not arrived. The site gates on
    // published_at <= now, so this post's URL 404s until then.
    const scheduled = form.status === "published" && !!post.published_at && new Date(post.published_at) > new Date();
    const body = (_jsxs(Field, { label: "Body", children: [_jsx(TiptapEditor, { value: form.body_html, onChange: (html) => update("body_html", html), contentClass: editorClass, contentWidth: editorWidth }), _jsxs("p", { className: "font-label-sm text-on-surface-variant mt-1", children: [wordCount, " words"] })] }));
    return (_jsxs("div", { className: "grid lg:grid-cols-[1fr_320px] gap-6", children: [_jsxs("div", { className: "space-y-5", children: [_jsx(Field, { label: "Title", children: _jsx("input", { value: form.title, onChange: (e) => update("title", e.target.value), className: "input" }) }), _jsx(Field, { label: "Slug", children: _jsx("input", { value: form.slug, onChange: (e) => update("slug", e.target.value), className: "input font-mono text-sm" }) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Field, { label: "Status", children: _jsxs("select", { value: form.status, onChange: (e) => update("status", e.target.value), className: "input", children: [_jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "published", children: "Published" }), _jsx("option", { value: "archived", children: "Archived" })] }) }), _jsx(Field, { label: "Category", children: _jsx("input", { value: form.category, onChange: (e) => update("category", e.target.value), className: "input" }) })] }), _jsx(Field, { label: "Focus Keyword", children: _jsx("input", { value: form.focus_keyword, onChange: (e) => update("focus_keyword", e.target.value), className: "input" }) }), _jsx(Field, { label: "Excerpt", children: _jsx("textarea", { rows: 2, value: form.excerpt, onChange: (e) => update("excerpt", e.target.value), className: "input" }) }), _jsxs(Field, { label: "SEO Title", children: [_jsx("input", { value: form.seo_title, onChange: (e) => update("seo_title", e.target.value), className: "input" }), _jsxs("p", { className: "font-label-sm text-on-surface-variant mt-1", children: [form.seo_title.length, " / 60 chars"] })] }), _jsxs(Field, { label: "Meta Description", children: [_jsx("textarea", { rows: 2, value: form.meta_description, onChange: (e) => update("meta_description", e.target.value), className: "input" }), _jsxs("p", { className: "font-label-sm text-on-surface-variant mt-1", children: [form.meta_description.length, " / 160 chars"] })] }), _jsxs(Field, { label: "Featured Image", children: [form.featured_image && (_jsx("div", { className: "mb-2 rounded-lg overflow-hidden border border-outline-variant inline-block max-w-md", children: _jsx("img", { src: form.featured_image, alt: "Featured", className: "w-full h-auto block" }) })), _jsx("input", { value: form.featured_image, onChange: (e) => update("featured_image", e.target.value), placeholder: "Image URL (auto-filled by pipeline)", className: "input font-mono text-xs" }), _jsx("textarea", { value: imageGuidance, onChange: (e) => setImageGuidance(e.target.value), disabled: regenerating, rows: 2, placeholder: 'What to make different about the image (e.g. "show the actual product, not a generic scene")', className: "input text-sm mt-2" }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [_jsx("button", { type: "button", onClick: regenerateImage, disabled: regenerating || uploading, className: "bg-secondary text-on-secondary font-label-bold px-4 py-2 rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity", children: regenerating ? "Generating new image…" : "↻ Regenerate image" }), _jsxs("label", { className: `font-label-bold px-4 py-2 rounded-full border border-outline-variant transition-opacity ${uploading || regenerating ? "opacity-50" : "cursor-pointer hover:opacity-90"}`, children: [uploading ? "Uploading…" : "↑ Upload a picture", _jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp,image/avif,image/gif", disabled: uploading || regenerating, className: "hidden", onChange: (e) => {
                                                    const f = e.target.files?.[0];
                                                    // Reset so re-picking the same file still fires onChange.
                                                    e.target.value = "";
                                                    if (f)
                                                        void uploadImage(f);
                                                } })] })] }), !form.featured_image && (_jsx("p", { className: "font-label-sm text-on-surface-variant mt-1", children: "No image yet. Regenerate builds one from this site's brand kit; upload puts your own picture in the shared bucket." }))] }), _jsx(Field, { label: "Tags (comma-separated)", children: _jsx("input", { value: form.tags, onChange: (e) => update("tags", e.target.value), className: "input" }) }), !editorWidth && body] }), _jsxs("aside", { className: "lg:sticky lg:top-24 self-start space-y-4", children: [_jsxs("div", { className: "bg-surface rounded-xl border border-surface-variant p-5", children: [_jsxs("div", { className: "mb-3 text-center", children: [_jsx("p", { className: "font-label-sm text-on-surface-variant uppercase tracking-widest mb-1", children: "Status" }), _jsx("p", { className: `font-headline-md font-bold ${scheduled ? "text-secondary" : form.status === "published" ? "text-primary" : form.status === "archived" ? "text-on-surface-variant" : "text-secondary"}`, children: scheduled
                                            ? "🕒 Scheduled"
                                            : form.status === "published"
                                                ? "🟢 Live"
                                                : form.status === "archived"
                                                    ? "⚪ Archived"
                                                    : "🟡 Draft" }), scheduled && (_jsxs("p", { className: "font-label-sm text-on-surface-variant mt-1", children: ["goes live ", new Date(post.published_at).toLocaleString(undefined, {
                                                weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                                            })] }))] }), form.status === "published" ? (_jsx("button", { onClick: () => save(), disabled: saving, className: "w-full bg-primary text-on-primary py-3 rounded-full font-label-bold hover:bg-primary-container disabled:opacity-50 transition-colors mb-2", children: saving ? "Updating…" : scheduled ? "Save changes" : "Update live post" })) : form.status === "draft" ? (_jsx("button", { onClick: () => save({ status: "published" }), disabled: saving, className: "w-full bg-primary text-on-primary py-3 rounded-full font-label-bold hover:bg-primary-container disabled:opacity-50 transition-colors mb-2", children: saving ? "Publishing..." : "Publish to live site →" })) : null, (form.status === "draft" || scheduled) && (_jsx(SchedulePicker, { current: scheduled ? post.published_at : null, saving: saving, onSchedule: (iso) => save({ status: "published", published_at: iso }) })), scheduled && (_jsx("button", { onClick: () => save({ published_at: new Date().toISOString() }), disabled: saving, className: "w-full bg-surface-container text-on-surface py-2.5 rounded-full font-label-bold hover:bg-surface-container-high disabled:opacity-50 transition-colors mb-2 text-sm", children: saving ? "Publishing…" : "Publish now instead" })), form.status === "published" ? (_jsx("button", { onClick: () => save({ status: "draft" }), disabled: saving, className: "w-full bg-surface-container text-on-surface py-2.5 rounded-full font-label-bold hover:bg-surface-container-high disabled:opacity-50 transition-colors mb-2 text-sm", children: saving ? "Unpublishing..." : "Unpublish (back to draft)" })) : (_jsx("button", { onClick: () => save(), disabled: saving, className: "w-full bg-surface-container text-on-surface py-2.5 rounded-full font-label-bold hover:bg-surface-container-high disabled:opacity-50 transition-colors mb-2 text-sm", children: saving ? "Saving..." : "Save changes only" })), savedAt && _jsxs("p", { className: "font-label-sm text-on-surface-variant text-center mt-2", children: ["Saved at ", savedAt] }), error && _jsx("p", { className: "text-error font-label-sm text-center mt-2", children: error }), dripQueue && form.status === "draft" && (_jsxs("div", { className: "mt-3 pt-3 border-t border-surface-variant", children: [_jsx("button", { onClick: toggleQueue, disabled: queueing, className: `w-full py-2.5 rounded-full font-label-bold text-sm transition-colors disabled:opacity-50 ${queued
                                            ? "bg-primary-container text-on-primary-container hover:opacity-90"
                                            : "bg-surface-container text-on-surface hover:bg-surface-container-high"}`, children: queueing ? "Updating…" : queued ? "✓ In publish queue — remove" : "＋ Add to publish queue" }), _jsx("p", { className: "font-label-sm text-on-surface-variant text-center mt-1.5", children: queued ? "Will auto-publish on the next drip slot." : "Drip-publishes on schedule, oldest first." })] })), form.status === "published" && !scheduled && (_jsx("a", { href: `${siteUrl}${postPath({ category: form.category, slug: form.slug })}`, target: "_blank", rel: "noopener noreferrer", className: "block w-full text-center mt-3 text-primary font-label-bold hover:underline text-sm", children: "View on live site \u2197" }))] }), _jsx(SeoPanel, { title: form.seo_title || form.title, slug: form.slug, metaDescription: form.meta_description, focusKeyword: form.focus_keyword, bodyHtml: form.body_html, seoScore: post.seo_score, siteUrl: siteUrl, sourceRowUrl: post.airtable_record_id && sourceRow ? sourceRow(post.airtable_record_id) : null })] }), editorWidth && _jsx("div", { className: "lg:col-span-2", children: body }), _jsx("style", { children: `
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1.5px solid var(--color-outline-variant, #c2c8c0);
          border-radius: 0.5rem;
          font-size: 0.95rem;
          background: var(--color-surface, #ffffff);
          color: var(--color-on-surface, #1a1c1e);
        }
        .input:focus {
          outline: none;
          border-color: var(--color-primary, #163422);
        }
      ` })] }));
}
function Field({ label, children }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "block font-label-bold text-on-surface mb-1.5 text-sm", children: label }), children] }));
}
/**
 * Queue a post for a future date. Saving it as published with that date is the
 * whole mechanism: the site only shows posts whose published_at has arrived and
 * refreshes every few minutes, so no cron is involved.
 */
function SchedulePicker({ current, saving, onSchedule }) {
    // datetime-local wants local time without a zone, e.g. 2026-10-05T09:00.
    const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const tomorrow9 = new Date();
    tomorrow9.setDate(tomorrow9.getDate() + 1);
    tomorrow9.setHours(9, 0, 0, 0);
    const [value, setValue] = useState(toLocalInput(current ? new Date(current) : tomorrow9));
    const when = value ? new Date(value) : null;
    const future = !!when && !Number.isNaN(when.getTime()) && when > new Date();
    return (_jsxs("div", { className: "mb-2 rounded-lg border border-surface-variant p-3", children: [_jsx("label", { className: "block font-label-sm text-on-surface-variant mb-1.5", children: current ? "Reschedule for" : "Or schedule for" }), _jsx("input", { type: "datetime-local", value: value, onChange: (e) => setValue(e.target.value), className: "input w-full" }), _jsx("button", { onClick: () => when && onSchedule(when.toISOString()), disabled: saving || !future, className: "w-full mt-2 bg-surface-container text-on-surface py-2.5 rounded-full font-label-bold hover:bg-surface-container-high disabled:opacity-50 transition-colors text-sm", children: saving ? "Saving…" : future ? (current ? "Move to this date" : "Schedule →") : "Pick a future time" })] }));
}
