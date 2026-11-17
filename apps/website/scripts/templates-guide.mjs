// The templates docs' examples, run for real: the commands the docs show, with the CLI, on the examples in
// examples/templates-guide/. What the docs show is what those commands wrote.
//
//   pnpm --filter @hyper-elements/website generate:templates-guide
//
// It needs the packages built (`pnpm build`) and Playwright's Chromium (`npx playwright install chromium`), for the
// newsletter's picture.
//
// Writes:
//   public/generated/templates-guide/*.png   each image the docs show: the launch graphic in its formats, the
//                                            pictures a launch gives, and the newsletter as Chromium draws it
//   public/generated/templates-guide/parts.svg   the launch graphic with its fixed and open parts outlined, from
//                                            the boxes layoutImage() measured
//   src/generated/templates-guide.json       each command's output, as the docs quote it
//
// It fails if a doc's copy of an example isn't the example's file, so what's shown is what ran: a whole file where
// the doc shows one, and each excerpt (a block that starts `// from <file>`) line by line.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(site, "../..");
const example = join(site, "examples/templates-guide");
const out = join(site, "public/generated/templates-guide");
const cli = join(repo, "packages/cli/dist/bin.js");
const reactPackage = join(repo, "packages/react");
const cliRequire = createRequire(join(repo, "packages/cli/package.json"));

// A project of its own, as a reader's would be: the examples' files, the brand's fonts, and the packages it installs.
const project = realpathSync(mkdtempSync(join(tmpdir(), "templates-guide-")));
const env = { ...process.env, NO_COLOR: "1" };
delete env.NODE_PATH;
try {
  cpSync(example, project, { recursive: true });
  mkdirSync(join(project, "fonts"));
  for (const font of ["Inter-Regular.ttf", "Inter-Bold.ttf"]) cpSync(join(repo, "benchmark/suites/image/fonts", font), join(project, "fonts", font));
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "templates-guide", private: true, type: "module", hyperElements: { templates: ["templates/**"] } }));
  writeFileSync(join(project, "tsconfig.json"), JSON.stringify({ compilerOptions: { jsx: "react-jsx", module: "esnext", moduleResolution: "bundler", target: "es2022" } }));
  const link = (name, target) => {
    mkdirSync(dirname(join(project, "node_modules", name)), { recursive: true });
    symlinkSync(realpathSync(target), join(project, "node_modules", name), "dir");
  };
  const elementsRequire = createRequire(join(reactPackage, "package.json"));
  link("@hyper-elements/react", reactPackage);
  link("@hyper-elements/lint", join(repo, "packages/lint"));
  link("@hyper-elements/email-clients", join(repo, "packages/email-clients"));
  for (const name of ["react", "react-dom", "satori", "@resvg/resvg-js"]) link(name, dirname(elementsRequire.resolve(`${name}/package.json`)));

  /** One command, as the docs write it: its output and its exit code. */
  const run = (args) => {
    const command = `npx hyper-elements ${args.map((arg) => (/[\s:,]/.test(arg) && arg.includes("=") ? JSON.stringify(arg) : arg)).join(" ")}`;
    try {
      return { command, code: 0, output: execFileSync(process.execPath, [cli, ...args], { cwd: project, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
    } catch (error) {
      return { command, code: error.status, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
    }
  };
  const expect = (step, code) => {
    if (step.code !== code) throw new Error(`${step.command} exited ${step.code}, not ${code}:\n${step.output}`);
    return step;
  };
  const save = (from, to) => cpSync(join(project, from), join(out, to));
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const steps = {};

  // ── The launch graphic: a design made from the template, checked, and rendered in both formats ──
  steps.new = expect(run(["design", "new", "templates/launch-graphic.tsx", "-o", "designs/orbit.values.json", "--values", "brief.json", "--set", "screenshot=@designs/art/screenshot.png", "--set", "artwork=@designs/art/waves.png"]), 0);
  const file = JSON.parse(readFileSync(join(project, "designs/orbit.values.json"), "utf8"));
  steps.check = expect(run(["check", "designs/orbit.values.json"]), 0);
  steps.render = expect(run(["render", "designs/orbit.values.json"]), 0);
  save("out/designs/orbit.square.png", "orbit-square.png");
  save("out/designs/orbit.landscape.png", "orbit-landscape.png");
  // The pictures a launch gives: the one taken, and the one refused below.
  save("designs/art/screenshot.png", "art-screenshot.png");
  save("designs/art/banner.png", "art-banner.png");

  // Its parts, from the boxes the image entry measured: what the diagram outlines.
  writeFileSync(
    join(project, "layout.tsx"),
    `import { readFileSync } from "node:fs";
import { layoutImage } from "@hyper-elements/react/image";
import Launch from "./templates/launch-graphic";
const values = JSON.parse(readFileSync("designs/orbit.values.json", "utf8")).values;
// As the CLI reads them: the design's pictures beside it, the template's own beside the template.
const at = (src: string) => ({ ...values, screenshot: { ...values.screenshot, src: "../designs/art/screenshot.png" }, artwork: { ...values.artwork, src: "../designs/art/waves.png" } });
const checked = Launch.check(at(""), { format: "square" });
const file = (path: string) => new Uint8Array(readFileSync(path));
const fonts = [{ family: "Inter", src: file("fonts/Inter-Regular.ttf"), weight: 400 }, { family: "Inter", src: file("fonts/Inter-Bold.ttf"), weight: 700 }];
const images = { "../designs/art/screenshot.png": file("designs/art/screenshot.png"), "../designs/art/waves.png": file("designs/art/waves.png"), "./assets/orbit-logo.png": file("templates/assets/orbit-logo.png") };
const layout = await layoutImage(checked.snapshots.square!, { fonts, images });
process.stdout.write(JSON.stringify(layout.nodes.map(({ path, field, type, x, y, width, height }) => ({ path, field, type, x, y, width, height }))));
`
  );
  const nodes = JSON.parse(execFileSync(process.execPath, [cliRequire.resolve("tsx/cli"), "layout.tsx"], { cwd: project, env, encoding: "utf8" }));
  writeFileSync(join(out, "parts.svg"), partsDiagram(nodes, readFileSync(join(out, "orbit-square.png"))));

  // A longer headline: the same template draws it smaller where it has to, to fit its three lines.
  steps.long = expect(run(["design", "set", "designs/orbit.values.json", "headline=Meet Orbit 3.0: release notes that write themselves, in your voice"]), 0);
  steps.longCheck = expect(run(["check", "designs/orbit.values.json", "--json"]), 0);
  expect(run(["render", "designs/orbit.values.json"]), 0);
  save("out/designs/orbit.landscape.png", "long-landscape.png");

  // What the template refuses. A banner in place of the screenshot is refused as it's set, and the file stays as it was.
  steps.banner = expect(run(["design", "set", "designs/orbit.values.json", "screenshot=@designs/art/banner.png"]), 1);
  // A headline within its 90 characters that can't fit the landscape format's three lines is refused when it's measured.
  steps.unfit = expect(run(["design", "set", "designs/orbit.values.json", "headline=Meet Orbit 3.0: release notes that write themselves, in your own voice"]), 0);
  steps.unfitCheck = expect(run(["check", "designs/orbit.values.json"]), 1);

  // ── The newsletter: an issue written as TSX in its slot, checked and rendered; and one that isn't on brand ──
  steps.newsletterCheck = expect(run(["check", "designs/june.tsx"]), 0);
  steps.newsletterRender = expect(run(["render", "designs/june.tsx"]), 0);
  steps.offBrand = expect(run(["check", "designs/off-brand.tsx"]), 1);
  await screenshot(join(project, "out/designs/june.html"), join(out, "newsletter.png"), 680);

  const fit = steps.longCheck.output.trim().split("\n").slice(0, 2).map((line) => JSON.parse(line)).map((line) => ({ format: line.templateFormat, fits: line.fits }));
  const tidy = (step) => ({ command: step.command, code: step.code, output: step.output.replaceAll(project, ".").trimEnd() });
  writeFileSync(join(site, "src/generated/templates-guide.json"), `${JSON.stringify({ file, fit, steps: Object.fromEntries(Object.entries(steps).map(([name, step]) => [name, tidy(step)])) }, null, 2)}\n`);

  checkDocs(Object.fromEntries(Object.entries(steps).map(([name, step]) => [name, tidy(step).output])));
  console.log(`wrote public/generated/templates-guide/ and src/generated/templates-guide.json`);
} finally {
  rmSync(project, { recursive: true, force: true });
}

/** An HTML file as Chromium draws it at a width: a PNG of the whole page. */
async function screenshot(html, to, width) {
  const clientsDir = dirname(createRequire(join(site, "package.json")).resolve("@hyper-elements/email-clients/package.json"));
  const { chromium } = createRequire(join(clientsDir, "package.json"))("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height: 100 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(html).href);
    writeFileSync(to, await page.screenshot({ type: "png", fullPage: true }));
  } finally {
    await browser.close();
  }
}

/**
 * The square launch graphic with its parts outlined and named: the open fields (what a launch gives) and the fixed
 * parts (the template's). One SVG, the graphic inside it, so it's one file to show.
 */
function partsDiagram(nodes, png) {
  const SCALE = 0.42;
  const [side, gutter, labelWidth, pad] = [Math.round(1080 * SCALE), 48, 350, 16];
  const [width, height] = [pad + side + gutter + labelWidth + pad, pad + side + pad];
  const union = (boxes) => {
    const [x, y] = [Math.min(...boxes.map((b) => b.x)), Math.min(...boxes.map((b) => b.y))];
    return { x, y, width: Math.max(...boxes.map((b) => b.x + b.width)) - x, height: Math.max(...boxes.map((b) => b.y + b.height)) - y };
  };
  const byField = (test) => nodes.filter((node) => node.field && test(node.field));
  const logo = nodes.find((node) => node.type === "Image" && !node.field);
  const parts = [
    { label: "Logo", note: "Fixed: the template's own", box: logo, open: false },
    { label: "headline", note: "Text, up to 90 characters, fitted to three lines", box: union(byField((f) => f === "headline")), open: true },
    { label: "features", note: "Exactly three, up to 40 characters each", box: union(byField((f) => f.startsWith("features["))), open: true },
    { label: "launchDate", note: "A date, written for the language", box: union(byField((f) => f === "launchDate")), open: true },
    { label: "screenshot", note: "A PNG, 1.2:1 to 2:1, shown whole", box: union(byField((f) => f === "screenshot")), open: true },
    { label: "artwork", note: "A PNG that fills its region", box: union(byField((f) => f === "artwork")), open: true },
  ];
  const OPEN = "#2dd4bf";
  const FIXED = "#94a3b8";
  const rows = parts.length + 1;
  const rowHeight = (side - 8) / rows;
  const labelX = pad + side + gutter;
  const text = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const items = parts.map((part, i) => {
    const color = part.open ? OPEN : FIXED;
    const box = { x: pad + part.box.x * SCALE, y: pad + part.box.y * SCALE, width: part.box.width * SCALE, height: part.box.height * SCALE };
    const y = pad + 4 + rowHeight * i + rowHeight / 2;
    // The artwork is behind the screenshot: its leader starts from its own edge, below the screenshot's.
    const fromY = part.label === "artwork" ? box.y + box.height - 12 : box.y + box.height / 2;
    const fromX = box.x + box.width;
    return [
      `<rect x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.width.toFixed(1)}" height="${box.height.toFixed(1)}" rx="4" fill="none" stroke="${color}" stroke-width="2"${part.open ? "" : ' stroke-dasharray="6 4"'}/>`,
      `<path d="M${fromX.toFixed(1)} ${fromY.toFixed(1)} L${(labelX - 28).toFixed(1)} ${fromY.toFixed(1)} L${(labelX - 12).toFixed(1)} ${y.toFixed(1)} L${(labelX - 4).toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.7"/>`,
      `<circle cx="${labelX + 4}" cy="${y.toFixed(1)}" r="5" fill="${color}"/>`,
      `<text x="${labelX + 18}" y="${(y - 3).toFixed(1)}" font-size="18" font-weight="700" fill="#f1f5f9">${text(part.label)}</text>`,
      `<text x="${labelX + 18}" y="${(y + 17).toFixed(1)}" font-size="14.5" fill="#cbd5e1">${text(part.note)}</text>`,
    ].join("\n  ");
  });
  const lastY = pad + 4 + rowHeight * parts.length + rowHeight / 2;
  const fixedNote = [
    `<rect x="${labelX - 2}" y="${(lastY - 9).toFixed(1)}" width="12" height="12" rx="2" fill="none" stroke="${FIXED}" stroke-width="2" stroke-dasharray="3 2"/>`,
    `<text x="${labelX + 18}" y="${(lastY - 3).toFixed(1)}" font-size="18" font-weight="700" fill="#f1f5f9">Everything else</text>`,
    `<text x="${labelX + 18}" y="${(lastY + 17).toFixed(1)}" font-size="14.5" fill="#cbd5e1">Fixed: layout, colors, fonts, sizes</text>`,
  ].join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" role="img" aria-label="The square launch graphic with its parts outlined: the logo is fixed; the headline, the three features, the launch date, the screenshot and the artwork are open fields; everything else is fixed.">
  <rect width="${width}" height="${height}" rx="12" fill="#0f172a"/>
  <image x="${pad}" y="${pad}" width="${side}" height="${side}" href="data:image/png;base64,${png.toString("base64")}"/>
  ${items.join("\n  ")}
  ${fixedNote}
</svg>
`;
}

/**
 * Every copy of an example in the docs is the example's: a whole file, or an excerpt's lines in the file's order. And
 * the output the guide quotes for a command is what the command printed.
 */
function checkDocs(outputs) {
  const docs = [
    join(site, "src/content/docs/guides/templates.md"),
    join(site, "src/content/docs/guides/templates-fields.md"),
    join(site, "src/content/docs/guides/templates-slots.md"),
    join(site, "src/content/docs/guides/templates-checks.md"),
    join(site, "src/content/docs/guides/templates-cli.md"),
    join(repo, "packages/react/docs/templates.md"),
  ];
  const problems = [];
  for (const doc of docs) {
    let text;
    try {
      text = readFileSync(doc, "utf8");
    } catch {
      problems.push(`${doc} isn't there`);
      continue;
    }
    for (const [, block] of text.matchAll(/```tsx\n([\s\S]*?)```/g)) {
      const first = block.split("\n")[0];
      const whole = /^\/\/ ((?:templates|designs)\/[\w./-]+)$/.exec(first);
      const excerpt = /^\/\/ from ((?:templates|designs)\/[\w./-]+)$/.exec(first);
      if (!whole && !excerpt) continue;
      const name = (whole ?? excerpt)[1];
      let source;
      try {
        source = readFileSync(join(example, name), "utf8");
      } catch {
        continue; // Another project's file of that name: not one of these examples.
      }
      if (whole) {
        if (block.trimEnd() !== source.trimEnd()) problems.push(`${doc}: its copy of ${name} isn't examples/templates-guide/${name} as it is`);
        continue;
      }
      // An excerpt: each line, in the file's order (a line of only "// …" skips ahead).
      const lines = source.split("\n").map((line) => line.trim());
      let at = 0;
      for (const line of block.split("\n").slice(1).map((line) => line.trim()).filter((line) => line && line !== "// …")) {
        const found = lines.indexOf(line, at);
        if (found < 0) {
          problems.push(`${doc}: an excerpt of ${name} has a line that isn't in it (or is out of order): ${line}`);
          break;
        }
        at = found + 1;
      }
    }
  }
  const guide = readFileSync(docs[0], "utf8");
  for (const name of ["check", "render", "banner", "unfitCheck", "offBrand"]) {
    if (!guide.includes(outputs[name])) problems.push(`${docs[0]}: the output it quotes for "${name}" isn't what the command printed (see src/generated/templates-guide.json)`);
  }
  if (problems.length) throw new Error(`The docs and the examples differ:\n- ${problems.join("\n- ")}`);
}
