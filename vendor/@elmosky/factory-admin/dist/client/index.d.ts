import { type AdminConfig } from "../config.js";
export { PostEditor } from "./post-editor.js";
export { SeoPanel } from "./seo-panel.js";
export { TiptapEditor } from "./tiptap.js";
export { Pitches, type Pitch } from "./pitches.js";
export type { AdminConfig } from "../config.js";
export declare function AdminApp({ config }: {
    config: AdminConfig;
}): import("react").JSX.Element;
