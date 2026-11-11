#!/usr/bin/env node
/**
 * Coverage audit: find published posts carrying zero affiliate links, and
 * optionally heal them.
 *
 *   doppler run -p site-<slug> -c dev -- factory-affiliate-audit --site <slug> [--fix]
 *
 * Replaces the three per-repo copies of audit-affiliate-coverage.mjs, each of
 * which had a different hardcoded site UUID. The site comes from --site or
 * NEXT_PUBLIC_SITE_SLUG; the tenant filter comes from the client, not from a
 * constant that can go stale.
 */
import { createFactoryClient } from "@elmosky/factory-db";
import { auditCoverage } from "../dist/index.js";

const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? undefined : args[i + 1];
};

const siteSlug = flag("site") ?? process.env.NEXT_PUBLIC_SITE_SLUG;
const fix = args.includes("--fix");
if (!siteSlug) {
  console.error("Usage: factory-affiliate-audit --site <slug> [--fix]");
  process.exit(1);
}

const db = await createFactoryClient({ siteSlug });
const findings = await auditCoverage(db, { fix });

const by = (s) => findings.filter((f) => f.status === s);
for (const f of findings) {
  if (f.status === "ok" || f.status === "reference") continue;
  const detail = f.detail ? ` — ${f.detail}` : f.added ? ` — added ${f.added}` : "";
  console.log(`  ${f.status.toUpperCase().padEnd(9)} ${f.slug}${detail}`);
}

console.log(
  `\n${findings.length} published posts: ${by("ok").length} ok, ${by("reference").length} reference-only, ` +
    `${by("healed").length} healed, ${by("gap").length} gaps, ${by("no_match").length} no catalog match, ${by("error").length} errors`,
);

if (!fix && by("gap").length) console.log("Re-run with --fix to heal the gaps.");
// A remaining gap is a real failure for CI/cron use; no-match is a catalog task, not a failure.
process.exit(by("gap").length || by("error").length ? 1 : 0);
