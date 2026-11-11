#!/usr/bin/env node
/**
 * Fail the build if anything under vendor/@elmosky was edited in this repo.
 *
 * Vendored packages are a copy of factory-packages, which is the only place
 * that code is allowed to change. Editing the copy here is how the old
 * copy-paste era produced sites that silently disagreed with each other, so it
 * is a build failure rather than a convention.
 *
 * Self-contained on purpose: no dependency on factory-cli, so it runs on Vercel
 * exactly as it runs locally.
 *
 * To change vendored code: edit ~/projects/factory-packages, `npm run build`
 * there, then `factory-launch sync <slug> --apply` here.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ROOT = new URL("../vendor/@elmosky/", import.meta.url).pathname;
const MANIFEST = join(ROOT, "MANIFEST.json");

if (!existsSync(MANIFEST)) {
  console.log("check-vendor: no vendored packages, skipping.");
  process.exit(0);
}

/**
 * What a package ships comes from its OWN package.json "files" field, not a
 * list maintained here. A hardcoded list has to be updated in two repos every
 * time a package is added, and forgetting the second one fails the build with
 * "edited in this repo", which points at the wrong problem entirely.
 */
function shippedFiles(pkgDir) {
  const pkgJson = join(pkgDir, "package.json");
  if (!existsSync(pkgJson)) return [];
  const files = JSON.parse(readFileSync(pkgJson, "utf8")).files ?? [];
  return [...files, "package.json"];
}

function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, base, out);
    else out.push([full.slice(base.length + 1), readFileSync(full)]);
  }
  return out;
}

function hashPackage(pkgDir) {
  const h = createHash("sha256");
  for (const item of shippedFiles(pkgDir)) {
    const path = join(pkgDir, item);
    if (!existsSync(path)) continue;
    if (statSync(path).isDirectory()) {
      for (const [rel, buf] of walk(path).sort((a, b) => a[0].localeCompare(b[0]))) h.update(rel).update(buf);
    } else {
      h.update(item).update(readFileSync(path));
    }
  }
  return h.digest("hex").slice(0, 16);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const tampered = [];
for (const [name, hashes] of Object.entries(manifest)) {
  const dir = join(ROOT, name);
  if (!existsSync(dir)) {
    tampered.push(`${name}: missing from vendor/`);
    continue;
  }
  const actual = hashPackage(dir);
  if (hashes.vendored && actual !== hashes.vendored) tampered.push(`${name}: edited in this repo`);
}

if (tampered.length) {
  console.error("check-vendor: vendored factory code was modified here.\n");
  for (const t of tampered) console.error(`  ${t}`);
  console.error("\nEdit ~/projects/factory-packages instead, then re-run: factory-launch sync <slug> --apply");
  process.exit(1);
}
console.log(`check-vendor: ${Object.keys(manifest).length} packages intact.`);
