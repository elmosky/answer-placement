type Props = {
    value: string;
    onChange: (html: string) => void;
    /**
     * Class on the editable area. Defaults to Tailwind typography; a site that
     * styles its articles with its own class (Brew: "article-body") passes it
     * here so a draft is spaced exactly like the live page.
     */
    contentClass?: string;
    /** Max width of the text column (CSS length); centred. Unset = fill the box. */
    contentWidth?: string;
};
export declare function TiptapEditor({ value, onChange, contentClass, contentWidth }: Props): import("react").JSX.Element | null;
export {};
