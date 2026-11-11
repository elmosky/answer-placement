"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect } from "react";
export function TiptapEditor({ value, onChange, contentClass, contentWidth }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3, 4] },
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: { class: "text-primary underline" },
            }),
            Image.configure({
                HTMLAttributes: { class: "rounded-lg my-4 max-w-full h-auto" },
            }),
            Placeholder.configure({
                placeholder: "Start writing or paste from the pipeline...",
            }),
            Typography,
            // Table extensions — without these, Tiptap silently strips <table> on save.
            Table.configure({ resizable: false, HTMLAttributes: { class: "border-collapse my-4" } }),
            TableRow,
            TableHeader.configure({ HTMLAttributes: { class: "border border-outline-variant bg-surface-container px-3 py-2 text-left font-semibold" } }),
            TableCell.configure({ HTMLAttributes: { class: "border border-outline-variant px-3 py-2" } }),
        ],
        content: value,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: `${contentClass ?? "prose prose-lg max-w-none"} focus:outline-none min-h-[400px] py-4 px-1`,
            },
        },
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });
    // Re-sync when value changes from outside (e.g. switching between posts)
    useEffect(() => {
        if (!editor)
            return;
        if (editor.getHTML() !== value) {
            editor.commands.setContent(value || "", false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, editor]);
    if (!editor)
        return null;
    return (_jsxs("div", { className: "border-2 border-outline-variant rounded-lg overflow-hidden bg-surface", children: [_jsx(Toolbar, { editor: editor }), _jsx("div", { className: "px-4 max-h-[70vh] overflow-y-auto", children: _jsx("div", { style: contentWidth ? { maxWidth: `calc(${contentWidth} + 0.5rem)`, margin: "0 auto" } : undefined, children: _jsx(EditorContent, { editor: editor }) }) })] }));
}
function Toolbar({ editor }) {
    if (!editor)
        return null;
    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);
        if (url === null)
            return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };
    const addImage = () => {
        const url = window.prompt("Image URL");
        if (url)
            editor.chain().focus().setImage({ src: url }).run();
    };
    return (_jsxs("div", { className: "border-b border-outline-variant bg-surface-container px-2 py-1.5 flex flex-wrap items-center gap-0.5 sticky top-0 z-10", children: [_jsx(Btn, { active: editor.isActive("bold"), onClick: () => editor.chain().focus().toggleBold().run(), title: "Bold (\u2318B)", children: _jsx("strong", { children: "B" }) }), _jsx(Btn, { active: editor.isActive("italic"), onClick: () => editor.chain().focus().toggleItalic().run(), title: "Italic (\u2318I)", children: _jsx("em", { children: "I" }) }), _jsx(Btn, { active: editor.isActive("strike"), onClick: () => editor.chain().focus().toggleStrike().run(), title: "Strikethrough", children: _jsx("span", { style: { textDecoration: "line-through" }, children: "S" }) }), _jsx(Divider, {}), _jsx(Btn, { active: editor.isActive("heading", { level: 2 }), onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), title: "Heading 2", children: "H2" }), _jsx(Btn, { active: editor.isActive("heading", { level: 3 }), onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), title: "Heading 3", children: "H3" }), _jsx(Btn, { active: editor.isActive("paragraph"), onClick: () => editor.chain().focus().setParagraph().run(), title: "Paragraph", children: "P" }), _jsx(Divider, {}), _jsx(Btn, { active: editor.isActive("bulletList"), onClick: () => editor.chain().focus().toggleBulletList().run(), title: "Bullet list", children: "\u2022" }), _jsx(Btn, { active: editor.isActive("orderedList"), onClick: () => editor.chain().focus().toggleOrderedList().run(), title: "Numbered list", children: "1." }), _jsx(Btn, { active: editor.isActive("blockquote"), onClick: () => editor.chain().focus().toggleBlockquote().run(), title: "Quote", children: "\u275D" }), _jsx(Btn, { active: editor.isActive("codeBlock"), onClick: () => editor.chain().focus().toggleCodeBlock().run(), title: "Code block", children: "</>" }), _jsx(Divider, {}), _jsx(Btn, { active: editor.isActive("link"), onClick: setLink, title: "Link", children: "\uD83D\uDD17" }), _jsx(Btn, { onClick: addImage, title: "Image", children: "\uD83D\uDDBC" }), _jsx(Btn, { onClick: () => editor.chain().focus().setHorizontalRule().run(), title: "Horizontal rule", children: "\u2015" }), _jsx(Btn, { onClick: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), title: "Insert table", children: "\u229E" }), _jsx(Divider, {}), _jsx(Btn, { onClick: () => editor.chain().focus().undo().run(), title: "Undo", children: "\u21B6" }), _jsx(Btn, { onClick: () => editor.chain().focus().redo().run(), title: "Redo", children: "\u21B7" })] }));
}
function Btn({ children, active, onClick, title }) {
    return (_jsx("button", { type: "button", title: title, onClick: onClick, className: `px-2.5 py-1 rounded text-sm font-medium transition-colors ${active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`, children: children }));
}
function Divider() {
    return _jsx("span", { className: "w-px h-5 mx-1 bg-outline-variant" });
}
