/**
 * Every template's copyable file, in every brand: swapping its brand block for another brand's gives that brand's file,
 * each typechecks under `strict` against the packages on its own, and each checks and renders as the matrix does.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { render } from "@hyper-elements/react";
import type { Template } from "@hyper-elements/react/template";
import { ROOT } from "../_scripts/assets";
import { brandBlock, singleFile, swapBrand } from "../_scripts/single-file";
import { brands, templates } from "./discover";

const OUT = join(ROOT, ".single");
const [all, sampleBrands] = [await templates(), await brands()];
const files: Array<{ id: string; brand: string; file: string }> = [];

beforeAll(() => {
  rmSync(OUT, { recursive: true, force: true });
  for (const t of all) {
    for (const { id: brand } of sampleBrands) {
      const file = join(OUT, t.kit, brand, `${t.folder}.${t.category}.tsx`);
      mkdirSync(join(file, ".."), { recursive: true });
      writeFileSync(file, singleFile(t.file, join(ROOT, "_brands", `${brand}.ts`)));
      files.push({ id: t.id, brand, file });
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

it("typechecks every file on its own, under strict", () => {
  const program = ts.createProgram(
    files.map((f) => f.file),
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
