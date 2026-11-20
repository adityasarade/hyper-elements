/**
 * An Email's Svg through render(): the SVG file every client but classic Outlook gets, and classic Outlook's PNG of it
 * drawn by pngRasterizer() (resvg alone: shapes, no fonts). What core writes is in core's email tests; this is the
 * drawing and what render() returns.
 */
import { Circle, ElementsError, Email, Rect, Section, Svg, Text, render } from "@hyper-elements/react";
import { pngRasterizer } from "../../src/image";

/** A PNG's size, from its IHDR chunk. */
const pngSize = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(Array.from(bytes.slice(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return [view.getUint32(16), view.getUint32(20)];
};

/** A PNG's pixel at x, y: RGBA, decoded with zlib (8-bit RGBA, no interlace: what resvg writes). */
async function pixel(bytes: Uint8Array, x: number, y: number): Promise<number[]> {
  const { inflateSync } = await import("node:zlib");
  const [width] = pngSize(bytes);
  const chunks: Uint8Array[] = [];
  for (let at = 8; at < bytes.length; ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + at);
    const length = view.getUint32(0);
    const type = String.fromCharCode(...bytes.slice(at + 4, at + 8));
    if (type === "IDAT") chunks.push(bytes.slice(at + 8, at + 8 + length));
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width! * 4 + 1;
  // Undo each row's filter up to the row asked for.
  const rows: Uint8Array[] = [];
  for (let row = 0; row <= y; row++) {
    const filter = raw[row * stride]!;
    const line = Uint8Array.from(raw.subarray(row * stride + 1, (row + 1) * stride));
    const above = rows[row - 1] ?? new Uint8Array(line.length);
    for (let i = 0; i < line.length; i++) {
      const left = i >= 4 ? line[i - 4]! : 0;
      const up = above[i]!;
      const upLeft = i >= 4 ? above[i - 4]! : 0;
      const p = left + up - upLeft;
      const paeth = Math.abs(p - left) <= Math.abs(p - up) && Math.abs(p - left) <= Math.abs(p - upLeft) ? left : Math.abs(p - up) <= Math.abs(p - upLeft) ? up : upLeft;
      line[i] = (line[i]! + [0, left, up, (left + up) >> 1, paeth][filter]!) & 0xff;
    }
    rows.push(line);
  }
  return Array.from(rows[y]!.slice(x * 4, x * 4 + 4));
}

const moon = (
  <Email>
    <Section>
      <Text>Tonight</Text>
      <Svg width={120} height={60} title="The moon over the sea">
        <Rect width={120} height={60} style={{ fill: "#1e1b4b" }} />
        <Circle cx={90} cy={30} r={14} style={{ fill: "#fde68a" }} />
      </Svg>
    </Section>
  </Email>
);

describe("an Email's Svg through render()", () => {
  it("returns its SVG file and classic Outlook's PNG of it, at twice its size, linked by the HTML", async () => {
    const { html, files } = await render(moon, { assets: { baseUrl: "https://cdn.example.com/email/", rasterize: pngRasterizer() } });
    const [svg, png] = files!;
    expect([svg!.contentType, png!.contentType]).toEqual(["image/svg+xml", "image/png"]);
    expect(png!.name).toBe(svg!.name.replace(/\.svg$/, "-2x.png"));
    expect(html).toContain(`src="https://cdn.example.com/email/${svg!.name}"`);
    expect(html).toContain(`<!--[if mso]><img src="https://cdn.example.com/email/${png!.name}"`);
    expect([png!.width, png!.height]).toEqual([120, 60]);
    expect(pngSize(png!.bytes)).toEqual([240, 120]);
    // It's the drawing: the sky at its top left, the moon at its center (cx 90, cy 30 at 2x).
    expect(await pixel(png!.bytes, 2, 2)).toEqual([0x1e, 0x1b, 0x4b, 255]);
    expect(await pixel(png!.bytes, 180, 60)).toEqual([0xfd, 0xe6, 0x8a, 255]);
  });

  it("draws the same PNG bytes every time, and another file at another scale", async () => {
    const one = await render(moon, { assets: { baseUrl: "https://cdn.example.com/email/", rasterize: pngRasterizer() } });
    const two = await render(moon, { assets: { baseUrl: "https://cdn.example.com/email/", rasterize: pngRasterizer() } });
    expect(Buffer.from(two.files![1]!.bytes).equals(Buffer.from(one.files![1]!.bytes))).toBe(true);
    const three = await render(moon, { assets: { baseUrl: "https://cdn.example.com/email/", rasterize: pngRasterizer({ scale: 3 }) } });
    expect(three.files![1]!.name).toBe(one.files![0]!.name.replace(/\.svg$/, "-3x.png"));
    expect(pngSize(three.files![1]!.bytes)).toEqual([360, 180]);
    expect(() => pngRasterizer({ scale: 1.5 })).toThrow("pngRasterizer({ scale }) takes a whole number from 1 to 4");
  });

  it("rejects an Email with an Svg and no assets, saying how to pass them", async () => {
    const error = await render(moon).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ElementsError);
    expect((error as ElementsError).diagnostics.map((d) => [d.code, d.path])).toEqual([["email/svg-assets", "root.children[0].children[1]"]]);
    expect((error as ElementsError).diagnostics[0]!.fix).toContain("pngRasterizer from @hyper-elements/react/image");
  });

  it("returns no files for an Email without an Svg, and nothing it didn't before", async () => {
    const plain = await render(
      <Email>
        <Text>Hi</Text>
      </Email>,
      { assets: { baseUrl: "https://cdn.example.com/email/", rasterize: pngRasterizer() } }
    );
    expect(Object.keys(plain).sort()).toEqual(["body", "bodyStyle", "diagnostics", "head", "html", "text"]);
  });
});
