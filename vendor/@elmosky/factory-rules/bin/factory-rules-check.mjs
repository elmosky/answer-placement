#!/usr/bin/env node
/**
 * Build-time gate: run the site's rules over its seed content and exit non-zero
 * if any post breaks one. Wired into package.json as
 *   "build": "factory-rules-check && next build"
 * so content that violates a rule cannot be deployed, not merely discouraged.
 *
 *   factory-rules-check [--rules ./rules.site.mjs] [--content ./content/blog]
 *
 * Markdown files are read with a minimal front-matter parse (key: value), which
 * is all the seed format uses. Sites whose content lives only in the database
 * can skip this — the publish route runs the same rules.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { runRules } from "../src/index.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const rulesPath = resolve(flag("rules", "rules.site.mjs"));
const contentDir = resolve(flag("content", "content/blog"));

if (!existsSync(rulesPath)) {
  console.error(`factory-rules-check: no rules file at ${rulesPath}`);
  process.exit(1);
}
const siteRules = await import(pathToFileURL(rulesPath).href);

if (!existsSync(contentDir)) {
  console.log(`factory-rules-check: no content directory at ${contentDir} — nothing to validate (database-only site).`);
  process.exit(0);
}

/** Minimal front matter: `---` delimited `key: value` lines, then the body. */
function parse(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { body_markdown: raw };
  const post = { body_markdown: m[2] };
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) post[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  return post;
}

const files = readdirSync(contentDir).filter((f) => [".md", ".mdx"].includes(extname(f)));
let failed = 0;

for (const file of files) {
  const post = parse(readFileSync(join(contentDir, file), "utf8"));
  post.slug ??= file.replace(/\.mdx?$/, "");
  const problems = runRules(post, siteRules);
  if (problems.length) {
    failed++;
    console.error(`\n✗ ${file}`);
    for (const p of problems) console.error(`    ${p}`);
  }
}

if (failed) {
  console.error(`\nfactory-rules-check: ${failed} of ${files.length} posts break a rule. Build stopped.`);
  process.exit(1);
}
console.log(`factory-rules-check: ${files.length} posts pass.`);
