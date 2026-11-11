export type Limits = {
  titleMax: number;
  excerptMax: number;
  metaDescriptionMax: number;
  slugMax: number;
  bodyMinWords: number;
};

export type PostLike = {
  title?: string;
  slug?: string;
  category?: string | null;
  excerpt?: string | null;
  meta_description?: string | null;
  body_html?: string | null;
  body_markdown?: string | null;
};

export type SiteRules = {
  LIMITS?: Partial<Limits>;
  /** Closed set of category slugs. Omit to allow any category. */
  CATEGORY_SLUGS?: string[];
  /** Default true: a body with an affiliate link must mention a commission. */
  requireAffiliateDisclosure?: boolean;
  /** Per-category disclosure promises keyed by category slug. */
  disclosure?: Record<string, { patterns: RegExp[]; message?: string }>;
  /** Site-specific assertions. Return a problem string, a list, or null. */
  checks?: Array<
    (
      post: PostLike,
      ctx: { prose: string; body: string; words: number; limits: Limits },
    ) => string | string[] | null | undefined
  >;
};

export const DEFAULT_LIMITS: Limits;
export function wordCount(text: string): number;
export function stripTags(html: string): string;
export function proseOnly(body: string): string;
export function runRules(post: PostLike, siteRules?: SiteRules): string[];
export function assertPublishable(post: PostLike, siteRules?: SiteRules): void;
