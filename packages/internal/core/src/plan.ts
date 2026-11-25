/**
 * A Document's pages as planned, as plain data that names no engine and no output:
 *
 * - Measured: what's measured of each block at its width (its box, and a block of text's lines with the characters
 *   each holds), in points. Made from an engine's layout (src/pdf/measure.ts) or by a measurer that doesn't draw.
 * - Plan: which part of which block goes on which page, each part of a block of text with its lines as measured
 *   (src/pdf/flow.ts makes it). The PDF writer paints a Plan, and so does the print HTML (`render(design, { plan })`):
 *   the same pages, each split text's lines as they were measured.
 */

/** A line of a block of text: its characters in the block's text, and where it is (from its page's top), in points. */
export interface MeasuredLine {
  /** Its first character, and the character after its last; `next`, where the next line starts (after a line break that ends this one). */
  start: number;
  end: number;
  next: number;
  /** It ends in a word broken by a hyphen. */
  hyphenated: boolean;
  top: number;
  height: number;
  /** Room added to each space between its words, in points: less where its engine squeezed it into its box, more where it justified it. */
  wordSpacing: number;
}

/** A block of the design, measured at its width: its box from its page's top left, in points. */
export interface MeasuredBlock {
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** A block of text's lines, where they match its text (a transform that changes its length leaves them out). */
  lines?: MeasuredLine[];
}

/** A page's blocks, measured, and the room its content has: below its header, above its footer. */
export interface MeasuredPage {
  room: { top: number; bottom: number };
  blocks: MeasuredBlock[];
}

/** A line of a block of text on a page, as measured: its characters in the block's text, its height, and its spacing. */
export interface PlannedLine {
  start: number;
  end: number;
  /** It ends in a word broken by a hyphen, which is drawn after it. */
  hyphenated: boolean;
  /** Room added to each space between its words, in points (less where it was squeezed into its box, more where justified). */
  wordSpacing: number;
  height: number;
}

/** A part of a block on a page: the whole block, or what of it fits there. */
export interface PlannedPart {
  path: string;
  /** Which part of its block, from 0: a block on one page is part 0. */
  part: number;
  /** Whether it has its block's top edge (its first part) and its bottom edge (its last). */
  first: boolean;
  last: boolean;
  /** A block of text's lines on this page, each as it was measured: drawn line by line, they can't break otherwise. */
  lines?: PlannedLine[];
  /** A stack's blocks (or a table's rows) on this page, each a part. */
  children?: PlannedPart[];
}

/** A page as planned: the page as written it goes on from (its paper, margins, background), and the parts on it. */
export interface PlannedPage {
  from: number;
  parts: PlannedPart[];
}

export interface Plan {
  pages: PlannedPage[];
}

/** A part that's its block whole, as written. */
export const isWhole = (part: PlannedPart) => part.first && part.last && !part.lines && !part.children;
