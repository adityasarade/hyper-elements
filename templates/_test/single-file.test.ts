/**
 * Every template's copyable file, in every brand: swapping its brand block for another brand's gives that brand's file,
 * each typechecks under `strict` against the packages on its own, and each checks and renders as the matrix does. The
 * same template as two files (its code and `brand.ts`, what a template's page shows) typechecks and renders the same.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { render } from "@hyper-elements/react";
import { check, type Template } from "@hyper-elements/react/template";
import { ROOT } from "../_scripts/assets";
import { createElement } from "react";
import { brandBlock, designFile, singleFile, splitFiles, swapBrand } from "../_scripts/single-file";
import { brands, templates } from "./discover";

const OUT = join(ROOT, ".single");
const [all, sampleBrands] = [await templates(), await brands()];
const files: Array<{ id: string; brand: string; file: string }> = [];
const splits: Array<{ id: string; brand: string; code: string; single: string; design: string }> = [];

beforeAll(() => {
  rmSync(OUT, { recursive: true, force: true });
  for (const t of all) {
    for (const { id: brand } of sampleBrands) {
      const file = join(OUT, t.kit, brand, `${t.folder}.${t.category}.tsx`);
      mkdirSync(join(file, ".."), { recursive: true });
      writeFileSync(file, singleFile(t.file, join(ROOT, "_brands", `${brand}.ts`)));
      files.push({ id: t.id, brand, file });
      const split = splitFiles(t.file, join(ROOT, "_brands", `${brand}.ts`));
      const dir = join(OUT, "split", t.kit, brand, `${t.folder}.${t.category}`);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${t.category}.tsx`), split.code);
      writeFileSync(join(dir, "brand.ts"), split.brand);
      const example = t.make(sampleBrands.find((b) => b.id === brand)!.brand).example as Record<string, unknown>;
      writeFileSync(join(dir, "design.tsx"), designFile(t.category, example));
      splits.push({ id: t.id, brand, code: join(dir, `${t.category}.tsx`), single: file, design: join(dir, "design.tsx") });
    }
  }
});

it("gives a brand's file when another brand's block is swapped in, as the Brand menu does", () => {
  for (const t of all) {
    const first = singleFile(t.file, join(ROOT, "_brands", `${sampleBrands[0].id}.ts`));
    for (const { id } of sampleBrands) {
      const brandFile = join(ROOT, "_brands", `${id}.ts`);
      expect(swapBrand(first, brandBlock(brandFile)), `${t.id} as ${id}`).toBe(singleFile(t.file, brandFile));
    }
  }
});

it("typechecks every file on its own, and every template's two files together, under strict", () => {
  const program = ts.createProgram(
    [...files.map((f) => f.file), ...splits.flatMap((s) => [s.code, s.design])],
    {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
      types: [],
      isolatedModules: true,
    },
  );
  const problems = ts
    .getPreEmitDiagnostics(program)
    .map((d) => `${d.file ? relative(ROOT, d.file.fileName) : ""}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
  expect(problems).toEqual([]);
});

it("checks and renders every file as the template does", async () => {
  for (const { id, brand, file } of files) {
    const tpl = ((await import(file)) as { default: Template }).default;
    expect(tpl.id, file).toBe(id);
    const format = tpl.formats ? Object.keys(tpl.formats)[0] : undefined;
    const checked = tpl.check(tpl.example, format ? { format } : {});
    expect(checked.valid, `${id} in ${brand}`).toBe(true);
    if (tpl.root === "Email" || tpl.root === "Page" || tpl.root === "Document") await render(checked.snapshots[(format ?? "default") as never]!);
  }
});

it("renders a template's two files as its single file does, and its design as its example", async () => {
  for (const { id, brand, code, single, design } of splits.filter((s) => s.brand === sampleBrands[0].id || s.brand === sampleBrands.at(-1)!.id)) {
    const [a, b] = await Promise.all([code, single].map(async (file) => ((await import(file)) as { default: Template }).default));
    expect(a.id, code).toBe(id);
    const format = a.formats ? Object.keys(a.formats)[0] : undefined;
    const [ca, cb] = [a, b].map((tpl) => tpl.check(tpl.example, format ? { format } : {}));
    expect(ca.valid, `${id} in ${brand}`).toBe(true);
    if (a.root === "Canvas") continue;
    const key = (format ?? "default") as never;
    const html = (await render(cb.snapshots[key]!)).html;
    expect((await render(ca.snapshots[key]!)).html, `${id} in ${brand}`).toBe(html);
    const Design = ((await import(design)) as { default: () => React.ReactElement }).default;
    const checked = check(createElement(Design));
    expect(checked.valid, `${id}'s design in ${brand}`).toBe(true);
    expect((await render(checked.snapshots[key]!)).html, `${id}'s design in ${brand}`).toBe(html);
  }
});
