"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
export function SeoPanel({ title, slug, metaDescription, focusKeyword, bodyHtml, seoScore, siteUrl, sourceRowUrl }) {
    const m = useMemo(() => analyze({ title, slug, metaDescription, focusKeyword, bodyHtml }), [title, slug, metaDescription, focusKeyword, bodyHtml]);
    const host = siteUrl.replace(/^https?:\/\//, "");
    return (_jsxs("div", { className: "space-y-4", children: [sourceRowUrl && (_jsxs("div", { className: "bg-primary-fixed/20 border-l-4 border-primary p-3 rounded-r-lg text-xs", children: [_jsx("p", { className: "font-label-bold text-primary mb-1", children: "You're editing the live article" }), _jsx("p", { className: "text-on-surface-variant leading-relaxed", children: "Edits here save to the database and show on the live site when you click Save. The pipeline row is history, this CMS is the source of truth." }), _jsx("a", { href: sourceRowUrl, target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline mt-2 inline-block", children: "View original pipeline row \u2192" })] })), seoScore !== null && (_jsxs("div", { className: "bg-surface rounded-xl border border-surface-variant p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-1", children: [_jsx("p", { className: "font-label-sm text-on-surface-variant", children: "Pipeline Score" }), _jsxs(InfoTooltip, { children: [_jsx("p", { children: _jsx("strong", { children: "How it's scored:" }) }), _jsx("p", { children: "Starts at 100. Editor agent runs 11 checks. \u22125 per fail, \u221210 per human-review flag." }), _jsx("p", { className: "mt-1", children: _jsx("strong", { children: "Ranges:" }) }), _jsxs("ul", { className: "list-none", children: [_jsx("li", { children: "90\u2013100: production-ready" }), _jsx("li", { children: "75\u201389: light review" }), _jsx("li", { children: "<75: needs review" })] })] })] }), _jsxs("div", { className: "flex items-baseline gap-2", children: [_jsx("p", { className: `font-display-lg ${seoScore >= 90 ? "text-primary" : seoScore >= 75 ? "text-secondary" : "text-error"}`, children: seoScore }), _jsx("p", { className: "text-sm text-on-surface-variant", children: "/ 100" })] })] })), _jsxs("div", { className: "bg-surface rounded-xl border border-surface-variant p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "font-label-bold text-primary", children: "SEO Analysis" }), _jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${m.overallColor}`, children: m.overallLabel })] }), _jsxs("details", { className: "mb-3 group", open: true, children: [_jsxs("summary", { className: "cursor-pointer text-xs font-label-bold text-on-surface-variant mb-2 list-none flex items-center gap-1", children: [_jsx("span", { className: "group-open:rotate-90 transition-transform", children: "\u25B8" }), " SERP preview"] }), _jsxs("div", { className: "bg-surface-container-low rounded-lg p-3 text-xs space-y-1", children: [_jsx("p", { className: "text-blue-700 underline truncate text-sm", children: title || "Untitled" }), _jsxs("p", { className: "text-green-700 text-xs", children: [siteUrl, " \u203A blog \u203A ", slug || "slug"] }), _jsx("p", { className: "text-on-surface-variant", children: metaDescription || "(no meta description)" })] })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("div", { className: "flex items-center justify-between text-xs mb-1", children: [_jsx("span", { className: "font-label-bold text-on-surface", children: "Keyword density" }), _jsxs("span", { className: `font-mono ${m.densityColor}`, children: [m.density.toFixed(2), "%"] })] }), _jsxs("div", { className: "w-full h-1.5 rounded-full bg-surface-container relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-y-0 left-[5%] right-[75%] bg-primary/10" }), _jsx("div", { className: "absolute inset-y-0 bg-primary rounded-full", style: { width: `${Math.min(m.density * 4, 100)}%` } })] }), _jsxs("p", { className: "text-xs text-on-surface-variant mt-0.5", children: ["Target: 0.5\u20132.5% (focus keyword: ", focusKeyword || "—", ")"] })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("div", { className: "flex items-center justify-between text-xs mb-1", children: [_jsx("span", { className: "font-label-bold text-on-surface", children: "Readability (Flesch)" }), _jsx("span", { className: `font-mono ${m.fleschColor}`, children: m.flesch })] }), _jsx("p", { className: "text-xs text-on-surface-variant", children: m.fleschLabel })] }), _jsx("ul", { className: "space-y-1.5 text-xs", children: m.checks.map((c, i) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: c.ok === "pass" ? "text-primary" : c.ok === "warn" ? "text-secondary" : "text-error", children: c.ok === "pass" ? "●" : c.ok === "warn" ? "◐" : "○" }), _jsx("span", { className: "text-on-surface flex-1", children: c.label })] }, i))) })] })] }));
}
function InfoTooltip({ children }) {
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { className: "relative", children: [_jsx("button", { type: "button", onClick: () => setOpen((o) => !o), className: "text-xs text-primary hover:underline cursor-pointer", children: "\u24D8" }), open && (_jsx("div", { onClick: () => setOpen(false), className: "absolute right-0 top-6 z-20 w-72 p-3 bg-surface border border-outline-variant rounded-lg shadow-lg text-xs text-on-surface space-y-1.5 cursor-pointer", children: children }))] }));
}
// ───────────────────────────────────────────────────────────────────
function analyze({ title, slug, metaDescription, focusKeyword, bodyHtml }) {
    const fk = focusKeyword.toLowerCase().trim();
    const bodyText = bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = bodyText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const fkNorm = normalizeForMatch(fk);
    const bodyNorm = normalizeForMatch(bodyText.toLowerCase());
    const titleNorm = normalizeForMatch(title.toLowerCase());
    const slugNorm = normalizeForMatch(slug.toLowerCase());
    const metaNorm = normalizeForMatch(metaDescription.toLowerCase());
    const fkMatches = fk ? countOccurrences(bodyNorm, fkNorm) : 0;
    const density = wordCount > 0 && fk ? (fkMatches / wordCount) * 100 : 0;
    const densityOk = density >= 0.5 && density <= 2.5;
    const densityColor = densityOk ? "text-primary" : density === 0 ? "text-error" : "text-secondary";
    const sentences = (bodyText.match(/[.!?]+/g) || []).length || 1;
    const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const flesch = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount))));
    const fleschLabel = flesch >= 70 ? "Easy to read" : flesch >= 50 ? "Fairly difficult" : "Difficult";
    const fleschColor = flesch >= 70 ? "text-primary" : flesch >= 50 ? "text-secondary" : "text-error";
    const h2Count = (bodyHtml.match(/<h2\b/gi) || []).length;
    const h3Count = (bodyHtml.match(/<h3\b/gi) || []).length;
    const internalLinks = (bodyHtml.match(/href="\/[^"]*"/gi) || []).length;
    const externalLinks = (bodyHtml.match(/href="https?:\/\/[^"]*"/gi) || []).length;
    const imgs = bodyHtml.match(/<img[^>]*>/gi) || [];
    const imgsWithoutAlt = imgs.filter((i) => !/alt="[^"]+"/i.test(i)).length;
    const first100Norm = normalizeForMatch(words.slice(0, 100).join(" ").toLowerCase());
    const fkInFirst100 = !!fk && first100Norm.includes(fkNorm);
    const inTitle = !!fk && titleNorm.includes(fkNorm);
    const inSlug = !!fk && slugNorm.includes(fkNorm);
    const inMeta = !!fk && metaNorm.includes(fkNorm);
    const checks = [
        { label: `Focus keyword in title (${inTitle ? "yes" : "no"})`, ok: !fk ? "warn" : inTitle ? "pass" : "fail" },
        { label: `Focus keyword in slug (${inSlug ? "yes" : "no"})`, ok: !fk ? "warn" : inSlug ? "pass" : "warn" },
        { label: `Focus keyword in meta description (${inMeta ? "yes" : "no"})`, ok: !fk ? "warn" : inMeta ? "pass" : "fail" },
        { label: `Focus keyword in first 100 words (${fkInFirst100 ? "yes" : "no"})`, ok: !fk ? "warn" : fkInFirst100 ? "pass" : "fail" },
        { label: `SEO title length: ${title.length} chars`, ok: title.length >= 50 && title.length <= 60 ? "pass" : title.length >= 30 && title.length <= 70 ? "warn" : "fail" },
        { label: `Meta description: ${metaDescription.length} chars`, ok: metaDescription.length >= 145 && metaDescription.length <= 160 ? "pass" : metaDescription.length >= 100 ? "warn" : "fail" },
        { label: `Word count: ${wordCount}`, ok: wordCount >= 1000 ? "pass" : wordCount >= 500 ? "warn" : "fail" },
        { label: `Headings: ${h2Count} H2, ${h3Count} H3`, ok: h2Count >= 2 ? "pass" : h2Count >= 1 ? "warn" : "fail" },
        { label: `Internal links: ${internalLinks}`, ok: internalLinks >= 2 ? "pass" : "warn" },
        { label: `External links: ${externalLinks}`, ok: externalLinks >= 1 ? "pass" : "warn" },
        { label: `Images: ${imgs.length} (${imgsWithoutAlt} missing alt)`, ok: imgs.length === 0 ? "warn" : imgsWithoutAlt === 0 ? "pass" : "fail" },
    ];
    const failCount = checks.filter((c) => c.ok === "fail").length;
    const passCount = checks.filter((c) => c.ok === "pass").length;
    const overallColor = failCount === 0 && passCount >= 8 ? "bg-primary-fixed text-on-primary-fixed" :
        failCount <= 2 ? "bg-secondary-fixed text-on-secondary-fixed" :
            "bg-error-container text-on-error-container";
    const overallLabel = failCount === 0 && passCount >= 8 ? "Good" : failCount <= 2 ? "Needs work" : "Many issues";
    return { density, densityColor, flesch, fleschLabel, fleschColor, checks, overallColor, overallLabel };
}
function escapeReg(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function normalizeForMatch(s) {
    return s.toLowerCase().replace(/[-/_.]+/g, " ").replace(/\s+/g, " ").trim();
}
function countOccurrences(haystack, needle) {
    if (!needle)
        return 0;
    const re = new RegExp(`\\b${escapeReg(needle)}\\b`, "g");
    return (haystack.match(re) || []).length;
}
function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, "");
    if (word.length <= 3)
        return 1;
    const m = word.match(/[aeiouy]+/g);
    return Math.max(1, (m?.length ?? 1) - (word.endsWith("e") ? 1 : 0));
}
