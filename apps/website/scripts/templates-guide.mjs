// The templates guide's full example, run for real: the commands the guide shows, with the CLI, on the example in
// examples/templates-guide/. The images the guide shows are the files those commands write.
//
//   pnpm --filter @hyper-elements/website generate:templates-guide     (needs `pnpm build`)
//
// Writes:
//   public/generated/templates-guide/*.png   each image the guide shows
//   src/generated/templates-guide.json       each command's output, as the guide quotes it
//
// It also fails if the guide's copy of the template isn't the example's file, so what's shown is what ran.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(site, "../..");
const example = join(site, "examples/templates-guide");
const out = join(site, "public/generated/templates-guide");
const cli = join(repo, "packages/cli/dist/bin.js");
const reactPackage = join(repo, "packages/react");

// A project of its own, as a reader's would be: the example's files, the brand's fonts, and the packages it installs.
const project = realpathSync(mkdtempSync(join(tmpdir(), "templates-guide-")));
try {
  cpSync(example, project, { recursive: true });
  mkdirSync(join(project, "fonts"));
  for (const font of ["Inter-Regular.ttf", "Inter-Bold.ttf"]) cpSync(join(repo, "benchmark/suites/image/fonts", font), join(project, "fonts", font));
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "templates-guide", private: true, type: "module", hyperElements: { templates: ["templates/**"] } }));
  const link = (name, target) => {
    mkdirSync(dirname(join(project, "node_modules", name)), { recursive: true });
    symlinkSync(realpathSync(target), join(project, "node_modules", name), "dir");
  };
  const elementsRequire = createRequire(join(reactPackage, "package.json"));
  link("@hyper-elements/react", reactPackage);
  for (const name of ["react", "react-dom", "satori", "@resvg/resvg-js"]) link(name, dirname(elementsRequire.resolve(`${name}/package.json`)));

  /** One command, as the guide writes it: its output and its exit code. */
  const run = (args) => {
    const env = { ...process.env, NO_COLOR: "1" };
    delete env.NODE_PATH;
    try {
      return { command: `npx hyper-elements ${args.join(" ")}`, code: 0, output: execFileSync(process.execPath, [cli, ...args], { cwd: project, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
    } catch (error) {
      return { command: `npx hyper-elements ${args.join(" ")}`, code: error.status, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
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
  // A design made from the template, checked, and rendered in both formats.
  steps.new = expect(run(["design", "new", "templates/launch-graphic.tsx", "-o", "designs/orbit.values.json", "--values", "brief.json", "--set", "screenshot=@designs/art/screenshot.png", "--set", "artwork=@designs/art/waves.png"]), 0);
  const file = JSON.parse(readFileSync(join(project, "designs/orbit.values.json"), "utf8"));
  steps.check = expect(run(["check", "designs/orbit.values.json"]), 0);
  steps.render = expect(run(["render", "designs/orbit.values.json"]), 0);
  save("out/designs/orbit.square.png", "orbit-square.png");
  save("out/designs/orbit.landscape.png", "orbit-landscape.png");

  // A longer headline: the same template draws it smaller, to fit its three lines.
  steps.long = expect(run(["design", "set", "designs/orbit.values.json", "headline=Meet Orbit 3.0: release notes that write themselves, in your voice"]), 0);
  steps.longCheck = expect(run(["check", "designs/orbit.values.json", "--json"]), 0);
  expect(run(["render", "designs/orbit.values.json"]), 0);
  save("out/designs/orbit.landscape.png", "long-landscape.png");

  // What the template refuses. A banner in place of the screenshot is refused as it's set, and the file stays as it was.
  steps.banner = expect(run(["design", "set", "designs/orbit.values.json", "screenshot=@designs/art/banner.png"]), 1);
  // A headline within its 90 characters that can't fit the landscape format's three lines is refused when it's measured.
  steps.unfit = expect(run(["design", "set", "designs/orbit.values.json", "headline=Meet Orbit 3.0: release notes that write themselves, in your own voice"]), 0);
  steps.unfitCheck = expect(run(["check", "designs/orbit.values.json"]), 1);

  const fit = steps.longCheck.output.trim().split("\n").slice(0, 2).map((line) => JSON.parse(line)).map((line) => ({ format: line.templateFormat, fits: line.fits }));
  const tidy = (step) => ({ command: step.command, code: step.code, output: step.output.replaceAll(project, ".").trimEnd() });
  writeFileSync(join(site, "src/generated/templates-guide.json"), `${JSON.stringify({ file, fit, steps: Object.fromEntries(Object.entries(steps).map(([name, step]) => [name, tidy(step)])) }, null, 2)}\n`);

  // The guide shows the example's own files.
  const shown = readFileSync(join(example, "templates/launch-graphic.tsx"), "utf8").trimEnd();
  for (const guide of [join(site, "src/content/docs/guides/templates.md"), join(repo, "packages/react/docs/templates.md")]) {
    if (!readFileSync(guide, "utf8").includes(shown)) throw new Error(`${guide} doesn't hold examples/templates-guide/templates/launch-graphic.tsx as it is: copy it into the guide's full example`);
  }
  console.log(`wrote public/generated/templates-guide/ and src/generated/templates-guide.json`);
} finally {
  rmSync(project, { recursive: true, force: true });
}
