/**
 * Every template, in every sample brand (and a recreation kit's own), in every format, by its root's path:
 *
 * - Email, Page: check(), then render() of the snapshot. An Email renders with the email client checks.
 * - Document: check(), render() for print HTML, then renderPdf() with the brand's fonts and the images it names.
 * - Canvas: check(), renderImage() with the fonts and images, then layoutImage(), sniffImage() and checkLayout() on the
 *   real files, as the CLI does.
 *
 * And for each: the neutral and pair checks with the probe brands, the contrast check with the real brand, a brand of the
 * contract's tokens only, the category's fields, and a baseline of what was written.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { render, validate, type Diagnostic } from "@hyper-elements/react";
import { checkLayout, sniffImage, type SniffedImage, type Template } from "@hyper-elements/react/template";
import { layoutImage, renderImage, templateAssets as imageAssets } from "@hyper-elements/react/image";
import { renderPdf, templateAssets as pdfAssets } from "@hyper-elements/react/pdf";
import { emailClients } from "@hyper-elements/email-clients";
import type { Brand } from "../_brand";
import { ROOT, assetBytes, fontFiles, imageFiles } from "../_scripts/assets";
import { checker, type Finding } from "./checks";
import { brands, categories, kits, templates } from "./discover";
import { PROBES, contractOnly, tokenNames } from "./probes";

const UPDATE = process.env.UPDATE_TEMPLATES === "1";
const BASELINE = join(ROOT, "_test", "__baseline__");
/** The email client warnings that mean content is lost: an image some clients don't show, a message Gmail clips. */
const EMAIL_LOSS = ["email/image-format", "email/size", "email/style-size"];
/** A PDF that couldn't draw a font or an image falls back, and says so: here, that fails. */
const PDF_LOSS = ["pdf/font", "pdf/image"];

const [all, sampleBrands, cats, kitList] = [await templates(), await brands(), await categories(), await kits()];
const clients = await emailClients();
const sha = (text: string | Uint8Array) => createHash("sha256").update(text).digest("hex").slice(0, 16);
const codes = (ds: readonly Diagnostic[]) => ds.map((d) => `${d.severity} ${d.code} ${d.path}`).sort();
const formatsOf = (tpl: Template) => (tpl.formats ? Object.keys(tpl.formats) : [undefined]);
const at = (format: string | undefined) => (format === undefined ? {} : { format });

/** The brands a template is drawn in: the samples, and its kit's company brand where it's a recreation. */
function brandsFor(kit: string): Array<{ id: string; brand: Brand }> {
  const own = kitList.find((k) => k.id === kit)?.brand;
  return own ? [{ id: `${kit} (original)`, brand: own }, ...sampleBrands] : sampleBrands;
}

/** Each image field's file, sniffed, by its field path. */
function sniffed(tpl: Template, values: Record<string, unknown>): Record<string, SniffedImage> {
  const files: Record<string, SniffedImage> = {};
  for (const field of tpl.describe().fields) {
    if (field.kind !== "image" || field.path.includes("[")) continue;
    const value = values[field.path] as { src?: string } | string | undefined;
    const src = typeof value === "string" ? value : value?.src;
    const file = src && sniffImage(assetBytes(src));
    if (file) files[field.path] = file;
  }
  return files;
}

const baseline: Record<string, Record<string, unknown>> = {};

for (const t of all) {
  describe(t.id, () => {
    const file = join(BASELINE, `${t.kit}.${t.folder}.${t.category}.json`);
    const recorded: Record<string, unknown> = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
    baseline[file] = {};

    it("has the id its path gives, and its category's fields", () => {
      const tpl = t.make(sampleBrands[0].brand);
      expect(tpl.id).toBe(t.id);
      expect(tpl.root).toBe(t.root);
      const category = cats.find((c) => c.id === t.category);
      expect(category, `templates/_categories/${t.category}.ts`).toBeDefined();
      expect(category!.category.roots as string[]).toContain(t.root);
      const required = category!.category.required as Record<string, { kind: { name: string } }>;
      for (const [key, spec] of Object.entries(required)) {
        const own = (tpl.fields as Record<string, { kind?: { name: string } }>)[key];
        expect(own, `${t.id} takes ${key}`).toBeDefined();
        expect(own.kind?.name, `${t.id}'s ${key}`).toBe(spec.kind.name);
      }
    });

    for (const { id: brandId, brand } of brandsFor(t.kit)) {
      for (const format of formatsOf(t.make(brand))) {
        const name = format ? `${brandId}, ${format}` : brandId;

        it(`renders in ${name}`, async () => {
          const tpl = t.make(brand);
          const checked = tpl.check(tpl.example, at(format));
          expect(codes(checked.diagnostics.filter((d) => d.severity === "error")), "check()").toEqual([]);
          expect(checked.valid).toBe(true);
          const snapshot = checked.snapshots[(format ?? "default") as never]!;
          let entry: Record<string, unknown>;
          if (t.root === "Email" || t.root === "Page") {
            const out = await render(snapshot, t.root === "Email" ? { plugins: [clients] } : {});
            const lost = out.diagnostics.filter((d) => EMAIL_LOSS.includes(d.code));
            expect(codes(lost), "content email clients lose").toEqual([]);
            entry = { html: sha(out.html), text: sha(out.text ?? ""), diagnostics: codes(out.diagnostics) };
          } else if (t.root === "Document") {
            const out = await render(snapshot);
            const images = imageFiles(pdfAssets(snapshot).images);
            const pdf = await renderPdf(snapshot, { fonts: fontFiles(brand), images });
            expect(codes(pdf.diagnostics.filter((d) => PDF_LOSS.includes(d.code))), "what the PDF couldn't draw").toEqual([]);
            entry = { html: sha(out.html), text: sha(out.text ?? ""), diagnostics: codes([...out.diagnostics, ...pdf.diagnostics]) };
          } else {
            const fonts = fontFiles(brand);
            const images = imageFiles(imageAssets(snapshot).images);
            const image = await renderImage(snapshot, { fonts, images });
            const layout = await layoutImage(snapshot, { fonts, images, strict: true });
            const scale = (format ? tpl.formats?.[format]?.scale : undefined) ?? 1;
            const report = checkLayout(tpl, checked.values, { ...at(format), scale, layout, files: sniffed(tpl, checked.values as Record<string, unknown>), checked });
            expect(codes(report.diagnostics.filter((d) => d.severity === "error")), "checkLayout()").toEqual([]);
            const unpassed = report.rules.filter((r) => r.status !== "passed").map((r) => `${r.rule} ${r.status}`);
            expect(unpassed, "required rules").toEqual([]);
            entry = { size: [image.width, image.height], fits: report.fits.map((f) => [f.field ?? f.path, f.chosen]), diagnostics: codes([...image.diagnostics, ...report.diagnostics]) };
          }
          const unpassed = checked.rules.filter((r) => r.status === "failed").map((r) => r.rule);
          expect(unpassed, "required rules").toEqual([]);
          baseline[file][name] = entry;
          if (!UPDATE) expect(entry, `the baseline in ${file} (UPDATE_TEMPLATES=1 rewrites it)`).toEqual(recorded[name]);
        });

        it(`has readable text in ${name}`, () => {
          const tpl = t.make(brand);
          const { plugin, findings } = checker({ contrast: true });
          validate(tpl.design(tpl.example as never, at(format) as never), { plugins: [plugin] });
          expect(findings.map((f: Finding) => `${f.check} ${f.path}: ${f.message}`)).toEqual([]);
        });
      }
    }

    for (const [i, probe] of PROBES.entries()) {
      it(`takes every color and font from the brand, and draws text in its pairs (probe ${i + 1})`, () => {
        const tpl = t.make(probe);
        const fonts = probe.theme.fonts as Record<string, string>;
        for (const format of formatsOf(tpl)) {
          const { plugin, findings } = checker({ probe: { names: tokenNames(probe), fonts: new Set([fonts.body, fonts.heading]) } });
          validate(tpl.design(tpl.example as never, at(format) as never), { plugins: [plugin] });
          expect(findings.map((f: Finding) => `${f.check} ${f.path}: ${f.message}`), format ?? "").toEqual([]);
        }
      });
    }

    it("needs only the contract's tokens", () => {
      const tpl = t.make(contractOnly(sampleBrands[0].brand));
      for (const format of formatsOf(tpl)) {
        const checked = tpl.check(tpl.example, at(format));
        expect(checked.diagnostics.filter((d) => d.code === "theme/missing-token").map((d) => d.message)).toEqual([]);
      }
    });
  });
}

afterAll(() => {
  if (!UPDATE) return;
  mkdirSync(BASELINE, { recursive: true });
  for (const [file, entries] of Object.entries(baseline)) {
    const sorted = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n");
  }
});
