/**
 * The files an email links to that the render writes itself: an Svg's drawing. Email clients drop inline `<svg>`
 * (Gmail, Outlook, Yahoo) and `data:` images (every Gmail), so an Svg is an image file, hosted where `assets.baseUrl`
 * says, which `render()` returns in `files` for the caller to upload. Classic Outlook shows a hosted SVG as a broken
 * image (Outlook 2019 in the real client, November 2026; 2024 shows it), so classic Outlook gets a PNG of it instead,
 * drawn by `assets.rasterize` (`pngRasterizer()` from `@hyper-elements/react/image`): passed in, so nothing core
 * imports draws.
 *
 * Both files are named by the SHA-256 of the SVG's text, never by a file's bytes (another build of resvg may write
 * other PNG bytes): the same Svg is the same HTML everywhere, and a name always means one drawing.
 */
import type { Diagnostic } from "../../diagnostics";
import type { ResolvedNode } from "../../resolve";
import { utf8Encode } from "../shared/bytes";
import { sha256Hex } from "../shared/sha256";
import { svgFile, svgFrame } from "../shared/svg";

/** An Svg's drawing, for a rasterizer: its SVG text and its size in px. */
export interface SvgDrawing {
  svg: string;
  width: number;
  height: number;
}

/**
 * Draws an Svg as another image file for classic Outlook. `suffix` and `extension` name the file
 * (`<hash>-<suffix>.<extension>`), so drawing at another scale is another file.
 */
export interface Rasterizer {
  suffix: string;
  extension: "png" | "jpg" | "gif";
  contentType: string;
  draw(drawing: SvgDrawing): Promise<Uint8Array> | Uint8Array;
}

/** `render()`'s `assets`: where the files it writes are hosted, and how classic Outlook's are drawn. */
export interface EmailAssetsOption {
  /** The URL the files go under (`https://cdn.example.com/email/`): each image links to it and the file's name. */
  baseUrl: string;
  /**
   * Draws each Svg as a PNG for classic Outlook, which shows a hosted SVG as a broken image: `pngRasterizer()` from
   * `@hyper-elements/react/image`. `false` leaves it out: classic Outlook's readers then see a broken image.
   */
  rasterize: Rasterizer | false;
}

/** A file `render()` wrote for the email to link to: upload it to `assets.baseUrl` before sending. */
export interface RenderedFile {
  /** Its name under `assets.baseUrl`. */
  name: string;
  contentType: string;
  bytes: Uint8Array;
  /** The size it's shown at, in px. */
  width: number;
  height: number;
}

/** An Svg as the email writes it: its file, and the name of classic Outlook's (drawn after writing). */
export interface EmailAsset {
  svg: RenderedFile;
  drawing: SvgDrawing;
  /** Classic Outlook's file's name, where it has one. */
  raster?: string;
}

const RASTER_EXTENSIONS = new Set(["png", "jpg", "gif"]);

const optionError = (message: string): Diagnostic => ({ code: "render/assets", severity: "error", message, path: "root", fix: "render(email, { assets: { baseUrl: \"https://cdn.example.com/email/\", rasterize: pngRasterizer() } }), with pngRasterizer from @hyper-elements/react/image" });

/**
 * A URL the files can go under: http or https, a host (names or an IPv4 address) and a port that is one, then a path
 * with no query or fragment, which the files' names follow (`?v=2` would put the name in the query, and every image
 * would ask for the same file).
 */
const BASE_URL = /^https?:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*(?::(\d{1,5}))?(?:\/[^\s"'<>?#\\]*)?$/i;
const goodBase = (url: string) => {
  const found = BASE_URL.exec(url);
  return !!found && (found[1] === undefined || Number(found[1]) <= 65535);
};

/** What's wrong with `assets` as given: nothing for a well-formed option. */
export function checkAssetsOption(assets: unknown): Diagnostic[] {
  if (assets === undefined) return [];
  if (!assets || typeof assets !== "object" || Array.isArray(assets)) return [optionError(`assets takes { baseUrl, rasterize }, not ${JSON.stringify(assets) ?? typeof assets}`)];
  const { baseUrl, rasterize } = assets as Record<string, unknown>;
  const out: Diagnostic[] = [];
  if (typeof baseUrl !== "string" || !goodBase(baseUrl)) {
    out.push(optionError(`assets.baseUrl is the folder the files are hosted in, an http or https URL with no query or fragment, which each file's name follows: not ${JSON.stringify(baseUrl) ?? typeof baseUrl}`));
  }
  if (rasterize !== false) {
    const r = rasterize as Partial<Rasterizer> | undefined;
    if (!r || typeof r !== "object" || typeof r.draw !== "function" || typeof r.suffix !== "string" || !/^[a-z0-9]+$/i.test(r.suffix) || !RASTER_EXTENSIONS.has(String(r.extension)) || typeof r.contentType !== "string") {
      out.push(optionError("assets.rasterize draws classic Outlook's PNG of each Svg: pngRasterizer() from @hyper-elements/react/image, or false to leave it out"));
    }
  }
  return out;
}

/** Whether an Svg is drawn at all: one of no width or no height draws nothing, in a file or not. */
export const drawsSomething = (node: ResolvedNode) => {
  const { width, height } = svgFrame(node);
  return width > 0 && height > 0;
};

/**
 * Every Svg of an email that draws something, shown or hidden: each is a file the email may link to. One hidden on
 * phones and on desktops isn't written, but has its files all the same, so a design made from the email (the
 * builder's, where it can be shown again) links to files render() returned.
 */
export function svgsIn(root: ResolvedNode): ResolvedNode[] {
  const out: ResolvedNode[] = [];
  const visit = (node: ResolvedNode) => {
    if (node.type === "Svg" && drawsSomething(node)) out.push(node);
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return out;
}

/** The files' base, ending in one slash. */
const base = (baseUrl: string) => (baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

/** An Svg's files and where the email links to them. */
export function emailAsset(node: ResolvedNode, assets: EmailAssetsOption): EmailAsset & { svgUrl: string; rasterUrl?: string } {
  const svg = svgFile(node);
  const { width, height } = svgFrame(node);
  const bytes = utf8Encode(svg);
  // 128 bits of the hash: one name per drawing, short enough to read.
  const hash = sha256Hex(bytes).slice(0, 32);
  const name = `${hash}.svg`;
  const raster = assets.rasterize ? `${hash}-${assets.rasterize.suffix}.${assets.rasterize.extension}` : undefined;
  return {
    svg: { name, contentType: "image/svg+xml", bytes, width, height },
    drawing: { svg, width, height },
    ...(raster ? { raster } : {}),
    svgUrl: base(assets.baseUrl) + name,
    ...(raster ? { rasterUrl: base(assets.baseUrl) + raster } : {}),
  };
}

// ─── The render's files ────────────────────────────────────────────────────

const collecting: Array<Map<string, EmailAsset>> = [];

/** Writes markup with `found` as where its Svgs' files go (one per drawing). */
export function withEmailAssets<T>(found: Map<string, EmailAsset>, write: () => T): T {
  collecting.push(found);
  try {
    return write();
  } finally {
    collecting.pop();
  }
}

export function addEmailAsset(asset: EmailAsset): void {
  const found = collecting[collecting.length - 1];
  if (found && !found.has(asset.svg.name)) found.set(asset.svg.name, { svg: asset.svg, drawing: asset.drawing, ...(asset.raster ? { raster: asset.raster } : {}) });
}

/**
 * The files of the Svgs an email links to: each SVG as written, and each classic Outlook file drawn by `rasterize`.
 * Async only for the drawing; the names were decided when the email was written.
 */
export async function drawEmailFiles(found: readonly EmailAsset[], rasterize: Rasterizer | false): Promise<RenderedFile[]> {
  const files: RenderedFile[] = [];
  for (const asset of found) {
    files.push(asset.svg);
    if (!asset.raster || !rasterize) continue;
    const bytes = await rasterize.draw(asset.drawing);
    if (!(bytes instanceof Uint8Array) || bytes.length === 0) throw new TypeError(`[Elements] assets.rasterize.draw() returned no image for ${asset.svg.name}: it returns the file's bytes as a Uint8Array`);
    files.push({ name: asset.raster, contentType: rasterize.contentType, bytes, width: asset.drawing.width, height: asset.drawing.height });
  }
  return files;
}
