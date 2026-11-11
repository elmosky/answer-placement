type Props = {
    title: string;
    slug: string;
    metaDescription: string;
    focusKeyword: string;
    bodyHtml: string;
    seoScore: number | null;
    /** Site origin for the SERP preview, e.g. https://saltysnacks.com */
    siteUrl: string;
    /** Optional deep link to the post's origin row (e.g. Airtable). */
    sourceRowUrl?: string | null;
};
export declare function SeoPanel({ title, slug, metaDescription, focusKeyword, bodyHtml, seoScore, siteUrl, sourceRowUrl }: Props): import("react").JSX.Element;
export {};
