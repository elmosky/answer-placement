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
/** Validate + fill defaults. Site config files call this so a typo fails at build, not in prod. */
export function defineSite(config) {
    if (!config.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(config.slug)) {
        throw new Error(`factory-seo: slug "${config.slug}" must be lowercase-with-hyphens.`);
    }
    if (!config.domain || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(config.domain)) {
        throw new Error(`factory-seo: domain "${config.domain}" is not a bare domain (no scheme, no path).`);
    }
    if (!config.name)
        throw new Error("factory-seo: name is required.");
    const url = (config.url ?? `https://${config.domain}`).replace(/\/$/, "");
    return { ...config, url, blog: config.blog !== false };
}
export const defaultPostPath = (p) => `/blog/${p.slug}`;
/**
 * Sitemap: home + static pages + category archives + posts.
 * Posts are optional so an app-only site still gets a valid sitemap.
 */
export function buildSitemap(site, { posts = [] } = {}) {
    const now = new Date();
    const postPath = site.postPath ?? defaultPostPath;
    const entries = [
        { url: site.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    ];
    if (site.blog) {
        entries.push({ url: `${site.url}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 });
    }
    for (const p of site.staticPaths ?? []) {
        entries.push({
            url: `${site.url}${p.startsWith("/") ? p : `/${p}`}`,
            lastModified: now,
            changeFrequency: "yearly",
            priority: 0.4,
        });
    }
    for (const c of site.categories ?? []) {
        entries.push({ url: `${site.url}/${c}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    }
    for (const p of posts) {
        const stamp = p.updated_at ?? p.published_at;
        entries.push({
            url: `${site.url}${postPath(p)}`,
            lastModified: stamp ? new Date(stamp) : now,
            changeFrequency: "monthly",
            priority: 0.7,
        });
    }
    return entries;
}
/**
 * robots.txt. /admin and /api are ALWAYS disallowed — they can never rank and
 * the admin must not be indexed. Extra paths append; they cannot remove these.
 */
export function buildRobots(site, { disallow = [] } = {}) {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [...new Set(["/admin", "/admin/", "/api/", ...disallow])],
            },
        ],
        sitemap: `${site.url}/sitemap.xml`,
        host: site.url,
    };
}
export const jsonLd = {
    website(site) {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: site.url,
            ...(site.tagline ? { description: site.tagline } : {}),
            publisher: jsonLd.organization(site),
        };
    },
    organization(site) {
        return {
            "@type": "Organization",
            name: site.name,
            url: site.url,
            ...(site.organization?.logo
                ? { logo: { "@type": "ImageObject", url: absolute(site, site.organization.logo) } }
                : {}),
            ...(site.organization?.sameAs?.length ? { sameAs: site.organization.sameAs } : {}),
        };
    },
    article(site, post) {
        const postPath = site.postPath ?? defaultPostPath;
        const url = `${site.url}${postPath(post)}`;
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.meta_description ?? post.excerpt ?? undefined,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            url,
            ...(post.featured_image ? { image: [absolute(site, post.featured_image)] } : {}),
            ...(post.published_at ? { datePublished: post.published_at } : {}),
            ...(post.updated_at ? { dateModified: post.updated_at } : {}),
            author: post.author
                ? { "@type": "Person", name: post.author.name, ...(post.author.url ? { url: post.author.url } : {}) }
                : jsonLd.organization(site),
            publisher: jsonLd.organization(site),
        };
    },
    breadcrumbs(site, trail) {
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: trail.map((t, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: t.name,
                item: `${site.url}${t.path.startsWith("/") ? t.path : `/${t.path}`}`,
            })),
        };
    },
    /**
     * FAQPage from the article's own H3 questions. This is the block AI answer
     * engines lift from, so it is built from what the page actually says rather
     * than authored separately (which drifts).
     */
    faq(pairs) {
        if (!pairs.length)
            return null;
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: pairs.map((p) => ({
                "@type": "Question",
                name: p.question,
                acceptedAnswer: { "@type": "Answer", text: p.answer },
            })),
        };
    },
};
/**
 * Pull FAQ pairs out of body HTML: every H3 ending in "?" plus the prose that
 * follows it, up to the next heading.
 */
export function extractFaq(bodyHtml) {
    const out = [];
    const re = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h[23]\b|$)/gi;
    for (const m of bodyHtml.matchAll(re)) {
        const question = strip(m[1]).trim();
        if (!question.endsWith("?"))
            continue;
        const answer = strip(m[2]).trim();
        if (answer)
            out.push({ question, answer });
    }
    return out;
}
const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const absolute = (site, path) => /^https?:\/\//.test(path) ? path : `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
/** Convenience for <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(obj)} /> */
export const ldScript = (data) => ({ __html: JSON.stringify(data ?? {}) });
