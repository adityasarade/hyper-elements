/**
 * A template as a design's root, drawn by the image entry: renderImage() goes through prepare(), so the template's
 * check runs first, a failing one rejects with its problems, and what's drawn is the design the template built.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type React from "react";
import { renderImage } from "../../src/image";
import { launch } from "../../src/template/examples";

const STANDARD = join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts");
const fonts = [{ family: "Liberation Sans", src: readFileSync(join(STANDARD, "LiberationSans-Regular.ttf")) }];
/** A 1×1 PNG, for each image the example names. */
const PNG = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
const images = { [launch.example.screenshot.src]: PNG, [launch.example.artwork.src]: PNG };
const Launch = launch as unknown as React.FC<Record<string, unknown>>;

it("draws a template design in its format, the same bytes as the design it builds", async () => {
  const fromDesign = await renderImage(<Launch format="landscape" {...launch.example} />, { fonts, images });
  const built = await renderImage(launch.design(launch.example, { format: "landscape" }), { fonts, images });
  expect([fromDesign.width, fromDesign.height]).toEqual([1200, 675]);
  expect(Buffer.from(fromDesign.image).equals(Buffer.from(built.image))).toBe(true);
});

it("rejects a design the template refuses, with the template's problems, and one with no format named", async () => {
  await expect(renderImage(<Launch format="square" {...launch.example} features={["one"]} />, { fonts, images })).rejects.toMatchObject({
    diagnostics: expect.arrayContaining([expect.objectContaining({ code: "template/count", path: "values.features" })]),
  });
  await expect(renderImage(<Launch {...launch.example} />, { fonts, images })).rejects.toMatchObject({
    diagnostics: expect.arrayContaining([expect.objectContaining({ code: "template/format" })]),
  });
});
