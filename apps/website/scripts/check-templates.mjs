// Run after `pnpm --filter @hyper-elements/website build`.
// The templates pages: every kit and template has its page, each old designs-gallery address redirects to the
// playground with its design open (its #starter= fragment kept), and no page links to an old gallery address.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const data = JSON.parse(readFileSync(new URL("../src/generated/kits.json", import.meta.url), "utf8"));
const gallery = Object.keys(JSON.parse(readFileSync(new URL("../src/generated/examples.json", import.meta.url), "utf8")).templates);
const page = (path) => join(dist, path.replace(/^\//, ""), "index.html");

assert(existsSync(page("/templates")), "no /templates page");
for (const t of data.templates) {
  const html = readFileSync(page(`/templates/${t.kit}/${t.folder}/${t.category}`), "utf8");
  for (const brand of data.brands) assert(html.includes(`data-brand="${brand.id}"`), `${t.key}: no preview in ${brand.id}`);
  assert(html.includes("// brand: start"), `${t.key}: no single file`);
}
for (const kit of data.kits) {
  const html = readFileSync(page(`/templates/${kit.id}`), "utf8");
  const members = data.templates.filter((t) => t.kit === kit.id);
  if (members.length === 1) assert.match(html, new RegExp(`http-equiv="refresh"[^>]*url=/templates/${members[0].kit}/${members[0].folder}/${members[0].category}`), `${kit.id}: a kit of one redirects to its template`);
}

for (const slug of gallery) {
  const file = page(`/templates/${slug}`);
  assert(existsSync(file), `/templates/${slug}: no redirect`);
  assert.match(readFileSync(file, "utf8"), new RegExp(`http-equiv="refresh"[^>]*url=/playground#starter=${slug}"`), `/templates/${slug} doesn't redirect to the playground with its design`);
}

const old = new RegExp(`href="(?:https://(?:www\\.)?hyperelements\\.dev)?/templates/(${gallery.join("|")})"`);
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(html|txt)$/.test(entry.name)) files.push(path);
  }
})(dist);
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (/http-equiv="refresh"/.test(text)) continue;
  assert(!old.test(text), `${relative(dist, file)} links to an old gallery address: ${text.match(old)?.[0]}`);
  if (file.endsWith("llms.txt")) assert(!new RegExp(`/templates/(${gallery.join("|")})\\b`).test(text), "llms.txt names an old gallery address");
}
console.log(`templates pages: ${data.templates.length} templates, ${data.kits.length} kits, ${gallery.length} redirects`);
