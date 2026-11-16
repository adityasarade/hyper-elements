/**
 * Images, by arithmetic and by their bytes: the size that keeps an image's aspect inside a box (`fitInside()`), and
 * an image file's size, type and transparency read from its header (`sniffImage()`), in plain JavaScript with no Node
 * API, so it runs wherever a template does.
 */
import type { ImageType } from "./fields";

/**
 * The size an image is shown at to fit whole inside `box`, at its own aspect: for a `contain` image's `style`, so a
 * template doesn't do the arithmetic (and its check finds it neither cropped nor distorted).
 */
export function fitInside(image: { width: number; height: number }, box: { width: number; height: number }): { width: number; height: number } {
  if (!(image.width > 0 && image.height > 0 && box.width > 0 && box.height > 0)) {
    throw new TypeError("[Elements] fitInside() takes an image's { width, height } and a box's, each above 0");
  }
  const scale = Math.min(box.width / image.width, box.height / image.height);
  // Down to a hundredth of a px, so the size never passes the box.
  const floor = (n: number) => Math.floor(n * 100 + 1e-6) / 100;
  return { width: floor(image.width * scale), height: floor(image.height * scale) };
}

/** What an image file's header says: its size in px, its type, and whether it can be transparent. */
export interface SniffedImage {
  width: number;
  height: number;
  type: ImageType;
  /** It has an alpha channel or a transparent color (an SVG is always taken as able to be transparent). */
  alpha: boolean;
}

const ascii = (bytes: Uint8Array, at: number, length: number) => String.fromCharCode(...bytes.subarray(at, at + length));
const u32 = (bytes: Uint8Array, at: number) => ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
const u16 = (bytes: Uint8Array, at: number) => (bytes[at] << 8) | bytes[at + 1];
const u16le = (bytes: Uint8Array, at: number) => bytes[at] | (bytes[at + 1] << 8);

/** A PNG, JPEG, GIF or SVG file's size, type and transparency, from its header; undefined for anything else. */
export function sniffImage(input: Uint8Array | ArrayBuffer): SniffedImage | undefined {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  return png(bytes) ?? jpeg(bytes) ?? gif(bytes) ?? svg(bytes);
}

function png(bytes: Uint8Array): SniffedImage | undefined {
  if (bytes.length < 33 || ascii(bytes, 1, 3) !== "PNG" || bytes[0] !== 0x89 || ascii(bytes, 12, 4) !== "IHDR") return undefined;
  const colorType = bytes[25];
  // An alpha channel (grey or color with alpha), or a transparent color (a tRNS chunk before the image data).
  let alpha = colorType === 4 || colorType === 6;
  for (let at = 8; !alpha && at + 8 <= bytes.length; ) {
    const length = u32(bytes, at);
    const type = ascii(bytes, at + 4, 4);
    if (type === "tRNS") alpha = true;
    if (type === "IDAT" || type === "IEND") break;
    at += 12 + length;
  }
  return { width: u32(bytes, 16), height: u32(bytes, 20), type: "png", alpha };
}

function jpeg(bytes: Uint8Array): SniffedImage | undefined {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  for (let at = 2; at + 9 < bytes.length; ) {
    if (bytes[at] !== 0xff) return undefined;
    const marker = bytes[at + 1];
    // Fill bytes, and markers with no length (restart markers, TEM).
    if (marker === 0xff) {
      at++;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    // A frame's start (baseline, progressive, …; not DHT, JPG or DAC): its height, then its width.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: u16(bytes, at + 7), height: u16(bytes, at + 5), type: "jpeg", alpha: false };
    }
    at += 2 + u16(bytes, at + 2);
  }
  return undefined;
}

function gif(bytes: Uint8Array): SniffedImage | undefined {
  const signature = ascii(bytes, 0, 6);
  if (bytes.length < 13 || (signature !== "GIF87a" && signature !== "GIF89a")) return undefined;
  // A transparent color: a graphic control extension (0x21 0xF9) with its transparency flag set.
  let alpha = false;
  for (let at = 13; at + 3 < bytes.length && !alpha; at++) if (bytes[at] === 0x21 && bytes[at + 1] === 0xf9 && bytes[at + 2] === 0x04) alpha = (bytes[at + 3] & 1) === 1;
  return { width: u16le(bytes, 6), height: u16le(bytes, 8), type: "gif", alpha };
}

function svg(bytes: Uint8Array): SniffedImage | undefined {
  const head = new TextDecoder().decode(bytes.subarray(0, 4096));
  const tag = /<svg\b[^>]*>/i.exec(head)?.[0];
  if (!tag) return undefined;
  const attribute = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1];
  const px = (value: string | undefined) => {
    const match = value === undefined ? null : /^\s*(\d+(?:\.\d+)?)\s*(px)?\s*$/.exec(value);
    return match ? Number(match[1]) : undefined;
  };
  const box = attribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
  const fromBox = box && box.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0 ? { width: box[2], height: box[3] } : undefined;
  const [givenWidth, givenHeight] = [px(attribute("width")), px(attribute("height"))];
  // One side given: the other at the viewBox's aspect.
  const width = givenWidth ?? (givenHeight !== undefined && fromBox ? (givenHeight * fromBox.width) / fromBox.height : fromBox?.width);
  const height = givenHeight ?? (givenWidth !== undefined && fromBox ? (givenWidth * fromBox.height) / fromBox.width : fromBox?.height);
  if (width === undefined || height === undefined) return undefined;
  return { width, height, type: "svg", alpha: true };
}

// ─── checkLayout(): its types (Phase 2 measures) ────────────────────────────

/** What `checkLayout()` takes beside a template and its values: a layout measured by `layoutImage()` (Phase 2). */
export interface CheckLayoutOptions {
  format?: string;
  /** Pixels per px, as it's rendered: the format's, or the caller's. */
  scale?: number;
  /** `layoutImage()`'s result for the format's snapshot. */
  layout: unknown;
  /** Each image field's file, sniffed (`sniffImage()`), by its field path. */
  files?: Record<string, SniffedImage>;
  /** `check()`'s result, whose measured rules this decides. */
  checked?: { rules: ReadonlyArray<{ rule: string; source: string; format?: string; status: string }> };
}

/** What `checkLayout()` returns: each region's box and pixels, the fitted text, the rules complete, and what it found. */
export interface LayoutCheck {
  regions: Record<string, Record<string, { box: [number, number]; pixels: [number, number] }>>;
  fits: unknown[];
  rules: Array<{ rule: string; source: "lint" | "core" | "template"; format?: string; status: "passed" | "failed" | "not-run"; diagnostics: unknown[] }>;
  diagnostics: unknown[];
}
