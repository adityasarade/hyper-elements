/**
 * A page's content flowed onto as many pages as it needs: from its blocks as written (what can split, and how) and as
 * measured at full height (plan.ts's MeasuredPage), a Plan of which part of which block goes on which page. Pure.
 *
 * - A block of text is split between its lines, keeping at least two on each side (orphans and widows), never after a
 *   line that ends in a word broken by a hyphen.
 * - A stack of blocks (a Section, a Column, a List) is split between and inside them; a table between its rows, with
 *   its header rows on top of each page it goes on to. A stack that's cut has its top edge on its first part only, its
 *   bottom edge on its last (paint.ts slices its style).
 * - Anything else stays whole: an image, a drawing, a Row of Columns, a Button, a block with a set height. One taller
 *   than a page stays where it starts and is cut off there (it would be on any page).
 * - A heading isn't left last on a page: it goes on with what follows it.
 *
 * What's fitted first: the content (each page takes at least one block, or part of one), then orphans and widows,
 * then keeping a heading with what follows.
 */
import type { Block, Page, Style } from "./model";
import type { MeasuredBlock, MeasuredPage, PlannedPage, PlannedPart } from "./plan";

/** How far past the room a block may end and still fit: the engine lays out in 32-bit floats. */
const SLACK = 0.01;
/** Lines a block of text keeps on each side of a page's end. */
const ORPHANS = 2;
const WIDOWS = 2;

/** A block still to be placed: whole, or what's left of it after a page. */
interface Piece {
  block: Block;
  measured: MeasuredBlock;
  /** Nothing of it has been placed yet. */
  whole: boolean;
  /** Its parts placed so far. */
  parts: number;
  /** A block of text that can be split: the first of its lines left. */
  text?: { from: number };
  /** A stack's blocks left (a table's rows), in order; and a table's header rows, which each page it goes on to repeats. */
  children?: Piece[];
  header?: Piece[];
}

const number = (value: unknown): number => (typeof value === "number" ? value : 0);
const edgeTop = (style: Style) => number(style.paddingTop) + number(style.borderTopWidth);
const edgeBottom = (style: Style) => number(style.paddingBottom) + number(style.borderBottomWidth);
const gapOf = (style: Style) => number(style.gap);
const styleOf = (block: Block) => ("style" in block ? block.style : {});

/** A block as a piece to place, with what it can be split by; undefined where it wasn't measured (then the page isn't flowed). */
function pieceOf(block: Block, measured: ReadonlyMap<string, MeasuredBlock>): Piece | undefined {
  const measures = block.path !== undefined ? measured.get(block.path) : undefined;
  if (!measures) return undefined;
  const piece: Piece = { block, measured: measures, whole: true, parts: 0 };
  const splits = (block.kind === "box" || block.kind === "text") && block.style.height === undefined ? block.splits : undefined;
  if (splits === "lines" && measures.lines && measures.lines.length >= ORPHANS + WIDOWS) {
    piece.text = { from: 0 };
  } else if ((splits === "children" || splits === "rows") && block.kind === "box") {
    const children: Piece[] = [];
    for (const child of block.children) {
      const childPiece = pieceOf(child, measured);
      // A child that wasn't measured: the stack stays whole.
      if (!childPiece) return piece;
      children.push(childPiece);
    }
    piece.children = children;
    if (splits === "rows") {
      // A table's header rows: those it starts with. A table of header rows only has nothing to repeat them over.
      const count = children.findIndex((child) => !(child.block.kind === "box" && child.block.repeat));
      if (count > 0) piece.header = children.slice(0, count);
    }
  }
  return piece;
}

/** How tall what's left of a piece is, drawn as it would be: whole as measured, else from its parts. */
function heightOf(piece: Piece): number {
  const { measured } = piece;
  if (piece.whole) return measured.height;
  if (piece.text) return measured.y + measured.height - measured.lines![piece.text.from].top;
  const children = piece.children ?? [];
  const style = styleOf(piece.block);
  return children.reduce((sum, child) => sum + heightOf(child), 0) + gapOf(style) * Math.max(0, children.length - 1) + edgeBottom(style);
}

/** What's left of a piece, as its last part: whole as written, or the part of it left. */
function rest(piece: Piece): PlannedPart {
  const { path } = piece.measured;
  if (piece.whole) return { path, part: 0, first: true, last: true };
  if (piece.text) return { path, part: piece.parts, first: false, last: true, lines: [piece.text.from, piece.measured.lines!.length] };
  return { path, part: piece.parts, first: false, last: true, children: (piece.children ?? []).map(rest) };
}

interface Taken {
  /** The part placed on this page, and how tall it's drawn. */
  part: PlannedPart;
  height: number;
  /** What's left for the next page. */
  rest?: Piece;
}

/** A heading, to keep with what follows it. */
const keptWithNext = (piece: Piece) => piece.block.kind === "text" && piece.block.keepWithNext === true;

class Planner {
  /** `room`: an empty page's, to tell whether a table's header rows and a row fit on one. */
  constructor(private readonly room: number) {}

  /**
   * As much of a piece as fits in `room`, which isn't all of it (the caller places a piece that fits whole). Undefined
   * where none of it fits, unless `force` (the top of an empty page), where some of it is placed even if it can't fit.
   */
  take(piece: Piece, room: number, force: boolean): Taken | undefined {
    if (piece.text) return this.lines(piece, room, force);
    if (piece.children) return this.stack(piece, room, force);
    return force ? { part: rest(piece), height: heightOf(piece) } : undefined;
  }

  /** A block of text's lines that fit: two at least, leaving two at least, not after a hyphen; with `force`, one at least. */
  lines(piece: Piece, room: number, force: boolean): Taken | undefined {
    const { measured } = piece;
    const { from } = piece.text!;
    const lines = measured.lines!;
    const top = from === 0 ? measured.y : lines[from].top;
    const bottom = (to: number) => lines[to - 1].top + lines[to - 1].height - top;
    const fits = (to: number) => bottom(to) <= room + SLACK;
    let to = -1;
    for (let end = lines.length - WIDOWS; end >= from + ORPHANS; end--) {
      if (fits(end) && !lines[end - 1].hyphenated) {
        to = end;
        break;
      }
    }
    if (to < 0 && force) {
      // Fitting comes first: as many lines as fit, one at least.
      to = from + 1;
      while (to + 1 < lines.length && fits(to + 1)) to += 1;
    }
    if (to < 0) return undefined;
    return {
      part: { path: measured.path, part: piece.parts, first: from === 0, last: false, lines: [from, to] },
      height: bottom(to),
      rest: { ...piece, whole: false, parts: piece.parts + 1, text: { from: to } },
    };
  }

  /** A stack's blocks that fit, the one the page ends in split; a heading that would end the page goes on with what follows. */
  stack(piece: Piece, room: number, force: boolean): Taken | undefined {
    const style = styleOf(piece.block);
    const top = piece.whole ? edgeTop(style) : 0;
    const gap = gapOf(style);
    const children = piece.children!;
    // What's placed: each child placed whole (with its piece, to move it on again) or the part of one.
    const placed: Array<{ part: PlannedPart; height: number; whole?: Piece }> = [];
    const used = () => top + placed.reduce((sum, entry, i) => sum + entry.height + (i ? gap : 0), 0);
    let left: Piece[] = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const space = room - used() - (placed.length ? gap : 0);
      const height = heightOf(child);
      if (height <= space + SLACK) {
        placed.push({ part: rest(child), height, whole: child });
        continue;
      }
      const part = this.take(child, space, force && placed.length === 0);
      if (part) {
        placed.push({ part: part.part, height: part.height });
        left = part.rest ? [part.rest, ...children.slice(i + 1)] : children.slice(i + 1);
      } else if (!child.text && !child.children && height > this.room + SLACK) {
        // A block that can't be split and is taller than any page: it's cut off wherever it goes, so it stays where it
        // starts rather than leaving this page short.
        placed.push({ part: rest(child), height, whole: child });
        left = children.slice(i + 1);
      } else left = children.slice(i);
      break;
    }
    // A heading (or headings) that would end the page goes on with what follows, where something else stays.
    while (left.length && placed.length > 1 && placed[placed.length - 1].whole && keptWithNext(placed[placed.length - 1].whole!)) left = [placed.pop()!.whole!, ...left];
    // A table whose header rows alone would end the page goes on whole.
    const header = piece.header ?? [];
    if (left.length && placed.every((entry) => entry.whole && header.includes(entry.whole)) && !force) return undefined;
    if (!placed.length) return undefined;
    // A table that goes on: its header rows again on top, where they and a row fit on a page.
    if (header.length && left.length && !header.includes(left[0])) {
      const headerHeight = header.reduce((sum, row) => sum + heightOf(row) + gap, 0);
      if (headerHeight + heightOf(left[0]) <= this.room + SLACK) left = [...header, ...left];
    }
    const height = used();
    const { path } = piece.measured;
    const parts = placed.map((entry) => entry.part);
    if (!left.length) return { part: { path, part: piece.parts, first: piece.whole, last: true, children: parts }, height: height + edgeBottom(style) };
    return { part: { path, part: piece.parts, first: piece.whole, last: false, children: parts }, height, rest: { ...piece, whole: false, parts: piece.parts + 1, children: left } };
  }
}

/**
 * A page's content as planned pages, from its blocks as written and as measured at full height, its content's room
 * that tall; `from`, the page's index. Undefined where a block wasn't measured.
 */
export function flowPage(page: Page, measured: MeasuredPage, from: number): PlannedPage[] | undefined {
  const byPath = new Map(measured.blocks.map((block) => [block.path, block]));
  const pieces: Piece[] = [];
  for (const block of page.content) {
    const piece = pieceOf(block, byPath);
    if (!piece) return undefined;
    pieces.push(piece);
  }
  const room = measured.room.bottom - measured.room.top;
  // The page's content as a stack of its own: its gap between, no edges.
  const top = measured.room.top;
  const bottom = Math.max(top, ...pieces.map((piece) => piece.measured.y + piece.measured.height));
  let left: Piece | undefined = {
    block: { kind: "box", splits: "children", style: { gap: page.gap }, children: page.content },
    measured: { path: "", x: 0, y: top, width: 0, height: bottom - top },
    whole: true,
    parts: 0,
    children: pieces,
  };
  const planner = new Planner(room);
  const pages: PlannedPage[] = [];
  while (left) {
    if (heightOf(left) <= room + SLACK) {
      pages.push({ from, parts: rest(left).children ?? left.children!.map(rest) });
      left = undefined;
    } else {
      const taken: Taken = planner.take(left, room, true)!;
      pages.push({ from, parts: taken.part.children! });
      left = taken.rest;
    }
  }
  return pages;
}
