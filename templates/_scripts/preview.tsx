/**
 * A kit in every sample brand, to look at before a pull request: each template's HTML (or PNG, for an image) in
 * `templates/.preview/<kit>/`, with an `index.html` that shows them side by side. Asset addresses point at this checkout's
 * files, so nothing is fetched from the live site.
 *
 *   pnpm --filter ./templates preview <kit>
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { render } from "@hyper-elements/react";
import { renderImage, templateAssets } from "@hyper-elements/react/image";
import { ASSETS } from "../_brand";
import { brands, templates } from "../_test/discover";
import { ASSET_DIR, ROOT, fontFiles, imageFiles } from "./assets";

const kit = process.argv[2];
if (!kit) throw new Error("usage: preview <kit>");
const out = join(ROOT, ".preview", kit);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const local = (html: string) => html.replaceAll(ASSETS, `${pathToFileURL(ASSET_DIR).href}/`);
const cells: string[] = [];

for (const t of (await templates()).filter((x) => x.kit === kit)) {
  cells.push(`<h2>${t.folder}/${t.category}</h2><div class="row">`);
  for (const { id, brand } of await brands()) {
    const tpl = t.make(brand);
    for (const format of tpl.formats ? Object.keys(tpl.formats) : [undefined]) {
      const checked = tpl.check(tpl.example, format ? { format } : {});
      const label = `${brand.name}${format ? `, ${format}` : ""}`;
      if (!checked.valid) {
        cells.push(`<figure><pre>${checked.diagnostics.map((d) => `${d.code}: ${d.message}`).join("\n")}</pre><figcaption>${label}: invalid</figcaption></figure>`);
        continue;
      }
      const snapshot = checked.snapshots[(format ?? "default") as never]!;
      const name = `${t.folder}.${t.category}.${id}${format ? `.${format}` : ""}`;
      if (t.root === "Canvas") {
        const { image } = await renderImage(snapshot, { fonts: fontFiles(brand), images: imageFiles(templateAssets(snapshot).images) });
        writeFileSync(join(out, `${name}.png`), image);
        cells.push(`<figure><img src="${name}.png" width="360"><figcaption>${label}</figcaption></figure>`);
      } else {
        const { html } = await render(snapshot);
        writeFileSync(join(out, `${name}.html`), local(html));
        cells.push(`<figure><iframe src="${name}.html" width="420" height="640"></iframe><figcaption>${label}</figcaption></figure>`);
      }
    }
  }
  cells.push("</div>");
}

writeFileSync(
  join(out, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>${kit}</title><style>body{font:14px system-ui;margin:24px;background:#f4f4f5}.row{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0}iframe,img{border:1px solid #d4d4d8;background:#fff}</style><h1>${kit}</h1>${cells.join("\n")}`,
);
console.log(relative(process.cwd(), join(out, "index.html")));
