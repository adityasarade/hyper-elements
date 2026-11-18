/**
 * The website's templates pages' data: every template in every sample brand (and a recreation kit's own), each format,
 * as the site's examples are (HTML, plain text, outline, diagnostics, and a Document's PDF or a Canvas's PNG), with its
 * copyable single file. Writes `apps/website/src/generated/kits.json` and `apps/website/public/generated/kits/`, the
 * folder's assets copied under it, and deletes only those. Fails if any template fails, so stale pictures can't ship.
 *
 *   pnpm --filter @hyper-elements/website generate:kits
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { outline, render } from "@hyper-elements/react";
import { renderImage, templateAssets as imageAssets } from "@hyper-elements/react/image";
import { renderPdf, templateAssets as pdfAssets } from "@hyper-elements/react/pdf";
import { ASSETS, type Brand } from "../_brand";
import { brands, categories, kits, templates, type RootFolder } from "../_test/discover";
import { ASSET_DIR, ROOT, fontFiles, imageFiles } from "./assets";
import { brandBlock, singleFile } from "./single-file";

const SITE = join(ROOT, "..", "apps", "website");
const PUBLIC = join(SITE, "public", "generated", "kits");
const DATA = join(SITE, "src", "generated", "kits.json");
const GUIDE = join(SITE, "src", "content", "docs", "templates", "contributing.md");
const REPO = "https://github.com/hyper-elements/hyper-elements/blob/main/templates/";
const URL_BASE = "/generated/kits";
const lines = (ds: ReadonlyArray<{ severity: string; code: string; message: string; path?: string }>) => ds.map(({ severity, code, message, path }) => ({ severity, code, message, ...(path ? { path } : {}) }));

rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(PUBLIC, { recursive: true });
cpSync(ASSET_DIR, join(PUBLIC, "assets"), { recursive: true });

const [all, cats, kitList] = [await templates(), await categories(), await kits()];
// Orbit, the docs' brand, first: what a page shows before a visitor picks one.
const sampleBrands = (await brands()).sort((a, b) => (a.id === "orbit" ? -1 : b.id === "orbit" ? 1 : 0));
const failures: string[] = [];

/** One render of a template, in the shape the site's examples have. */
async function example(t: (typeof all)[number], brandId: string, brand: Brand, format: string | undefined) {
  const tpl = t.make(brand);
  const checked = tpl.check(tpl.example, format ? { format } : {});
  if (!checked.valid) throw new Error(`${t.id} in ${brandId}${format ? ` (${format})` : ""}: ${checked.diagnostics.map((d) => `${d.code} ${d.message}`).join("; ")}`);
  const snapshot = checked.snapshots[(format ?? "default") as never]!;
  const name = `${t.kit}.${t.folder}.${t.category}.${brandId}${format ? `.${format}` : ""}`;
  const base = { slug: `${t.kit}/${t.folder}/${t.category}`, title: `${tpl.label}, ${brand.name}`, description: tpl.description ?? "", root: t.root, source: "", html: "", text: "", outline: "", diagnostics: [] as ReturnType<typeof lines> };
  if (t.root === "Canvas") {
    const { image, diagnostics } = await renderImage(snapshot, { fonts: fontFiles(brand), images: imageFiles(imageAssets(snapshot).images) });
    writeFileSync(join(PUBLIC, `${name}.png`), image);
    return { ...base, outline: safeOutline(snapshot), diagnostics: lines(diagnostics), file: `${URL_BASE}/${name}.png` };
  }
  const out = await render(snapshot);
  const result = { ...base, html: out.html, text: out.text ?? "", outline: safeOutline(snapshot), diagnostics: lines(out.diagnostics) };
  if (t.root !== "Document") return result;
  const pdf = await renderPdf(snapshot, { fonts: fontFiles(brand), images: imageFiles(pdfAssets(snapshot).images) });
  writeFileSync(join(PUBLIC, `${name}.pdf`), pdf.pdf);
  return { ...result, diagnostics: lines([...out.diagnostics, ...pdf.diagnostics]), file: `${URL_BASE}/${name}.pdf` };
}

function safeOutline(snapshot: unknown): string {
  try {
    return outline(snapshot as never);
  } catch {
    return "";
  }
}

const OUTPUT: Record<RootFolder, string> = { emails: "Email", pages: "Web page", documents: "PDF", images: "Image" };
const data = {
  assets: ASSETS,
  brands: sampleBrands.map(({ id, brand }) => ({ id, name: brand.name, colors: brand.theme.colors, block: brandBlock(join(ROOT, "_brands", `${id}.ts`)) })),
  categories: Object.fromEntries(cats.map(({ id, category }) => [id, { label: category.label, group: category.group, useWhen: category.useWhen, avoidWhen: category.avoidWhen, roots: category.roots }])),
  kits: kitList.map(({ id, kit, brand }) => ({ id, ...kit, ...(brand ? { brand: { id: `${id}-original`, name: `Original (${kit.recreates?.company ?? brand.name})`, colors: brand.theme.colors, block: brandBlock(join(ROOT, id, "brand.ts")) } } : {}) })),
  templates: [] as unknown[],
};

for (const t of all) {
  const own = kitList.find((k) => k.id === t.kit)?.brand;
  const drawIn = own ? [{ id: `${t.kit}-original`, brand: own, file: join(ROOT, t.kit, "brand.ts") }, ...sampleBrands.map((b) => ({ ...b, file: join(ROOT, "_brands", `${b.id}.ts`) }))] : sampleBrands.map((b) => ({ ...b, file: join(ROOT, "_brands", `${b.id}.ts`) }));
  const tpl = t.make(drawIn[0].brand);
  const formats = tpl.formats ? Object.keys(tpl.formats) : [];
  const description = tpl.describe();
  const required = Object.keys((cats.find((c) => c.id === t.category)!.category.required ?? {}) as object);
  const byBrand: Record<string, unknown> = {};
  for (const { id, brand, file } of drawIn) {
    try {
      const views: Record<string, unknown> = {};
      for (const format of formats.length ? formats : [undefined]) views[format ?? "default"] = await example(t, id, brand, format);
      byBrand[id] = { views, single: singleFile(t.file, file) };
    } catch (error) {
      failures.push(String((error as Error).message ?? error));
    }
  }
  data.templates.push({
    key: `${t.kit}/${t.folder}/${t.category}`,
    id: t.id,
    kit: t.kit,
    folder: t.folder,
    output: OUTPUT[t.folder],
    root: t.root,
    category: t.category,
    label: tpl.label,
    description: tpl.description ?? "",
    guidance: tpl.guidance ?? "",
    author: (await import(t.file)).meta?.author ?? kitList.find((k) => k.id === t.kit)!.kit.author,
    ...((await import(t.file)).meta?.recreates ? { recreates: { company: kitList.find((k) => k.id === t.kit)!.kit.recreates?.company ?? "", ...(await import(t.file)).meta.recreates } } : {}),
    formats,
    fields: description.fields.map((f) => ({ path: f.path, kind: f.kind, label: f.label, required: f.required, fromCategory: required.includes(f.path.split(/[.[]/)[0]) })),
    rules: description.rules,
    file: relative(join(ROOT, ".."), t.file),
    byBrand,
  });
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
mkdirSync(join(DATA, ".."), { recursive: true });
writeFileSync(DATA, JSON.stringify(data) + "\n");

// The docs' "Contributing templates" page is the folder's guide: its links made the site's, and its title the page's.
const guide = readFileSync(join(ROOT, "CONTRIBUTING.md"), "utf8")
  .replace(/^# Contributing templates\n+/, "")
  .replace(/\]\(\.\/([^)]*)\)/g, (_, path) => `](${REPO}${path})`)
  .replace(/\]\(https:\/\/hyperelements\.dev(\/[^)]*)\)/g, "]($1)");
writeFileSync(
  GUIDE,
  `---\ntitle: "Contributing templates"\ndescription: "Add a template or a kit to the templates folder: how the folder works, the rules every template follows, categories, sample brands, and the checks before a pull request."\n---\n\n<!-- Written from templates/CONTRIBUTING.md by pnpm --filter @hyper-elements/website generate:kits. Edit that file, not this one. -->\n\n${guide}`,
);
console.log(`${relative(process.cwd(), DATA)}: ${data.templates.length} templates in ${data.brands.length} brands`);
