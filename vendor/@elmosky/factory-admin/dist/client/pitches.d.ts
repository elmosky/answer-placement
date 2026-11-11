export type Pitch = {
    id: string;
    title: string;
    idea?: string | null;
    body?: string | null;
    category?: string | null;
    source_urls?: string | null;
    images: string[];
    status: "new" | "scheduled" | "writing" | "written" | "declined";
    scheduled_for?: string | null;
    editor_notes?: string | null;
    post_id?: string | null;
    submitted_by?: string;
    created_at: string;
};
export declare function Pitches({ role, categories }: {
    role: "admin" | "partner";
    categories?: string[];
}): import("react").JSX.Element;
