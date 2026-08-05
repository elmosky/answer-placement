# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
