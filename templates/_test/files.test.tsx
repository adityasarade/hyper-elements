/** A Canvas template's image fields are checked against the real files: a size or type that disagrees with the bytes fails. */
import { checkLayout, sniffImage } from "@hyper-elements/react/template";
import { layoutImage, templateAssets } from "@hyper-elements/react/image";
import { brand as orbit } from "../_brands/orbit";
import { assetBytes, fontFiles, imageFiles } from "../_scripts/assets";
import { templates } from "./discover";

it("fails an image whose declared size disagrees with its file", async () => {
  const tpl = (await templates()).find((t) => t.id === "templates.SignalAnnouncementCanvas")!.make(orbit);
  const shot = tpl.example.screenshot as { src: string; width: number; height: number };
  const values = { ...tpl.example, screenshot: { ...shot, width: 2400, height: 1500 } };
  const checked = tpl.check(values, { format: "square" });
  expect(checked.valid).toBe(true);
  const snapshot = checked.snapshots.square!;
  const fonts = fontFiles(orbit);
  const images = imageFiles(templateAssets(snapshot).images);
  const layout = await layoutImage(snapshot, { fonts, images, strict: true });
  const files = { screenshot: sniffImage(assetBytes(shot.src))!, artwork: sniffImage(assetBytes((tpl.example.artwork as { src: string }).src))! };
  const report = checkLayout(tpl, checked.values, { format: "square", scale: 1, layout, files, checked });
  expect(report.diagnostics.filter((d) => d.severity === "error").map((d) => d.code)).toContain("template/asset-size");
});
