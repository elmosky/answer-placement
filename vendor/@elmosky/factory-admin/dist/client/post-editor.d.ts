export type Post = {
    id: string;
    title: string;
    slug: string;
    status: string;
    category?: string | null;
    excerpt: string | null;
    body_html: string | null;
    focus_keyword: string | null;
    seo_title: string | null;
    meta_description: string | null;
    featured_image: string | null;
    tags: string[] | null;
    seo_score: number | null;
    /** When the post becomes visible. The site requires it to be <= now. */
    published_at?: string | null;
    airtable_record_id?: string | null;
    updated_at?: string | null;
    publish_queued_at?: string | null;
};
type Props = {
    post: Post;
    siteUrl: string;
    postPath: (p: {
        category?: string | null;
        slug: string;
    }) => string;
    dripQueue?: boolean;
    sourceRow?: (recordId: string) => string;
    /** Class for the body editor so drafts match the live article (see TiptapEditor). */
    editorClass?: string;
    /** Live article text width; when set the body editor goes full width below the fields. */
    editorWidth?: string;
    onSaved?: () => void;
};
export declare function PostEditor({ post, siteUrl, postPath, dripQueue, sourceRow, editorClass, editorWidth, onSaved }: Props): import("react").JSX.Element;
export {};
