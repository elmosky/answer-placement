/**
 * @elmosky/factory-seo — sitemap, robots, and structured data built from the
 * site config.
 *
 * Six sites hand-wrote sitemap.ts and four hand-wrote robots.ts; one of them
 * (tvapplab) shipped a robots.txt that let crawlers into /admin and /api,
 * because there was no shared implementation to inherit the rule from. Here
 * buildRobots ALWAYS disallows them — that bug cannot be reintroduced by
 * forgetting.
 *
 * Framework-agnostic: returns plain objects matching Next's MetadataRoute
 * shapes, so a site's app/sitemap.ts is a three-line wrapper.
 */
export type SiteConfig = {
    slug: string;
    name: string;
    domain: string;
    /** Derived if absent: https://<domain> */
    url?: string;
    tagline?: string;
    /** Set false for app-only sites; sitemap then skips the blog section. */
    blog?: boolean;
    seo?: {
        titleTemplate?: string;
        ogImage?: string;
        twitter?: string;
    };
    /** Extra static routes beyond the defaults, e.g. ["/tools", "/pricing"]. */
    staticPaths?: string[];
    /** Blog category slugs; each becomes an archive URL. */
    categories?: string[];
    /** Public path for a post. Default /blog/<slug>. */
    postPath?: (p: {
        slug: string;
        category?: string | null;
    }) => string;
    organization?: {
        logo?: string;
        sameAs?: string[];
    };
};
export type ResolvedSite = SiteConfig & {
    url: string;
    blog: boolean;
};
/** Validate + fill defaults. Site config files call this so a typo fails at build, not in prod. */
export declare function defineSite(config: SiteConfig): ResolvedSite;
export declare const defaultPostPath: (p: {
    slug: string;
    category?: string | null;
}) => string;
export type SitemapEntry = {
    url: string;
    lastModified?: Date;
    changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority?: number;
};
export type SitemapPost = {
    slug: string;
    category?: string | null;
    updated_at?: string | null;
    published_at?: string | null;
};
/**
 * Sitemap: home + static pages + category archives + posts.
 * Posts are optional so an app-only site still gets a valid sitemap.
 */
export declare function buildSitemap(site: ResolvedSite, { posts }?: {
    posts?: SitemapPost[];
}): SitemapEntry[];
export type RobotsRules = {
    rules: {
        userAgent: string;
        allow: string;
        disallow: string[];
    }[];
    sitemap: string;
    host: string;
};
/**
 * robots.txt. /admin and /api are ALWAYS disallowed — they can never rank and
 * the admin must not be indexed. Extra paths append; they cannot remove these.
 */
export declare function buildRobots(site: ResolvedSite, { disallow }?: {
    disallow?: string[];
}): RobotsRules;
type Json = Record<string, unknown>;
export declare const jsonLd: {
    website(site: ResolvedSite): Json;
    organization(site: ResolvedSite): Json;
    article(site: ResolvedSite, post: {
        title: string;
        slug: string;
        category?: string | null;
        excerpt?: string | null;
        meta_description?: string | null;
        featured_image?: string | null;
        published_at?: string | null;
        updated_at?: string | null;
        author?: {
            name: string;
            url?: string;
        } | null;
    }): Json;
    breadcrumbs(site: ResolvedSite, trail: {
        name: string;
        path: string;
    }[]): Json;
    /**
     * FAQPage from the article's own H3 questions. This is the block AI answer
     * engines lift from, so it is built from what the page actually says rather
     * than authored separately (which drifts).
     */
    faq(pairs: {
        question: string;
        answer: string;
    }[]): Json | null;
};
/**
 * Pull FAQ pairs out of body HTML: every H3 ending in "?" plus the prose that
 * follows it, up to the next heading.
 */
export declare function extractFaq(bodyHtml: string): {
    question: string;
    answer: string;
}[];
/** Convenience for <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(obj)} /> */
export declare const ldScript: (data: Json | null) => {
    __html: string;
};
export {};
