// The template suite's own test, before any agent runs (no API):
//
//   node suites/template/selftest.mjs [--only refs,negative,authoring] [--kits he,react-email,mjml,html] [--write-references]
//
// 1. refs: each kit's reference issue of each brief (suites/template/reference) renders, passes the email checker and
//    keeps every guardrail; its header and footer are the kit's own (tools/brand-reference.json, which
//    --write-references writes from the first brief's).
// 2. negative: references broken on purpose (a changed header or footer, no unsubscribe link or preview text, a link
//    off the domains or without its UTM tag, a color or font off the brand, an image without alt, no button) each
//    fail the guardrail named; and the Hyper Elements kit's template refuses its broken issues, saying why.
// 3. authoring: each kit's newsletter as Orbit's maintainers wrote it, given the authoring check: the reference issue
//    passes; the template refuses every hostile body (none escapes), and in every other kit each hostile body is
//    taken and breaks the guardrail it names, so the check can see each escape.
import { spawn } from "node:child_process";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { briefOf, briefsOf, makeRun } from "../../lib/make-run.mjs";

const bench = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const suiteDir = join(bench, "suites/template");
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const only = arg("only", "refs,negative,authoring").split(",");
const kits = arg("kits", "he,react-email,mjml,html").split(",");
const writeReferences = process.argv.includes("--write-references");
const briefs = await briefsOf("template", "email");
const root = join(bench, "runs", "selftest-template");
await rm(root, { recursive: true, force: true });

function sh(cmd, args, cwd) {
  return new Promise((done) => {
    const p = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => done({ code, out, err }));
  });
}
const lastJson = (text) => {
  try {
    return JSON.parse(text.trim().split("\n").pop());
  } catch {
    return null;
  }
};
const failedNames = (r) => (r?.results ?? []).filter((x) => !x.ok).map((x) => x.name);
const referenceOf = async (kit) => (await import(pathToFileURL(join(suiteDir, "reference", `${kit}.mjs`)).href)).files;

/** A sub that must apply: a negative control that changes nothing would pass for the wrong reason. */
const sub = (from, to) => (text) => {
  if (!text.includes(from)) throw new Error(`selftest: "${from.slice(0, 60)}" isn't in the reference`);
  return text.replace(from, to);
};

/** A kit's reference issue of a brief, edited, in a fresh run: rendered, then checked. */
async function attempt(name, kit, brief, edit = (_path, text) => text) {
  const dir = await makeRun("template", kit, brief, name, root);
  const files = (await referenceOf(kit))((await briefOf("template", brief)).content);
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), edit(path, text));
  }
  const render = existsSync(join(dir, "tools/render.mjs")) ? await sh("node", ["tools/render.mjs"], dir) : { code: 0, out: "", err: "" };
  const email = render.code === 0 ? lastJson((await sh("node", ["tools/check.mjs", "--json"], dir)).out) : null;
  const guard = render.code === 0 ? lastJson((await sh("node", ["tools/guardrails.mjs", "--json"], dir)).out) : null;
  const parts = render.code === 0 ? lastJson((await sh("node", ["tools/guardrails.mjs", "--parts"], dir)).out) : null;
  return { dir, render, email, guard, parts };
}

let failures = 0;
const fail = (message) => {
  failures++;
  console.log(`  ✗ ${message}`);
};

if (writeReferences) {
  console.log("Writing each kit's tools/brand-reference.json from its first brief's reference.");
  for (const kit of kits) {
    const { render, parts } = await attempt("parts", kit, briefs[0]);
    if (render.code !== 0 || !parts?.header || !parts?.footer) {
      fail(`${kit}: no header and footer to write (${render.err.slice(0, 200)})`);
      continue;
    }
    const to = join(suiteDir, "kits", kit, "tools/brand-reference.json");
    await mkdir(dirname(to), { recursive: true });
    await writeFile(to, `${JSON.stringify(parts, null, 2)}\n`);
    console.log(`  ✓ ${kit}`);
  }
}

if (only.includes("refs")) {
  console.log("References: each renders, passes the email check and keeps every guardrail, its header and footer the kit's own.");
  for (const brief of briefs) {
    for (const kit of kits) {
      const { render, email, guard } = await attempt("ref", kit, brief);
      if (render.code !== 0) fail(`${kit} ${brief}: the render failed: ${(render.err || render.out).slice(0, 300)}`);
      else if (!email?.pass) fail(`${kit} ${brief}: the email check: ${email ? email.results.filter((r) => !r.ok).map((r) => `${r.name} — ${r.detail}`).join(" | ") : "didn't run"}`);
      else if (!guard?.pass) fail(`${kit} ${brief}: the guardrails: ${guard ? guard.results.filter((r) => !r.ok).map((r) => `${r.name} — ${r.detail}`).join(" | ") : "didn't run"}`);
      else console.log(`  ✓ ${kit} ${brief} (${email.total} email checks, ${guard.total} guardrails)`);
    }
  }
}

if (only.includes("negative")) {
  console.log("Broken references: each fails the guardrail named.");
  const brief = briefs[0];
  const at = (file, from, to) => (path, text) => (path === file ? sub(from, to)(text) : text);
  const NEGATIVE = [
    ["html", "brand header", "a header with a logo of another size", at("out/email.html", 'width="126" height="64" alt="Orbit"', 'width="120" height="61" alt="Orbit"')],
    ["html", "brand footer", "a footer with another address", at("out/email.html", "Orbit Labs, 500 Market St, San Francisco.", "Orbit Labs, San Francisco.")],
    ["html", "unsubscribe link", "no unsubscribe link", at("out/email.html", 'href="https://orbit.dev/unsubscribe?utm_source=newsletter"', 'href="https://orbit.dev/?utm_source=newsletter"')],
    ["html", "preview text", "no preview text", (path, text) => (path === "out/email.html" ? text.replace(/(opacity: 0;">)[^<]*/, "$1Another issue's preview") : text)],
    ["react-email", "link domains", "a button off Orbit's domains", (path, text) => (path === "emails/email.tsx" ? text.replace(/href="https:\/\/[a-z.]*orbit\.dev\/[^"]*"/, 'href="https://elsewhere.example/?utm_source=newsletter"') : text)],
    ["react-email", "UTM parameter", "a button without its UTM tag", (path, text) => (path === "emails/email.tsx" ? text.replace("?utm_source=newsletter", "") : text)],
    ["mjml", "palette colors", "a text in a color off the palette", at("emails/email.mjml", "<mj-text>", '<mj-text color="#ff0066">')],
    ["html", "brand fonts", "a text in another font", at("out/email.html", 'color: #1f2937; font-family: Helvetica, Arial, sans-serif; font-size: 16px;', 'color: #1f2937; font-family: Georgia, serif; font-size: 16px;')],
    ["html", "image alt", "an image without alt text", (path, text) => (path === "out/email.html" ? text.replace(/(<img src="https:\/\/assets\.orbit\.dev\/img\/(?!orbit-logo)[^"]+" width="536") alt="[^"]*"/, '$1 alt=""') : text)],
    ["html", "call to action", "no button", (path, text) => (path === "out/email.html" ? text.replace(/<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px;">[\s\S]*?<\/table>/g, "") : text)],
  ];
  for (const [kit, named, what, edit] of NEGATIVE) {
    if (!kits.includes(kit)) continue;
    const { render, guard } = await attempt(`neg-${named.replace(/\W+/g, "-")}`, kit, brief, edit);
    const failed = failedNames(guard);
    if (render.code !== 0) fail(`${kit}, ${what}: the render failed: ${render.err.slice(0, 200)}`);
    else if (!failed.includes(named)) fail(`${kit}, ${what}: expected "${named}" to fail; failed: ${failed.join(", ") || "nothing"}`);
    else console.log(`  ✓ ${kit}, ${what}: ${named}`);
  }
  // The template refuses what the others would take: the issue isn't written.
  if (kits.includes("he")) {
    const HE = [
      ["template/slot-style", "a body with a style of its own", sub("<Text>", '<Text style={{ color: "#ff0066" }}>')],
      ["template/link-domain", "a button off Orbit's domains", (text) => text.replace(/href="https:\/\/[a-z.]*orbit\.dev\/[^"]*"/, 'href="https://elsewhere.example/?utm_source=newsletter"')],
      ["template/slot-count", "a body with no button", (text) => text.replace(/\n\s*<Button[^\n]*<\/Button>/g, "")],
    ];
    for (const [code, what, edit] of HE) {
      const { dir, render } = await attempt(`neg-he-${code.replace(/\W+/g, "-")}`, "he", brief, (path, text) => (path === "designs/newsletter.tsx" ? edit(text) : text));
      const said = render.out + render.err;
      if (render.code === 0) fail(`he, ${what}: rendered; the template should refuse it with ${code}`);
      else if (!said.includes(code)) fail(`he, ${what}: refused, but not with ${code}: ${said.slice(0, 300)}`);
      else if (existsSync(join(dir, "out/email.html"))) fail(`he, ${what}: refused, but out/email.html was written`);
      else console.log(`  ✓ he, ${what}: refused, ${code}`);
    }
  }
}

if (only.includes("authoring")) {
  console.log("Authoring: each kit's newsletter as its maintainers wrote it, given the reference issue and the hostile bodies.");
  for (const kit of kits) {
    const dir = await makeRun("template", `${kit}-author`, "authoring", "maintainers", root);
    // What the authoring agent would write: the production kit's own files (its template, layout, includes or starter).
    const own = join(suiteDir, "kits", kit);
    for (const entry of await readdir(own)) {
      if (["kit.json", "CLAUDE.md", "tools"].includes(entry)) continue;
      await cp(join(own, entry), join(dir, entry), { recursive: true });
    }
    const ran = await sh("node", ["tools/check.mjs", "--json"], dir);
    const result = lastJson(ran.out);
    if (!result?.pass) {
      fail(`${kit}: the reference issue didn't pass: ${result ? result.results.filter((r) => !r.ok).map((r) => `${r.name} — ${r.detail}`).join(" | ") : (ran.err || ran.out).slice(0, 300)}`);
      continue;
    }
    const { held, escaped, hostile, bodies } = result.measures;
    if (kit === "he") {
      if (escaped !== 0 || held !== hostile) fail(`he: ${escaped} hostile bodies escaped: ${bodies.filter((b) => !b.held).map((b) => b.name).join(", ")}`);
      else console.log(`  ✓ he: the template refused all ${hostile} (${bodies.map((b) => b.refused.join("+")).join(", ")})`);
      continue;
    }
    const unseen = bodies.filter((b) => !b.escaped || !b.broke.includes(b.expected));
    if (unseen.length) fail(`${kit}: hostile bodies the check didn't see break their guardrail: ${unseen.map((b) => `${b.name} (broke ${b.broke?.join(", ") || "nothing"}, expected ${b.expected})`).join("; ")}`);
    else console.log(`  ✓ ${kit}: ${escaped} of ${hostile} escaped, each breaking its guardrail (${bodies.map((b) => b.expected).join(", ")})`);
  }
}

console.log(failures ? `\n${failures} failed.` : "\nAll passed.");
process.exit(failures ? 1 : 0);
