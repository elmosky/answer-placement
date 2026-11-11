#!/usr/bin/env node
/**
 * Push locally-collected subscribers into beehiiv.
 *
 * Signups are saved to the factory database whether or not a sending platform
 * is configured, which means the ones collected before beehiiv existed (or
 * during an outage) are sitting there unsynced. This sends them.
 *
 *   factory-newsletter-backfill --site <slug>            # dry run, lists them
 *   factory-newsletter-backfill --site <slug> --apply
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BEEHIIV_API_KEY
 * and BEEHIIV_PUBLICATION_ID in the environment (run it under `doppler run`).
 *
 * Dry run by default, like every other factory command: this one sends real
 * email to real people through beehiiv's welcome flow.
 */
import { backfillToBeehiiv, beehiivFromEnv } from "../dist/index.js";

const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const apply = args.includes("--apply");
const slug = flag("site");

if (!slug) { console.error("usage: factory-newsletter-backfill --site <slug> [--apply]"); process.exit(1); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cfg = beehiivFromEnv();
if (!url || !key) { console.error("FAILED: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set"); process.exit(1); }
if (!cfg) { console.error("FAILED: BEEHIIV_API_KEY / BEEHIIV_PUBLICATION_ID not set"); process.exit(1); }

const h = { apikey: key, Authorization: `Bearer ${key}` };
const siteRes = await fetch(`${url}/rest/v1/sites?slug=eq.${slug}&select=id`, { headers: h });
const sites = await siteRes.json();
if (!sites[0]) { console.error(`FAILED: no site row for "${slug}"`); process.exit(1); }

const subsRes = await fetch(
  `${url}/rest/v1/subscribers?site_id=eq.${sites[0].id}&select=email,source,created_at&order=created_at.asc`,
  { headers: h },
);
const subs = await subsRes.json();

console.log(`\nbackfill ${slug} -> beehiiv publication ${cfg.publicationId}`);
console.log(`  ${subs.length} subscriber(s) in the factory database\n`);
if (!subs.length) process.exit(0);

if (!apply) {
  for (const s of subs.slice(0, 20)) console.log(`  WOULD SEND  ${s.email}  (${s.source ?? "site"}, ${s.created_at?.slice(0, 10)})`);
  if (subs.length > 20) console.log(`  ... and ${subs.length - 20} more`);
  console.log(`\nDry run. Re-run with --apply to send. beehiiv will email each of these people.`);
  process.exit(0);
}

const { synced, failed } = await backfillToBeehiiv(
  subs.map((s) => s.email),
  cfg,
  { onResult: (email, ok, detail) => console.log(`  ${ok ? "sent " : "FAIL "} ${email}${detail ? "  " + detail : ""}`) },
);
console.log(`\n${synced} synced, ${failed} failed.`);
process.exitCode = failed ? 1 : 0;
