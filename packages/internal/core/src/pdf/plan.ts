/**
 * A Document's pages as planned, as plain data that names no engine:
 *
 * - Measured: what's measured of each block at its width (its box, and a block of text's lines with the characters
 *   each holds). Today it's read back from the engine's own layout (measure(), below); a measurer that doesn't draw
 *   can make the same.
 * - Plan: which part of which block goes on which page (flow.ts makes it from Measured). The PDF writer paints a Plan
 *   (paint.ts); the print HTML and an editor can paint the same one.
 */
import type { Block, DrawnDocument, PlacedPage } from "./model";
import { lineEnds, runsText } from "./runs";

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

/** A part of a block on a page: the whole block, or what of it fits there. */
export interface PlannedPart {
  path: string;
  /** Which part of its block, from 0: a block on one page is part 0. */
  part: number;
  /** Whether it has its block's top edge (its first part) and its bottom edge (its last). */
  first: boolean;
  last: boolean;
  /** A block of text's lines on this page, by their index in its measured lines: from, and up to (not including). */
  lines?: [number, number];
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

/** Each block of a page, by its path: its content, header and footer, and what's in them. */
export function blocksOf(page: DrawnDocument["pages"][number]): Map<string, Block> {
  const out = new Map<string, Block>();
  const visit = (block: Block) => {
    if (block.path !== undefined) out.set(block.path, block);
    if (block.kind === "box" || block.kind === "link") block.children.forEach(visit);
  };
  [page.header, ...page.content, page.footer].forEach((block) => block && visit(block));
  return out;
}

/**
 * A document as an engine laid it out, as Measured: each block's box, and each block of text's lines matched to its
 * text (the engine reports each line's characters, less line breaks, with a hyphen where a word is broken).
 */
export function measure(document: DrawnDocument, placed: PlacedPage[]): MeasuredPage[] {
  return placed.map(({ room, blocks }, i) => {
    const written = document.pages[i] ? blocksOf(document.pages[i]) : new Map<string, Block>();
    return {
      room,
      blocks: blocks.map(({ path, x, y, width, height, lines }): MeasuredBlock => {
        const block = written.get(path);
        const out: MeasuredBlock = { path, x, y, width, height };
        if (lines?.length && block?.kind === "text") {
          const text = runsText(block.runs, block.style);
          const ends = text === undefined ? undefined : lineEnds(text, lines.map((line) => line.text));
          const justified = block.style.textAlign === "justify";
          if (ends && text !== undefined) {
            out.lines = ends.map((end, j) => {
              const line = lines[j];
              // Its spaces between words, less one it ends in.
              const between = (line.text.trimEnd().match(/ /g) ?? []).length;
              // Squeezed where its glyphs are wider than its room; justified to fill it but at a paragraph's end.
              const last = j === ends.length - 1 || end.next > end.end;
              const spacing = !between ? 0 : line.natural > line.width + 0.01 || (justified && !last) ? (line.width - line.natural) / between : 0;
              return { start: j === 0 ? 0 : ends[j - 1].next, end: end.end, next: end.next, hyphenated: end.hyphenated, top: line.top, height: line.height, wordSpacing: Math.abs(spacing) > 0.001 ? spacing : 0 };
            });
          }
        }
        return out;
      }),
    };
  });
}
