"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The Pitches panel: two different screens behind one tab.
 *
 * A partner sees a submission form and their own pitches. An admin sees the
 * whole queue, gives a pitch a date on the calendar, and promotes it into a
 * draft post. Both are here rather than in two components because they are two
 * views of one row and they drift apart the moment they live in two files.
 */
import { useCallback, useEffect, useRef, useState } from "react";
const STATUSES = ["new", "scheduled", "writing", "written", "declined"];
const STATUS_STYLE = {
    new: "bg-secondary-fixed text-on-secondary-fixed",
    scheduled: "bg-primary-fixed text-on-primary-fixed",
    writing: "bg-primary-fixed text-on-primary-fixed",
    written: "bg-primary text-on-primary",
    declined: "bg-surface-container text-on-surface-variant",
};
/** What a partner is told each status means. Vague status names generate email. */
const STATUS_BLURB = {
    new: "Waiting to be read.",
    scheduled: "Accepted and on the calendar.",
    writing: "Being written up now.",
    written: "Written. It publishes on its date.",
    declined: "Not going ahead this time.",
};
const input = "w-full bg-surface-container-low border border-surface-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary";
const label = "block font-label-bold text-on-surface text-sm mb-1.5";
export function Pitches({ role, categories }) {
    const [pitches, setPitches] = useState(null);
    const load = useCallback(() => {
        fetch("/api/admin/pitches")
            .then((r) => r.json())
            .then((d) => setPitches(d.pitches ?? []))
            .catch(() => setPitches([]));
    }, []);
    useEffect(load, [load]);
    return (_jsxs("div", { className: "space-y-8", children: [role === "partner" && _jsx(SubmitForm, { categories: categories, onSubmitted: load }), pitches === null ? (_jsx("p", { className: "text-on-surface-variant", children: "Loading pitches\u2026" })) : (_jsx(Queue, { pitches: pitches, role: role, onChanged: load }))] }));
}
// ── submitting ───────────────────────────────────────────────────────
function SubmitForm({ categories, onSubmitted }) {
    const [title, setTitle] = useState("");
    const [idea, setIdea] = useState("");
    const [body, setBody] = useState("");
    const [category, setCategory] = useState("");
    const [sourceUrls, setSourceUrls] = useState("");
    const [images, setImages] = useState([]);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(0);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const fileRef = useRef(null);
    async function addFiles(files) {
        if (!files?.length)
            return;
        setError("");
        setUploading((n) => n + files.length);
        for (const file of Array.from(files)) {
            try {
                const form = new FormData();
                form.append("file", file);
                const res = await fetch("/api/admin/upload-image", { method: "POST", body: form });
                const d = await res.json();
                if (!res.ok)
                    throw new Error(d.error ?? "upload failed");
                setImages((prev) => (prev.includes(d.url) ? prev : [...prev, d.url]));
            }
            catch (e) {
                setError(e instanceof Error ? e.message : "upload failed");
            }
            finally {
                setUploading((n) => n - 1);
            }
        }
        if (fileRef.current)
            fileRef.current.value = "";
    }
    async function submit() {
        setBusy(true);
        setError("");
        try {
            const res = await fetch("/api/admin/pitches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, idea, body, category: category || null, source_urls: sourceUrls, images }),
            });
            const d = await res.json();
            if (!res.ok)
                throw new Error(d.error ?? "could not submit");
            setTitle("");
            setIdea("");
            setBody("");
            setCategory("");
            setSourceUrls("");
            setImages([]);
            setDone(true);
            onSubmitted();
            setTimeout(() => setDone(false), 4000);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "could not submit");
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "bg-surface rounded-xl border border-surface-variant p-6", children: [_jsx("h2", { className: "font-label-bold text-on-surface mb-1", children: "Pitch something" }), _jsx("p", { className: "text-on-surface-variant text-sm mb-5", children: "Paste copy, drop an idea, add pictures. It goes into the content calendar and gets written up." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: label, children: "Title" }), _jsx("input", { className: input, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "What is this about?" })] }), _jsxs("div", { children: [_jsx("label", { className: label, children: "The idea" }), _jsx("textarea", { className: `${input} min-h-24`, value: idea, onChange: (e) => setIdea(e.target.value), placeholder: "Why this, why now, what is the angle?" })] }), _jsxs("div", { children: [_jsx("label", { className: label, children: "Paste copy" }), _jsx("textarea", { className: `${input} min-h-40 font-mono text-xs`, value: body, onChange: (e) => setBody(e.target.value), placeholder: "Notes, a caption, a recipe, a draft. Rough is fine." })] }), categories && categories.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: label, children: "Section" }), _jsxs("select", { className: input, value: category, onChange: (e) => setCategory(e.target.value), children: [_jsx("option", { value: "", children: "Not sure" }), categories.map((c) => (_jsx("option", { value: c, children: c }, c)))] })] })), _jsxs("div", { children: [_jsx("label", { className: label, children: "Links" }), _jsx("input", { className: input, value: sourceUrls, onChange: (e) => setSourceUrls(e.target.value), placeholder: "Anything worth looking at, one per line or comma separated" })] }), _jsxs("div", { children: [_jsx("label", { className: label, children: "Pictures" }), _jsx("input", { ref: fileRef, type: "file", accept: "image/*", multiple: true, onChange: (e) => addFiles(e.target.files), className: "block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-full file:border-0 file:bg-surface-container file:px-4 file:py-2 file:text-sm file:font-medium file:text-on-surface hover:file:bg-surface-container-high" }), uploading > 0 && _jsxs("p", { className: "text-on-surface-variant text-xs mt-2", children: ["Uploading ", uploading, "\u2026"] }), images.length > 0 && (_jsx("div", { className: "flex gap-2 mt-3 flex-wrap", children: images.map((url) => (_jsxs("div", { className: "relative", children: [_jsx("img", { src: url, alt: "", className: "h-20 w-20 object-cover rounded-lg border border-surface-variant" }), _jsx("button", { onClick: () => setImages((prev) => prev.filter((u) => u !== url)), className: "absolute -top-1.5 -right-1.5 bg-surface border border-surface-variant rounded-full w-5 h-5 text-xs text-on-surface-variant leading-none", "aria-label": "Remove picture", children: "\u00D7" })] }, url))) }))] }), error && _jsx("p", { className: "text-error text-sm", children: error }), done && _jsx("p", { className: "text-primary text-sm", children: "Sent. It is in the queue." }), _jsx("button", { onClick: submit, disabled: busy || !title.trim() || uploading > 0, className: "bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-bold text-sm disabled:opacity-50", children: busy ? "Sending…" : "Send pitch" })] })] }));
}
// ── the queue ────────────────────────────────────────────────────────
function Queue({ pitches, role, onChanged }) {
    const [openId, setOpenId] = useState(null);
    if (!pitches.length) {
        return (_jsx("p", { className: "text-on-surface-variant text-sm bg-surface rounded-xl border border-surface-variant px-5 py-8", children: role === "admin" ? "No pitches yet." : "Nothing sent yet. The form above is the way in." }));
    }
    // Dated pitches first, in calendar order, then undated newest-first. That is
    // the order an editor actually works in: what is committed, then what is not.
    const sorted = [...pitches].sort((a, b) => {
        if (a.scheduled_for && b.scheduled_for)
            return a.scheduled_for.localeCompare(b.scheduled_for);
        if (a.scheduled_for)
            return -1;
        if (b.scheduled_for)
            return 1;
        return b.created_at.localeCompare(a.created_at);
    });
    return (_jsxs("div", { children: [_jsxs("p", { className: "text-on-surface-variant text-sm mb-4", children: [pitches.length, " ", pitches.length === 1 ? "pitch" : "pitches", role === "partner" && " from you"] }), _jsx("div", { className: "bg-surface rounded-xl border border-surface-variant divide-y divide-surface-variant", children: sorted.map((p) => (_jsx(Row, { pitch: p, role: role, open: openId === p.id, onToggle: () => setOpenId(openId === p.id ? null : p.id), onChanged: onChanged }, p.id))) })] }));
}
function Row({ pitch, role, open, onToggle, onChanged, }) {
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");
    async function patch(fields, tag) {
        setBusy(tag);
        setError("");
        try {
            const res = await fetch(`/api/admin/pitches/${pitch.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fields),
            });
            if (!res.ok)
                throw new Error((await res.json()).error ?? "failed");
            onChanged();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "failed");
        }
        finally {
            setBusy("");
        }
    }
    async function promote() {
        setBusy("promote");
        setError("");
        try {
            const res = await fetch(`/api/admin/pitches/${pitch.id}/promote`, { method: "POST" });
            const d = await res.json();
            if (!res.ok)
                throw new Error(d.error ?? "failed");
            onChanged();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "failed");
        }
        finally {
            setBusy("");
        }
    }
    return (_jsxs("div", { children: [_jsxs("button", { onClick: onToggle, className: "w-full text-left px-5 py-3.5 hover:bg-surface-container-low flex items-center gap-4", children: [_jsx("span", { className: `shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[pitch.status]}`, children: pitch.status }), _jsx("span", { className: "flex-1 text-on-surface truncate", children: pitch.title }), pitch.images.length > 0 && (_jsxs("span", { className: "text-xs text-on-surface-variant shrink-0", children: [pitch.images.length, " ", pitch.images.length === 1 ? "picture" : "pictures"] })), _jsx("span", { className: "text-xs text-on-surface-variant shrink-0 w-24 text-right", children: pitch.scheduled_for ? new Date(`${pitch.scheduled_for}T12:00:00`).toLocaleDateString() : "no date" })] }), open && (_jsxs("div", { className: "px-5 pb-5 pt-1 space-y-4 bg-surface-container-low", children: [role === "admin" && pitch.submitted_by && (_jsxs("p", { className: "text-xs text-on-surface-variant", children: ["From ", pitch.submitted_by, " on ", new Date(pitch.created_at).toLocaleDateString()] })), role === "partner" && _jsx("p", { className: "text-xs text-on-surface-variant", children: STATUS_BLURB[pitch.status] }), pitch.idea && (_jsx(Field, { title: "The idea", children: _jsx("p", { className: "whitespace-pre-wrap", children: pitch.idea }) })), pitch.body && (_jsx(Field, { title: "Pasted copy", children: _jsx("p", { className: "whitespace-pre-wrap", children: pitch.body }) })), pitch.source_urls && (_jsx(Field, { title: "Links", children: _jsx("p", { className: "whitespace-pre-wrap break-all", children: pitch.source_urls }) })), pitch.images.length > 0 && (_jsx(Field, { title: "Pictures", children: _jsx("div", { className: "flex gap-2 flex-wrap", children: pitch.images.map((url) => (_jsx("a", { href: url, target: "_blank", rel: "noreferrer", children: _jsx("img", { src: url, alt: "", className: "h-24 w-24 object-cover rounded-lg border border-surface-variant" }) }, url))) }) })), role === "admin" && (_jsxs("div", { className: "flex flex-wrap items-end gap-3 pt-1", children: [_jsxs("div", { children: [_jsx("label", { className: label, children: "Calendar date" }), _jsx("input", { type: "date", defaultValue: pitch.scheduled_for ?? "", onChange: (e) => patch({
                                            scheduled_for: e.target.value || null,
                                            // Dating a pitch is the accept. Saying yes and then also
                                            // having to set a status is a step people forget.
                                            ...(e.target.value && pitch.status === "new" ? { status: "scheduled" } : {}),
                                        }, "date"), className: `${input} w-44` })] }), _jsxs("div", { children: [_jsx("label", { className: label, children: "Status" }), _jsx("select", { value: pitch.status, onChange: (e) => patch({ status: e.target.value }, "status"), className: `${input} w-40`, children: STATUSES.map((s) => (_jsx("option", { value: s, children: s }, s))) })] }), pitch.post_id ? (_jsx("span", { className: "text-xs text-on-surface-variant pb-2.5", children: "Draft created" })) : (_jsx("button", { onClick: promote, disabled: !!busy, className: "bg-primary text-on-primary px-4 py-2 rounded-full font-label-bold text-sm disabled:opacity-50", children: busy === "promote" ? "Creating…" : "Create draft" }))] })), role === "admin" && (_jsxs("div", { children: [_jsx("label", { className: label, children: "Editor notes" }), _jsx("textarea", { className: `${input} min-h-16`, defaultValue: pitch.editor_notes ?? "", onBlur: (e) => e.target.value !== (pitch.editor_notes ?? "") && patch({ editor_notes: e.target.value }, "notes"), placeholder: "Private. The person who pitched this never sees it." })] })), busy && busy !== "promote" && _jsx("p", { className: "text-on-surface-variant text-xs", children: "Saving\u2026" }), error && _jsx("p", { className: "text-error text-sm", children: error })] }))] }));
}
function Field({ title, children }) {
    return (_jsxs("div", { children: [_jsx("p", { className: "font-label-bold text-on-surface text-xs mb-1", children: title }), _jsx("div", { className: "text-on-surface-variant text-sm", children: children })] }));
}
