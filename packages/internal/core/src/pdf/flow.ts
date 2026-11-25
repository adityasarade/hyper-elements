/**
 * A page's content flowed onto as many pages as it needs, from where the engine laid it out once at its full height
 * (model.ts's PlacedPage): what fits stays, what doesn't goes on to the next page. Pure: the blocks and where they
 * landed in, pages of blocks out, which the engine then draws as it draws any page.
 *
 * - A block of text is split between its lines, keeping at least two on each side (orphans and widows), never after a
 *   line that ends in a word broken by a hyphen.
 * - A stack of blocks (a Section, a Column, a List) is split between and inside them; a table between its rows, with
 *   its header rows drawn again at the top of each page it goes on to. A stack that's cut has its top padding and
 *   border on its first part only, its bottom ones on its last, and no set height.
 * - Anything else stays whole: an image, a drawing, a Row of Columns, a Button, a block with a set height. One taller
 *   than a page stays where it starts and is cut off there (it would be on any page).
 * - A heading isn't left last on a page: it goes on with what follows it.
 *
 * What's fitted first: the content (each page takes at least one block, or part of one), then orphans and widows,
 * then keeping a heading with what follows.
 */
import type { Block, Page, PlacedBlock, PlacedPage, Run, Style } from "./model";
import { lineEnds, runsText, splitRuns, type LineEnd } from "./runs";

/** How far past the room a block may end and still fit: the engine lays out in 32-bit floats. */
const SLACK = 0.01;
/** Lines a block of text keeps on each side of a page's end. */
const ORPHANS = 2;
const WIDOWS = 2;

/** A part of a split block of text drawn on a page: which block, and the lines it should come out as. */
export interface SplitText {
  path: string;
  /** Each line's characters, as the engine laid them out when the block was whole. */
  lines: string[];
}

export interface FlowedPages {
  /** Each page's blocks. */
  pages: Block[][];
  /** On each page, the parts of split blocks of text on it. */
  splits: SplitText[][];
}

/**
 * Lines to hold back when a block of text is split, by its path: a part of it drawn on its own came out in more lines
 * than it was cut from (its engine breaks a part's lines as a whole, and can break them otherwise than the block's),
 * so its parts are cut that many lines shorter.
 */
export type HoldBack = ReadonlyMap<string, number>;

/** A block still to be placed: whole, or what's left of it after a page. */
interface Piece {
  block: Block;
  placed: PlacedBlock;
  /** Nothing of it has been placed yet. */
  whole: boolean;
  /** A block of text that can be split: where each of its lines ends in its text, the first line left, and the lines to hold back. */
  text?: { ends: LineEnd[]; length: number; from: number; hold: number };
  /** A stack's blocks left (a table's rows), in order; and a table's header rows, which each page it goes on to repeats. */
  children?: Piece[];
  header?: Piece[];
}

const number = (value: unknown): number => (typeof value === "number" ? value : 0);
const edgeTop = (style: Style) => number(style.paddingTop) + number(style.borderTopWidth);
const edgeBottom = (style: Style) => number(style.paddingBottom) + number(style.borderBottomWidth);
const gapOf = (style: Style) => number(style.gap);

const TOP = ["paddingTop", "borderTopWidth", "borderTopStyle", "borderTopColor", "borderTopLeftRadius", "borderTopRightRadius"];
const BOTTOM = ["paddingBottom", "borderBottomWidth", "borderBottomStyle", "borderBottomColor", "borderBottomLeftRadius", "borderBottomRightRadius"];

/** A part of a block's style: its top edge on its first part only, its bottom edge on its last, no set height on a part. */
function slice(style: Style, first: boolean, last: boolean): Style {
  if (first && last) return style;
  const out: Style = { ...style };
  delete out.height;
  delete out.minHeight;
  delete out.maxHeight;
  if (style.borderRadius !== undefined) {
    // A corner radius set for all four: kept where the part has the corner.
    const radius = style.borderRadius;
    delete out.borderRadius;
    if (first) Object.assign(out, { borderTopLeftRadius: radius, borderTopRightRadius: radius });
    if (last) Object.assign(out, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius });
  }
  if (!first) for (const key of TOP) delete out[key];
  if (!last) for (const key of BOTTOM) delete out[key];
  return out;
}

/** The runs between two characters of their text. */
const runsBetween = (runs: Run[], from: number, to: number): Run[] => splitRuns(splitRuns(runs, to)[0], from)[1];

/**
 * A block as a piece to place, with what it can be split by; undefined where a block that should be measured wasn't
 * (then the page isn't flowed).
 */
function pieceOf(block: Block, placements: ReadonlyMap<string, PlacedBlock>, hold: HoldBack): Piece | undefined {
  const placed = block.path !== undefined ? placements.get(block.path) : undefined;
  if (!placed) return undefined;
  const piece: Piece = { block, placed, whole: true };
  const splits = (block.kind === "box" || block.kind === "text") && block.style.height === undefined ? block.splits : undefined;
  if (splits === "lines" && block.kind === "text" && placed.lines && placed.lines.length >= ORPHANS + WIDOWS) {
    const text = runsText(block.runs, block.style);
    const ends = text === undefined ? undefined : lineEnds(text, placed.lines.map((line) => line.text));
    if (ends && text !== undefined) piece.text = { ends, length: text.length, from: 0, hold: hold.get(placed.path) ?? 0 };
  } else if ((splits === "children" || splits === "rows") && block.kind === "box") {
    const children: Piece[] = [];
    for (const child of block.children) {
      const childPiece = pieceOf(child, placements, hold);
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

/** How tall what's left of a piece is, drawn as it would be: whole as laid out, else from its parts. */
function heightOf(piece: Piece): number {
  if (piece.whole) return piece.placed.height;
  const { block, placed } = piece;
  if (piece.text) return placed.y + placed.height - placed.lines![piece.text.from].top;
  const children = piece.children ?? [];
  return children.reduce((sum, child) => sum + heightOf(child), 0) + gapOf(block.style) * Math.max(0, children.length - 1) + edgeBottom(block.style);
}

/** What's left of a piece, drawn whole on a page: as written, or the part of it left. */
function rest(piece: Piece): Block {
  if (piece.whole) return piece.block;
  const { block } = piece;
  if (piece.text && block.kind === "text") {
    const start = piece.text.ends[piece.text.from - 1].next;
    return { ...block, style: slice(block.style, false, true), runs: runsBetween(block.runs, start, piece.text.length) };
  }
  if (block.kind !== "box") return block;
  return { ...block, style: slice(block.style, false, true), children: (piece.children ?? []).map(rest) };
}

interface Taken {
  /** The part placed on this page, and how tall it's drawn. */
  block: Block;
  height: number;
  /** What's left for the next page. */
  rest?: Piece;
}

/** A heading, to keep with what follows it. */
const keptWithNext = (piece: Piece) => piece.block.kind === "text" && piece.block.keepWithNext === true;

class Planner {
  /** The parts of split text placed on the page being filled. */
  splits: SplitText[] = [];

  /** `room`: an empty page's, to tell whether a table's header rows and a row fit on one. */
  constructor(private readonly room: number) {}

  /**
   * As much of a piece as fits in `room`, which isn't all of it (the caller places a piece that fits whole). Undefined
   * where none of it fits, unless `force` (the top of an empty page), where some of it is placed even if it can't fit.
   */
  take(piece: Piece, room: number, force: boolean): Taken | undefined {
    if (piece.text) return this.lines(piece, room, force);
    if (piece.children) return this.stack(piece, room, force);
    return force ? { block: rest(piece), height: heightOf(piece) } : undefined;
  }

  /** A block of text's lines that fit: two at least, leaving two at least, not after a hyphen; with `force`, one at least. */
  lines(piece: Piece, room: number, force: boolean): Taken | undefined {
    const { block, placed } = piece;
    if (block.kind !== "text") return undefined;
    const { ends, length, from, hold } = piece.text!;
    const lines = placed.lines!;
    const top = from === 0 ? placed.y : lines[from].top;
    const bottom = (to: number) => lines[to - 1].top + lines[to - 1].height - top;
    // Room for the lines held back too, below the part's own.
    const fits = (to: number) => bottom(Math.min(lines.length, to + hold)) <= room + SLACK;
    let to = -1;
    for (let end = lines.length - WIDOWS; end >= from + ORPHANS; end--) {
      if (fits(end) && !ends[end - 1].hyphenated) {
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
    const start = from === 0 ? 0 : ends[from - 1].next;
    this.splits.push({ path: placed.path, lines: lines.slice(from, to).map((line) => line.text) });
    return {
      block: { ...block, style: slice(block.style, from === 0, false), runs: runsBetween(block.runs, start, ends[to - 1].end) },
      height: bottom(to),
      rest: { ...piece, whole: false, text: { ends, length, from: to, hold } },
    };
  }

  /** A stack's blocks that fit, the one the page ends in split; a heading that would end the page goes on with what follows. */
  stack(piece: Piece, room: number, force: boolean): Taken | undefined {
    const { block } = piece;
    if (block.kind !== "box") return undefined;
    const top = piece.whole ? edgeTop(block.style) : 0;
    const gap = gapOf(block.style);
    const children = piece.children!;
    // What's placed: each child placed whole (with its piece, to move it on again) or the part of one.
    const placed: Array<{ block: Block; height: number; whole?: Piece }> = [];
    const used = () => top + placed.reduce((sum, entry, i) => sum + entry.height + (i ? gap : 0), 0);
    let left: Piece[] = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const room_ = room - used() - (placed.length ? gap : 0);
      const height = heightOf(child);
      if (height <= room_ + SLACK) {
        placed.push({ block: rest(child), height, whole: child });
        continue;
      }
      const part = this.take(child, room_, force && placed.length === 0);
      if (part) {
        placed.push({ block: part.block, height: part.height });
        left = part.rest ? [part.rest, ...children.slice(i + 1)] : children.slice(i + 1);
      } else if (!child.text && !child.children && height > this.room + SLACK) {
        // A block that can't be split and is taller than any page: it's cut off wherever it goes, so it stays where it
        // starts rather than leaving this page short.
        placed.push({ block: rest(child), height, whole: child });
        left = children.slice(i + 1);
      } else left = children.slice(i);
      break;
    }
    // A heading (or headings) that would end the page goes on with what follows, where something else stays.
    while (left.length && placed.length > 1 && placed[placed.length - 1].whole && keptWithNext(placed[placed.length - 1].whole!)) left = [placed.pop()!.whole!, ...left];
    // A table whose header rows alone would end the page goes on whole.
    const header = piece.header ?? [];
    if (left.length && placed.every((entry) => entry.whole && header.includes(entry.whole))) {
      if (!force) return undefined;
    }
    if (!placed.length) return undefined;
    // A table that goes on: its header rows again on top, where they and a row fit on a page.
    if (header.length && left.length && !header.includes(left[0])) {
      const headerHeight = header.reduce((sum, row) => sum + heightOf(row) + gap, 0);
      if (headerHeight + heightOf(left[0]) <= this.room + SLACK) left = [...header, ...left];
    }
    const height = used();
    if (!left.length) return { block: { ...block, style: slice(block.style, piece.whole, true), children: placed.map((entry) => entry.block) }, height: height + edgeBottom(block.style) };
    return { block: { ...block, style: slice(block.style, piece.whole, false), children: placed.map((entry) => entry.block) }, height, rest: { ...piece, whole: false, children: left } };
  }
}

/**
 * A page's content flowed onto pages whose room is `room` points tall, from where it was laid out (`placed`, its
 * blocks' boxes at full height), with the lines to hold back when a block of text is split. Undefined where a block
 * wasn't measured.
 */
export function flowPage(page: Page, placed: PlacedPage, hold: HoldBack = new Map()): FlowedPages | undefined {
  const placements = new Map(placed.blocks.map((block) => [block.path, block]));
  const pieces: Piece[] = [];
  for (const block of page.content) {
    const piece = pieceOf(block, placements, hold);
    if (!piece) return undefined;
    pieces.push(piece);
  }
  const room = placed.room.bottom - placed.room.top;
  // The page's content as a stack of its own: its gap between, no edges.
  const content: Block = { kind: "box", splits: "children", style: { gap: page.gap }, children: page.content };
  const top = placed.room.top;
  const bottom = Math.max(top, ...pieces.map((piece) => piece.placed.y + piece.placed.height));
  let left: Piece | undefined = { block: content, placed: { path: "", x: 0, y: top, width: 0, height: bottom - top }, whole: true, children: pieces };
  const planner = new Planner(room);
  const out: FlowedPages = { pages: [], splits: [] };
  while (left) {
    planner.splits = [];
    let blocks: Block[];
    if (heightOf(left) <= room + SLACK) {
      blocks = (rest(left) as Extract<Block, { kind: "box" }>).children;
      left = undefined;
    } else {
      const part: Taken = planner.take(left, room, true)!;
      blocks = (part.block as Extract<Block, { kind: "box" }>).children;
      left = part.rest;
    }
    out.pages.push(blocks);
    out.splits.push(planner.splits);
  }
  return out;
}
