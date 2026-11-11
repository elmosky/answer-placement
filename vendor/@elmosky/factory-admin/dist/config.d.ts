/**
 * The admin config contract. This is the TypeScript face of the site's
 * admin.config.json (see ~/.claude/templates/site-admin/README.md) — the JSON
 * stays the per-site source of truth; the site's admin page/route files parse
 * it into this shape and add the non-serializable parts (postPath, hooks).
 */
export type AdminConfig = {
    site: {
        name: string;
        slug: string;
        /** Absolute public origin, e.g. https://saltysnacks.com */
        url: string;
    };
    panels: {
        blog?: {
            enabled: boolean;
            /** Public path for a post; default /blog/<slug>. Drives "view live" links + canonical_url sync. */
            postPath?: (p: {
                category?: string | null;
                slug: string;
            }) => string;
            /** Show the drip-publish queue toggle (needs a cron consuming publish_queued_at). */
            dripQueue?: boolean;
            /**
             * Class for the body editor, so a draft is spaced like the live article.
             * Default: Tailwind typography ("prose prose-lg max-w-none").
             */
            editorClass?: string;
            /**
             * Text-column width of the live article (CSS length, e.g. "53.5rem").
             * When set, the body editor spans the page below the form fields with its
             * text exactly this wide, so lines wrap where they will on the site.
             */
            editorWidth?: string;
        };
        subscribers?: {
            enabled: boolean;
        };
        /**
         * Partner pitches: the submission form contributors see, and the triage
         * queue admins see. Turning this on is what makes PARTNER_EMAILS mean
         * anything, so a site with no partners can leave it off and nothing about
         * the panel changes.
         */
        pitches?: {
            enabled: boolean;
            /**
             * Categories offered on the pitch form. Defaults to the site's own list
             * where the integration passes one; an empty list hides the field.
             */
            categories?: string[];
        };
        data?: {
            enabled: boolean;
            tables: {
                label: string;
                table: string;
                select: string;
                order?: string;
                limit?: number;
                siteScoped: boolean;
            }[];
        };
        traffic?: {
            enabled: boolean;
        };
        health?: {
            enabled: boolean;
            runsTable?: string;
            staleAfterHours?: number;
        };
    };
    links?: {
        /** Deep link to a post's origin row (e.g. Airtable) shown in the SEO panel. */
        sourceRow?: (recordId: string) => string;
        /** Extra links in the admin header and on the home tools grid, e.g. a site-specific page. */
        nav?: {
            label: string;
            href: string;
            description?: string;
            emoji?: string;
        }[];
    };
};
export type AdminHooks = {
    /**
     * Runs before a post transitions to published. Throw to reject the publish —
     * the error message reaches the editor UI. Wire the site's rules here
     * (factory-rules runRules) and the monetizer BEFORE the rules, since the
     * disclosure rule fires on links the monetizer inserts.
     */
    beforePublish?: (post: Record<string, unknown>) => Promise<Record<string, unknown> | void>;
    /** Fire-and-forget after publish (Airtable status sync, pings). Errors are swallowed. */
    afterPublish?: (post: Record<string, unknown>) => Promise<void>;
};
export declare const defaultPostPath: (p: {
    category?: string | null;
    slug: string;
}) => string;
