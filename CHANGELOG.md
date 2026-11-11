# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed (2026-11-11)
- **Moved onto the shared Site Factory database** (`plvuwopoqzgyddadtsvn`). The site's own
  Supabase project was paused on 2026-09-25, which left `/blog` showing "No posts yet" and
  made a paid audit fail to save (500) with a dead share link. Blog posts now come from the
  factory `posts` table (site `answerplacement`); paid audits save to
  `answerplacement_audits` (`supabase/001_answerplacement_tenant.sql`).
- Blog reads throw on a database error instead of returning an empty list, so an outage
  shows as an error and Next keeps the last good page, rather than caching "No posts yet".
  A post shows once it is published and its `published_at` has arrived.
- `/admin` is now the factory admin (`@elmosky/factory-admin`): magic-link sign-in, Blog,
  Data (Audits) and Traffic (GA4 property 544548489). `/admin` is disallowed in robots.txt.
- Secrets: Doppler `answer-placement/dev` now references `affiliate-sites/prd` for the shared
  factory values; Vercel production and preview carry the same set.

### Added (2026-11-11)
- `docs/briefs/2026-11-11-cited-first-doesnt-win.md`: the first blog post brief
  ("Being cited first in ChatGPT doesn't win the answer"). Not written or published yet.
- `vendor/@elmosky/*` (factory packages via `factory-launch sync`) and
  `scripts/check-vendor.mjs`, which fails the build if the vendored copy is edited here.
- `.env.example` and a real README.

### Removed (2026-11-11)
- `lib/supabase/*` and `lib/supabase-admin.ts` (replaced by `lib/db.ts`), the unused
  template rates reads, and the unused `@supabase/ssr` and Tiptap v3 dependencies.

### Changed (2026-10-17)
- **A rebuilt page comes out identical when nothing in it changed, so it costs no ISR
  write.** Two causes, both fixed. `getPostBySlug` (`lib/data.ts`) is wrapped in React
  `cache()`, so `generateMetadata` and the page share one database read instead of racing
  two and writing the page in whichever order the answers arrive. And `next.config` sets
  `htmlLimitedBots: /.*/`: Next streamed metadata for people but waited for it for
  link-preview bots (Bing, Slack, Facebook), so the cached page flipped between two versions
  depending on who triggered the rebuild. Measured on local production builds by forcing one
  unchanged article to rebuild 20 times: polyphenolguide went from 15 of 20 rebuilds
  changing to 1 of 20; soyfreesnacks, with people and bots taking turns, from 20 of 20 to 0
  of 20. Vercel bills a write only when a rebuild's output changed.

### Added (2026-10-01)
- `app/not-found.tsx`: a branded 404 inside the site layout, linking home and the
  main nav pages.
- `app/error.tsx`: an error boundary with a retry button, so one failing page no
  longer shows Next's bare "Application error" screen.
- `app/opengraph-image.tsx`: a site-wide share card (tagline, domain, channel
  gradient) rendered with Inter from `assets/og-fonts/inter-600.ttf`.
- `app/blog/[slug]/opengraph-image.tsx`: a per-post share card with the post's
  title. It's used only when the post has no `og_image` or `featured_image`; the
  post page now leaves `openGraph.images` / `twitter.images` unset in that case,
  since setting them (even to `[]`) overrides the generated card.
- `app/apple-icon.tsx`: a 180px home-screen icon drawing the header's tri-dot mark.
- `app/manifest.ts`: web app manifest at `/manifest.webmanifest`.
- `app/feed.xml/route.ts`: RSS of the 50 newest published posts. A failed or
  unconfigured posts query returns 503 instead of an empty feed.

### Fixed
- `/blog` returned a 500 in production. `lib/supabase/server.ts` read
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but this deployment
  sets the un-prefixed `SUPABASE_URL` / `SUPABASE_ANON_KEY`, so the client was
  constructed with `undefined` and threw. The client now accepts either name.
- Content reads in `lib/data.ts` no longer take a page down. If Supabase is
  unconfigured or a query fails, the page renders its empty state and the error is
  logged instead of thrown. Next's own control-flow errors (the `cookies()` dynamic
  bailout, `notFound()`) are rethrown via `unstable_rethrow` so the framework still
  sees them.

### Added
- `/terms` and `/privacy` pages, written in plain language for the $29 audit product.
  **These are interim by design** and get revised as the product expands; the specific
  details that are placeholders rather than verified facts (contact address, refund
  terms, missing legal entity and governing law, retention periods) and the triggers
  for revisiting them are documented in `docs/LEGAL-PAGES.md`.
- `app/robots.ts` (allows crawling, disallows `/api/` and `/audit/result`, points at
  the sitemap).
- `app/sitemap.ts` covering the public pages and published blog posts. Customer
  report pages are excluded on purpose.
- Canonical URLs on `/`, `/how-it-works`, `/sample-report`, `/pricing`, `/blog`,
  `/terms`, and `/privacy`.

### Removed
- Dead nav and footer links to `/resources` and `/login`. Neither feature exists in
  the codebase (there is no auth of any kind), so the links 404'd.
