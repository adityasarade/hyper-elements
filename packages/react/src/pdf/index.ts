/**
 * PDF output for Elements: a `<Document>` written as a PDF on the server, without a browser or the network. Its
 * pages, header and footer and page numbers are the print HTML's, laid out at the same widths. The writer builds the
 * pages as plain data (the core's src/pdf/model.ts); an engine's adapter draws them (react-pdf's, react-pdf.tsx beside
 * it, the only file that imports one), so the engine can change without the writer changing.
 *
 *   const { pdf } = await renderPdf(<Invoice />, { fonts: [{ family: "Inter", src: interRegular }] });
 *
 * Nothing is fetched: an image is a data: URI, or its bytes are given in `images` by its URL; a web font's file is
 * given in `fonts`. A template that needs one it isn't given is an error (an image) or drawn in a standard PDF font (a
 * font), and says so. templateAssets() lists the fonts and images a template names, for a tool that loads them.
 */
import { assetParts, base64, createLayout, flowDocument, LAYOUT_VERSION, pdfFamily, reactPdf, reactPdfLayout, thumbnailOf, writeDocument, type Asset, type Font, type Layout, type PlacedPage } from "@hyper-elements/core/pdf";
import type { FontFace, Plan } from "@hyper-elements/core";
import { ElementsError, prepare, type Diagnostic, type ResolvedNode, type Snapshot } from "@hyper-elements/react";
import type { ReactElement } from "react";
import { documentLayout, measuredOverflow, type DocumentLayout } from "./layout";
import { overflows } from "./flow";
import { nodeTexts } from "./lines";

export type { DocumentLayout, DocumentLine, DocumentNode, DocumentPage, DocumentRun } from "./layout";
export { caretAt, caretBox, selectionBoxes, type Caret, type CaretBox, type CaretOptions, type PagePoint, type SelectionBox } from "./caret";
export type { Plan, PlannedLine, PlannedPage, PlannedPart } from "@hyper-elements/core";

export interface PdfFont {
  /** The family a template names in its fontFamily stacks ("Inter"). */
  family: string;
  /** The font file (TTF, OTF or WOFF; not WOFF2). */
  src: Uint8Array | ArrayBuffer;
  weight?: number;
  style?: "normal" | "italic";
}

export interface PdfOptions {
  /** Font files, by the family the template names: PDF output loads none itself. */
  fonts?: PdfFont[];
  /** Image files (PNG or JPEG; an SVG's alt text is shown instead), by the URL the template gives: PDF output loads none itself. */
  images?: Record<string, Uint8Array | ArrayBuffer>;
  /** When the PDF says it was made (a fixed date by default, so a template makes the same file every time). */
  date?: Date;
}

export interface PdfResult {
  /** The PDF file. */
  pdf: Uint8Array;
  /** Warnings and notes (errors are thrown). */
  diagnostics: Diagnostic[];
  /** Its pages as planned: give it to `render(design, { plan })` for print HTML with the same pages. */
  plan: Plan;
}

export interface PaginateResult {
  /** The Document's pages as planned: what goes on each, what doesn't fit one gone on to the next. */
  plan: Plan;
  /** renderPdf()'s diagnostics: what can't go on to another page and is cut off, measured. */
  diagnostics: Diagnostic[];
  /** With a paginator's `layout: true`: where everything landed on its pages, as layoutDocument() says, each text node with its lines. */
  layout?: DocumentLayout;
}

/** The date a PDF says it was made by default: fixed, so the same template makes the same bytes. */
const FIXED_DATE = new Date(Date.UTC(2026, 0, 1));

/** A Document written as a PDF. Rejects with an `ElementsError` listing the problems if it has errors. */
export async function renderPdf(element: ReactElement | Snapshot, options: PdfOptions = {}): Promise<PdfResult> {
  const { pdf, diagnostics, plan } = await draw(element, options);
  return { pdf, diagnostics, plan };
}

/**
 * A Document's pages as planned, measured with its fonts as its PDF lays them out, without drawing it: for print HTML
 * with the same pages as its PDF, `render(design, { plan })`. Takes renderPdf()'s options. Rejects as renderPdf() does.
 */
export async function paginate(element: ReactElement | Snapshot, options: PdfOptions = {}): Promise<PaginateResult> {
  const setup = setupOf(options);
  const layout = await createLayout(setup.fonts);
  const paginated = layout && paginateWith(layout, setup, element, true);
  if (paginated) return paginated;
  // Where it can't be measured without drawing it: drawn.
  const planned = await planDocument(element, options, false);
  // Where what's on each planned page landed, without drawing it (or, where it can't be measured so, drawn).
  const placed = planned.drawn && planned.pages === planned.written ? planned.drawn.placed : ((await reactPdfLayout(planned.pages)) ?? (await reactPdf(planned.pages)).placed);
  return { plan: planned.plan, diagnostics: said(planned, placed) };
}

export interface PaginatorOptions extends PdfOptions {
  /** How many blocks of text it keeps laid out, so it lays out again only those that change: 10,000 by default. */
  cacheSize?: number;
}

export interface PaginateOptions {
  /**
   * false: the plan only, without renderPdf()'s diagnostics, whose measuring takes as long again (`diagnostics` is
   * empty, and a template with errors still throws). For pages kept up to date as a Document is edited. true by default.
   */
  diagnostics?: boolean;
  /**
   * true: with its `layout` too, where everything landed on its pages (layoutDocument()'s), each text node with its text
   * and its lines (`lineBoxes`): where each is drawn, and where a caret goes between its characters. For caretAt(),
   * caretBox() and selectionBoxes().
   */
  layout?: boolean;
}

/** Documents paginated with the same fonts and images, made ready once: createPaginator() makes one. */
export interface Paginator {
  /**
   * A Document's pages as planned, as paginate() plans them, at once: what it laid out before (a block of text with
   * the same text, styles and width) isn't laid out again. Throws as renderPdf() rejects.
   */
  paginate(element: ReactElement | Snapshot, options?: PaginateOptions): PaginateResult;
}

/**
 * A paginator for Documents drawn with these fonts and images, in Node, a browser or a Worker: their fonts loaded and
 * read once, and each block of text laid out once until it changes. For a page view kept up to date as a Document is
 * edited, each keystroke paginated again. Takes renderPdf()'s options. Rejects where @react-pdf/textkit can't be
 * loaded: install it.
 */
export async function createPaginator(options: PaginatorOptions = {}): Promise<Paginator> {
  const setup = setupOf(options);
  const layout = await createLayout(setup.fonts, options.cacheSize);
  if (!layout) {
    throw new ElementsError([{ code: "pdf/textkit", severity: "error", message: "createPaginator() lays text out with @react-pdf/textkit, which can't be loaded: install it", path: "root" }]);
  }
  return {
    paginate(element, { diagnostics = true, layout: laidOut = false } = {}) {
      const paginated = paginateWith(layout, setup, element, diagnostics, laidOut);
      if (paginated) return paginated;
      throw new ElementsError([{ code: "pdf/measure", severity: "error", message: "This Document holds a block that can't be measured without drawing it: paginate() it", path: "root" }]);
    },
  };
}

/** What a Document is paginated with: the options' fonts and images, read once. */
interface Setup {
  given: PdfFont[];
  fonts: Font[];
  /** What's said of the fonts given, whatever the Document. */
  notes: Diagnostic[];
  images: Record<string, Uint8Array | ArrayBuffer>;
  date: Date;
}

const setupOf = (options: PdfOptions): Setup => {
  const notes: Diagnostic[] = [];
  const given = options.fonts ?? [];
  return { given, fonts: drawnFonts(given, notes), notes, images: options.images ?? {}, date: options.date ?? FIXED_DATE };
};

/**
 * A Document paginated by a Layout: undefined where it can't measure it so. `check`: with renderPdf()'s diagnostics;
 * `lines`: with its layout, each text node's lines in it.
 */
function paginateWith(layout: Layout, setup: Setup, element: ReactElement | Snapshot, check: boolean, lines = false): PaginateResult | undefined {
  const document = written(element, setup, check);
  const laid = layout.measure(document.written);
  if (!laid) return undefined;
  const { plan, pages } = planned(document, laid);
  if (!check && !lines) return { plan, diagnostics: [] };
  // Its pages as they're drawn, measured: what's cut off, and where everything landed.
  const placed = pages === document.written ? laid : layout.measure(pages);
  const diagnostics = check ? said({ ...document, pages }, placed) : [];
  if (!lines || !placed) return { plan, diagnostics };
  return { plan, diagnostics, layout: documentLayout(document.root, pages.pages, placed, diagnostics, plan, nodeTexts(document.written)) };
}

/**
 * A Document as its PDF lays it out, measured with its fonts: its pages, where each block landed on each, and what's
 * past a page's room (cut off). Takes renderPdf()'s options, and draws the PDF to measure it. Rejects as renderPdf()
 * does.
 */
export async function layoutDocument(element: ReactElement | Snapshot, options: PdfOptions = {}): Promise<DocumentLayout> {
  const { root, pages, placed, plan, diagnostics } = await draw(element, options);
  if (!placed) {
    throw new ElementsError([...diagnostics, { code: "pdf/layout", severity: "error", message: "The installed @react-pdf/renderer doesn't say where it laid the PDF out: update it", path: "root" }]);
  }
  return documentLayout(root, pages.pages, placed, diagnostics, plan);
}

/**
 * A Document written as pages, measured, and planned: where its content doesn't fit a page, flowed onto the pages after
 * it. `drawing`: measured by drawing it (`drawn`, the PDF of the pages as written, which is the PDF where they fit: most
 * Documents are drawn once); else measured without drawing it (react-pdf-measure.ts), or drawn where it can't be.
 */
async function planDocument(element: ReactElement | Snapshot, options: PdfOptions, drawing: boolean) {
  const document = written(element, setupOf(options), true);
  const measured = drawing ? undefined : await reactPdfLayout(document.written);
  const drawn = measured ? undefined : await reactPdf(document.written);
  return { ...document, ...planned(document, measured ?? drawn?.placed), drawn };
}

/**
 * A Document written as pages, with what's said of it so far: prepare()'s diagnostics (`diagnostics`) and its files'
 * and fonts' (`found`; `check`, all of them, else the errors only). A template with errors throws.
 */
function written(element: ReactElement | Snapshot, setup: Setup, check: boolean) {
  const { root, diagnostics } = documentOf(element);
  const found: Diagnostic[] = [...setup.notes, ...notGiven(root, setup.given)];
  const images = imageSources(root, setup.images, found);
  if (found.some((d) => d.severity === "error")) throw new ElementsError([...diagnostics, ...found]);
  const { fonts } = setup;
  const families = new Set(fonts.map((font) => font.family));
  if (check) found.push(...missingFaces(root, fonts, setup.given), ...beyondStandard(root, families));
  const context = { families, fonts, image: (src: string) => images.get(src), date: setup.date };
  return { root, context, written: writeDocument(root, context), diagnostics, found };
}

/** A Document's pages planned from where they were laid out (`laid`): as written where they fit. */
function planned(document: ReturnType<typeof written>, laid: PlacedPage[] | undefined) {
  const { root, context, written } = document;
  // A Document that fits: each page as written, each block whole on it.
  let plan: Plan = { pages: written.pages.map((page, from) => ({ from, parts: page.content.map((block) => ({ path: block.path!, part: 0, first: true, last: true })) })) };
  let pages = written;
  // Content that doesn't fit its page goes on to the next, planned from where it was laid out, a split text's lines as
  // they were laid out (paint.ts).
  if (laid && overflows(written.pages, laid)) {
    const flowed = flowDocument(root, context, written, laid);
    pages = flowed.document;
    plan = flowed.plan;
  }
  return { pages, plan };
}

/** The diagnostics: prepare()'s, a page's content past its room measured (where it can be), and the files' and fonts'. */
function said(planned: { root: ResolvedNode; pages: ReturnType<typeof written>["written"]; diagnostics: Diagnostic[]; found: Diagnostic[] }, placed: PlacedPage[] | undefined): Diagnostic[] {
  const { root, pages, diagnostics, found } = planned;
  const overflow = placed ? [...diagnostics.filter((d) => d.code !== "document/overflow"), ...measuredOverflow(root, pages.pages, placed)] : diagnostics;
  return [...overflow, ...found];
}

/** The PDF: drawn once where its pages fit, and again, flowed, where they don't. */
async function draw(element: ReactElement | Snapshot, options: PdfOptions) {
  const planned = await planDocument(element, options, true);
  const { pdf, placed } = planned.drawn && planned.pages === planned.written ? planned.drawn : await reactPdf(planned.pages);
  return { root: planned.root, pages: planned.pages, placed, plan: planned.plan, pdf, diagnostics: said(planned, placed) };
}

export interface TemplateAssets {
  /** The Document's own font faces (its `fonts` prop), as it gives them: a file for each goes in renderPdf's `fonts`, by its family, weight and style. */
  fonts: FontFace[];
  /** Each image's URL as the template gives it (an Image's `src`, a Video's thumbnail), once, in the order they're drawn: its file goes in renderPdf's `images`, by that URL. */
  images: string[];
}

/**
 * The font and image sources renderPdf() looks for in a Document, from the walks it makes itself: what a tool loads and
 * gives it in `fonts` and `images`. An image's data: URI is drawn as it is; a font's is a file to give like any other
 * (renderPdf() reads only the font files it's given). Rejects a template as renderPdf() does: with errors, or with a
 * root other than a Document.
 */
export function templateAssets(element: ReactElement | Snapshot): TemplateAssets {
  const { root } = documentOf(element);
  return { fonts: [...facesOf(root)], images: [...new Set(imagesOf(root).map(({ src }) => src))] };
}

/** The Document a template is, with prepare()'s diagnostics; a template with errors, or another root, throws. */
function documentOf(element: ReactElement | Snapshot): { root: ResolvedNode; diagnostics: Diagnostic[] } {
  const { root, diagnostics, layout } = prepare(element);
  readable(layout, "pdf");
  if (!root) throw new ElementsError(diagnostics);
  if (root.type !== "Document") {
    throw new ElementsError([...diagnostics, { code: "pdf/root", severity: "error", message: `PDF output is a Document's: this template is a ${root.type}`, path: "root" }]);
  }
  return { root, diagnostics };
}

/**
 * The tree prepare() gives, read as this entry's copy of the core lays it out: from another copy of Elements that
 * writes another layout version (a second install of the package, or an older one beside it), it's refused rather than
 * drawn wrong.
 */
function readable(layout: unknown, output: "pdf" | "image"): void {
  if (layout === LAYOUT_VERSION) return;
  throw new ElementsError([
    {
      code: `${output}/version`,
      severity: "error",
      message: `@hyper-elements/react/${output} reads layout version ${LAYOUT_VERSION}; the main entry writes ${typeof layout === "number" ? layout : "none"}: update @hyper-elements/react`,
      path: "root",
    },
  ]);
}

// ─── Fonts ─────────────────────────────────────────────────────────────────

/** An image file as base64, made once a file (a server and a paginator give the same file's bytes each time). */
const encoded = new WeakMap<Uint8Array | ArrayBuffer, string>();
function encode(bytes: Uint8Array | ArrayBuffer): string {
  const known = encoded.get(bytes);
  if (known !== undefined) return known;
  const out = base64(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes);
  encoded.set(bytes, out);
  return out;
}

/** A WOFF2 file, by its first bytes: a PDF draws TTF, OTF and WOFF files, not these. */
const woff2 = (bytes: Uint8Array) => String.fromCharCode(...bytes.subarray(0, 4)) === "wOF2";

/** The Document's own font faces (its `fonts` prop): the files renderPdf's fonts option gives. */
const facesOf = (root: ResolvedNode): FontFace[] => (root.props.fonts as FontFace[] | undefined) ?? [];

/** The font files given, by the family the template names (lowercased); a file a PDF can't draw noted. */
function drawnFonts(given: PdfFont[], found: Diagnostic[]): Font[] {
  const files = given.map((font) => ({ font, data: font.src instanceof ArrayBuffer ? new Uint8Array(font.src) : font.src }));
  // react-pdf embeds the glyphs a PDF draws as the file stores them (fontkit unpacks a WOFF's). A WOFF2 stores its
  // outlines transformed (Google Fonts' and most others do), and its letters come out blank, with no error.
  const drawn = files.filter(({ data }) => !woff2(data));
  const families = new Set(drawn.map(({ font }) => font.family.toLowerCase()));
  for (const { font, data } of files) {
    if (!woff2(data)) continue;
    const meanwhile = families.has(font.family.toLowerCase()) ? `${font.family}'s other files` : "a standard PDF font";
    found.push({ code: "pdf/font", severity: "warning", message: `${font.family}'s file is WOFF2: a PDF draws TTF, OTF and WOFF files. Its text is drawn in ${meanwhile} meanwhile`, path: "root.props.fonts" });
  }
  return drawn.map(({ font, data }) => ({ family: font.family.toLowerCase(), data, weight: font.weight ?? 400, style: font.style ?? "normal" }));
}

/** The Document's own font faces whose files aren't given (a family given only as WOFF2 is said by drawnFonts()). */
function notGiven(root: ResolvedNode, given: PdfFont[]): Diagnostic[] {
  const named = new Set(given.map((font) => font.family.toLowerCase()));
  return facesOf(root)
    .filter((face) => !named.has(face.family.toLowerCase()))
    .map((face) => ({
      code: "pdf/font",
      severity: "warning" as const,
      message: `PDF output loads no fonts: give ${face.family}'s file in renderPdf's fonts option. Its text is drawn in a standard PDF font meanwhile`,
      path: "root.props.fonts",
    }));
}

/**
 * Text in a weight or style of a family whose file for it isn't given: drawn in the nearest given (react-pdf finds the
 * nearest weight; the adapter, a style), as an image's is.
 */
function missingFaces(root: ResolvedNode, fonts: Font[], given: PdfFont[]): Diagnostic[] {
  const out = new Map<string, Diagnostic>();
  const families = new Set(fonts.map((font) => font.family));
  const visit = (node: ResolvedNode) => {
    if (node.hidden?.desktop) return;
    const family = pdfFamily(String(node.text.fontFamily), families);
    if (families.has(family) && node.children.some((child) => typeof child === "string" && child.trim())) {
      const faces = fonts.filter((font) => font.family === family);
      const { fontWeight: weight, fontStyle: style } = node.text;
      const key = `${family}|${weight}|${style}`;
      if (!faces.some((face) => face.weight === weight && face.style === style) && !out.has(key)) {
        const name = given.find((font) => font.family.toLowerCase() === family)?.family ?? family;
        const has = faces.map((face) => `${face.weight}${face.style === "italic" ? " italic" : ""}`).join(", ");
        out.set(key, {
          code: "pdf/font-weight",
          severity: "warning",
          message: `Text in ${name} at ${weight}${style === "italic" ? " italic" : ""}, which is given at ${has} only: it's drawn in the nearest. Give that file in renderPdf's fonts option`,
          path: node.path,
          ...(node.id ? { nodeId: node.id } : {}),
        });
      }
    }
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return [...out.values()];
}

/** What a standard PDF font draws, as react-pdf writes its text (Windows-1252): Western European characters. */
const WIN_ANSI = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const drawnInStandard = (char: string) => {
  const code = char.codePointAt(0)!;
  return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI.includes(char) || char === "\n" || char === "\t" || char === "\r";
};

/** Text drawn in a standard PDF font (no file given for its stack) with characters it can't draw: once a font. */
function beyondStandard(root: ResolvedNode, families: ReadonlySet<string>): Diagnostic[] {
  const out = new Map<string, Diagnostic>();
  const visit = (node: ResolvedNode) => {
    if (node.hidden?.desktop) return;
    const family = pdfFamily(String(node.text.fontFamily), families);
    if (!families.has(family) && !out.has(family)) {
      const char = node.children.flatMap((child) => (typeof child === "string" ? [...child] : [])).find((c) => !drawnInStandard(c));
      if (char) {
        out.set(family, {
          code: "pdf/font",
          severity: "warning",
          message: `Text in ${family} has characters a standard PDF font can't draw ("${char}"): it draws Western European characters only, and no font file is given for this text's fontFamily. Give one that has them in renderPdf's fonts option. They come out as other characters meanwhile`,
          path: node.path,
          ...(node.id ? { nodeId: node.id } : {}),
        });
      }
    }
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return [...out.values()];
}

// ─── Images ────────────────────────────────────────────────────────────────

/** What an image file is, from its first bytes: PNG, JPEG or SVG, or undefined. */
function mime(bytes: Uint8Array): string | undefined {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  const head = new TextDecoder().decode(bytes.subarray(0, 256)).trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "image/svg+xml";
  return undefined;
}

/** What react-pdf's Image draws: PNG and JPEG (an SVG, it leaves out without an error). */
const DRAWN = /^data:image\/(png|jpeg|jpg)[;,]/;
const SVG = /^data:image\/svg\+xml[;,]/;

/**
 * Each image's source as the pages hold it, without the network: a data URI. An image without one is an error; an
 * SVG, which a PDF can't draw, a warning (its alt text is shown in its box).
 */
function imageSources(root: ResolvedNode, given: Record<string, Uint8Array | ArrayBuffer>, found: Diagnostic[]): Map<string, string> {
  const out = new Map<string, string>();
  const bytes = (src: string) => (given[src] instanceof ArrayBuffer ? new Uint8Array(given[src] as ArrayBuffer) : (given[src] as Uint8Array | undefined));
  /** The image's data URI, "svg" for an SVG, or undefined where there's none. */
  const resolve = (src: string): string | undefined => {
    if (out.has(src)) return out.get(src);
    if (DRAWN.test(src)) out.set(src, src);
    else if (SVG.test(src)) return "svg";
    else if (given[src]) {
      const type = mime(bytes(src)!);
      if (type === "image/svg+xml") return "svg";
      if (type) out.set(src, `data:${type};base64,${encode(given[src])}`);
    }
    return out.get(src);
  };
  for (const { node, src, thumbnail } of imagesOf(root)) {
    const source = resolve(src);
    if (thumbnail) continue;
    const where = { path: `${node.path}.props.src`, ...(node.id ? { nodeId: node.id } : {}) };
    if (source === "svg") {
      found.push({
        code: "pdf/image",
        severity: "warning",
        message: "A PDF draws PNG and JPEG images, not SVG: give this one as a PNG or JPEG (its file in renderPdf's images option, by its URL, or a data: URI). Its alt text is shown in its box meanwhile",
        ...where,
      });
    } else if (!source) {
      found.push({
        code: "pdf/image",
        severity: "error",
        message: given[src] ? "This image's file isn't a PNG or JPEG, the formats a PDF draws" : "PDF output loads no images: give this one's file in renderPdf's images option (by its URL), or its src as a data: URI",
        ...where,
      });
    }
  }
  return out;
}

/**
 * Each image the pages draw, in order, with the node it's on: an Image's src, and a Video's thumbnail (drawn where its
 * file is given, else the Video's a link with its title). Content hidden on desktop isn't drawn.
 */
function imagesOf(root: ResolvedNode): Array<{ node: ResolvedNode; src: string; thumbnail: boolean }> {
  const out: Array<{ node: ResolvedNode; src: string; thumbnail: boolean }> = [];
  const visit = (node: ResolvedNode) => {
    if (node.hidden?.desktop) return;
    if (node.type === "Image") out.push({ node, src: assetParts(node.props.src as Asset).src, thumbnail: false });
    if (node.type === "Video") {
      const thumbnail = thumbnailOf(node);
      if (thumbnail) out.push({ node, src: thumbnail, thumbnail: true });
    }
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return out;
}
