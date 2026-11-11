/**
 * @elmosky/factory-rules — editorial rules as ASSERTIONS, not guidance.
 *
 * Generalized from saltysnacks/lib/rules.mjs, the best idea in the fleet and
 * the only one that was trapped in a single repo. Two properties are preserved
 * deliberately:
 *
 *  1. **Plain .mjs, no build step.** The TypeScript app and the Node scripts
 *     import the SAME file. A rule that changes here changes everywhere.
 *     Prompt-level rules drift; this does not.
 *  2. **They run in two places.** The publish route rejects a post that breaks
 *     one, and `factory-rules-check` fails `npm run build` if seed content
 *     breaks one. A rule enforced in only one place is a rule that ships broken.
 *
 * The site owns its policy in `rules.site.mjs`; this package owns the engine
 * and the checks every content site needs.
 */

export const DEFAULT_LIMITS = {
  titleMax: 70, // longer truncates in search results
  excerptMax: 220,
  metaDescriptionMax: 160,
  slugMax: 80,
  bodyMinWords: 300,
};

const SLUG_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * An affiliate link, in either storage format. Both are matched on purpose:
 * bodies are stored as HTML but authoring files are markdown, and a detector
 * that understood only one would go quietly dead the moment the other was used
 * — which is the failure mode this whole file exists to prevent.
 */
const AFFILIATE_LINK =
  /\]\(https?:\/\/[^)]*[?&](tag|aff|affiliate|ref)=|<a\s[^>]*(?:href=["'][^"']*[?&](?:tag|aff|affiliate|ref)=|rel=["'][^"']*sponsored|data-aff-link-id)/i;

/**
 * "commission" specifically, not "affiliate": the word affiliate turns up in
 * link text and URLs, so matching it would let a post satisfy its own
 * disclosure rule with the very link that triggered it.
 */
const AFFILIATE_DISCLOSURE = /\bcommission\b/i;

export function wordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

/** Bodies are HTML. Strip tags before counting so markup is not counted as prose. */
export function stripTags(html) {
  return (html || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ");
}

/**
 * Disclosure claims must be made in prose, so URLs and image paths are removed
 * before scanning. Otherwise a link containing "bought" or "commission" would
 * satisfy a rule that exists to make the page say something to a reader.
 */
export function proseOnly(body) {
  return (body || "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // keep link text, drop the target
    .replace(/<[^>]+>/g, " ")
    .replace(/`[^`]*`/g, " ");
}

/**
 * Run the rules over one post.
 *
 * @param {object} post - title, slug, category, excerpt, meta_description,
 *   body_html | body_markdown
 * @param {object} siteRules - the site's rules.site.mjs module:
 *   { LIMITS?, CATEGORY_SLUGS?, requireAffiliateDisclosure?, disclosure?, checks? }
 * @returns {string[]} human-readable problems; empty means publishable.
 */
export function runRules(post, siteRules = {}) {
  const limits = { ...DEFAULT_LIMITS, ...(siteRules.LIMITS ?? {}) };
  const problems = [];

  const title = (post.title || "").trim();
  const slug = (post.slug || "").trim();
  const category = (post.category || "").trim();
  const excerpt = (post.excerpt || "").trim();
  const meta = (post.meta_description || "").trim();
  // Accepts either shape: HTML is the stored format, markdown is the authoring
  // format that seed scripts convert.
  const body = post.body_html || post.body_markdown || "";

  if (!title) problems.push("Title is required.");
  else if (title.length > limits.titleMax)
    problems.push(
      `Title is ${title.length} characters; the limit is ${limits.titleMax} so it does not truncate in search results.`,
    );

  if (!slug) problems.push("Slug is required.");
  else {
    if (!SLUG_SHAPE.test(slug))
      problems.push(`Slug "${slug}" must be lowercase words separated by single hyphens.`);
    if (slug.length > limits.slugMax)
      problems.push(`Slug is ${slug.length} characters; the limit is ${limits.slugMax}.`);
  }

  // Categories are only checked when the site declares a closed set. Renaming
  // one without migrating rows orphans articles, so the validator catches it.
  if (Array.isArray(siteRules.CATEGORY_SLUGS) && siteRules.CATEGORY_SLUGS.length) {
    if (!siteRules.CATEGORY_SLUGS.includes(category)) {
      problems.push(
        `Category "${category}" is not one of: ${siteRules.CATEGORY_SLUGS.join(", ")}. An unknown category orphans the post from its archive page.`,
      );
    }
  }

  if (!excerpt) problems.push("An excerpt is required; it is the card and meta description fallback.");
  else if (excerpt.length > limits.excerptMax)
    problems.push(`Excerpt is ${excerpt.length} characters; the limit is ${limits.excerptMax}.`);

  if (meta && meta.length > limits.metaDescriptionMax)
    problems.push(`Meta description is ${meta.length} characters; the limit is ${limits.metaDescriptionMax}.`);

  const words = wordCount(stripTags(body));
  if (words < limits.bodyMinWords)
    problems.push(`Body is ${words} words; a published post needs at least ${limits.bodyMinWords}.`);

  const prose = proseOnly(body);

  // Affiliate disclosure. Default ON: an undisclosed affiliate link is an FTC
  // problem, so a site must opt OUT explicitly rather than forget to opt in.
  if (siteRules.requireAffiliateDisclosure !== false) {
    if (AFFILIATE_LINK.test(body) && !AFFILIATE_DISCLOSURE.test(prose)) {
      problems.push("This post has an affiliate link but never mentions a commission. Add the disclosure line.");
    }
  }

  /**
   * Per-category disclosure promises, e.g. a review stating how the product was
   * obtained: { reviews: { patterns: [/\bwe bought\b/i], message: "..." } }
   * These are usually promised publicly on an editorial-policy page, so
   * relaxing one means editing that page in the same commit.
   */
  for (const [cat, rule] of Object.entries(siteRules.disclosure ?? {})) {
    if (category !== cat) continue;
    if (!rule.patterns?.some((re) => re.test(prose))) {
      problems.push(rule.message ?? `Posts in "${cat}" must include the required disclosure.`);
    }
  }

  // Site-specific checks: (post, ctx) => string | string[] | null
  for (const check of siteRules.checks ?? []) {
    const r = check(post, { prose, body, words, limits });
    if (Array.isArray(r)) problems.push(...r.filter(Boolean));
    else if (r) problems.push(r);
  }

  return problems;
}

/** Throwing wrapper for publish paths: the message reaches the editor UI. */
export function assertPublishable(post, siteRules = {}) {
  const problems = runRules(post, siteRules);
  if (problems.length) {
    throw new Error(`Cannot publish, ${problems.length} rule problem(s):\n- ${problems.join("\n- ")}`);
  }
}
