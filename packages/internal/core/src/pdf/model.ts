/**
 * A Document as pages any PDF engine can draw: what the writer decides (each page's paper, margins, header, content
 * and footer; each block as a box, a block of text, an image, a link or a drawing; its styles), as plain data. No
 * engine is named here: an engine is an adapter that draws these (react-pdf's is `react-pdf.tsx`, the only file
 * that imports one), so the writer doesn't change when the engine does.
 *
 * Styles are CSS's names for flexbox boxes and text (`flexDirection`, `paddingTop`, `borderTopWidth`, `fontSize`),
 * lengths in PDF points. A font family is the template's (lowercased) where its file is given, else a standard PDF
 * font ("Helvetica", "Times-Roman", "Courier").
 */

export type Style = Record<string, string | number | undefined>;

/** A run of text inside a block of text: words, a styled run, a link, an image in the line. */
export type Run = string | { kind: "span"; style: Style; runs: Run[] } | { kind: "link"; href: string; style: Style; runs: Run[] } | Picture;

export interface Picture {
  kind: "image";
  /** The design node it draws (an Image's path), where it's a block of its own. */
  path?: string;
  /** The image's file, as a data URI (nothing is fetched). */
  src: string;
  style: Style;
}

export interface Shape {
  kind: "rect" | "circle" | "ellipse" | "line" | "polygon" | "path";
  /** Its geometry and paint (`x`, `cx`, `points`, `d`, `fill`, `stroke`, …), in its drawing's units. */
  attributes: Record<string, string | number | undefined>;
}

/** A block on a page; `path` is the design node it draws (its path in the laid-out tree), where it draws one. */
export type Block =
  | { kind: "box"; path?: string; style: Style; children: Block[] }
  | { kind: "text"; path?: string; style: Style; runs: Run[] }
  | Picture
  | { kind: "link"; path?: string; href: string; style: Style; children: Block[] }
  | { kind: "drawing"; path?: string; width: number; height: number; viewBox: string; style: Style; shapes: Shape[] };

export interface Page {
  /** The paper, in points. */
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  background: string;
  /** The height inside the margins: what goes past it is cut, never moved onto another page. */
  contentHeight: number;
  header?: Block;
  /** The page's content, one under another with `gap` between. */
  content: Block[];
  gap?: number;
  footer?: Block;
}

export interface Font {
  /** The family as the template names it, lowercased. */
  family: string;
  data: Uint8Array;
  weight: number;
  style: "normal" | "italic";
}

export interface DrawnDocument {
  title?: string;
  lang?: string;
  /** When the PDF says it was made. */
  date: Date;
  /** The font files given, by the families the styles name. */
  fonts: Font[];
  pages: Page[];
}

/** Where an engine drew a block with a `path`, in points from its page's top left corner. */
export interface PlacedBlock {
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** A block of text's lines, each one's top and height (from the page's top), as drawn. */
  lines?: Array<{ top: number; height: number }>;
}

/** Where an engine drew a page's blocks, and the content's room on it: what's past the room's bottom is cut off. */
export interface PlacedPage {
  /** Below the header and above the footer, from the page's top. */
  room: { top: number; bottom: number };
  /** Each block with a `path`, in the order drawn (a block before the blocks inside it). */
  blocks: PlacedBlock[];
}

/** What an engine drew: the PDF file, and where it placed each block, where it can say. */
export interface Drawn {
  pdf: Uint8Array;
  placed?: PlacedPage[];
}

/** An engine that writes a PDF file from a Document's pages. */
export type Engine = (document: DrawnDocument) => Promise<Drawn>;
