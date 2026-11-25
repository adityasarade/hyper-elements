/**
 * A Document as the PDF engine laid it out: where each block landed on its page, and what's past a page's room (cut
 * off), measured with the fonts the PDF is drawn in. What `layoutDocument()` returns, and what turns renderPdf's
 * `document/overflow` from an estimate (validate()'s, which has no fonts) into a measurement.
 */
import type { Page, PlacedBlock, PlacedPage } from "@hyper-elements/core/pdf";
import type { Diagnostic, ResolvedNode } from "@hyper-elements/react";

/** A block on a page of a Document, as the PDF draws it. Lengths are in px (96 to the inch), from its page's top left. */
export interface DocumentNode {
  path: string;
  id?: string;
  /** The template field it shows (its own `field`). */
  field?: string;
  type: string;
  /** The page it's on, from 1. A PageHeader's and a PageFooter's blocks are on every page. */
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** A block of text's lines. */
  lines?: number;
  /** Where it's past its page's room (the page less its margins, header and footer), which cuts it off: some of it, or all. */
  cut?: "some" | "all";
}

export interface DocumentPage {
  /** The page's number, from 1. */
  page: number;
  /** The paper, in px. */
  width: number;
  height: number;
  /** The room its content has: below its header and above its footer, in px from its top. */
  room: { top: number; bottom: number };
}

export interface DocumentLayout {
  pages: DocumentPage[];
  /** Each block that draws a node of the design, page by page, in the order drawn (a block before those inside it). */
  nodes: DocumentNode[];
  /** renderPdf()'s diagnostics: a page whose content doesn't fit says so, measured. */
  diagnostics: Diagnostic[];
}

/** A PDF point in px: a point is 1/72 of an inch, a px 1/96. */
const px = (points: number) => Math.round((points / 0.75) * 100) / 100;

/** How far past a page's room a block may end and still fit: Yoga lays out in 32-bit floats. */
const SLACK = 0.01;

const inside = (path: string, of: string) => path === of || path.startsWith(`${of}.`);

/** The paths of a page's header and footer, whose blocks are drawn outside its room. */
const chrome = (page: Page) => [page.header?.path, page.footer?.path].filter((path): path is string => path !== undefined);

/** What of a block is past its page's room: undefined where it all shows. */
function cutOf(block: PlacedBlock, room: PlacedPage["room"]): DocumentNode["cut"] {
  const bottom = room.bottom + SLACK;
  if (block.lines?.length) {
    const past = block.lines.filter((line) => line.top + line.height > bottom).length;
    return past === 0 ? undefined : past === block.lines.length ? "all" : "some";
  }
  if (block.y + block.height <= bottom) return undefined;
  return block.y >= room.bottom ? "all" : "some";
}

/** The nodes of a design by path, to name what a block draws. */
function byPath(root: ResolvedNode): Map<string, ResolvedNode> {
  const out = new Map<string, ResolvedNode>();
  const visit = (node: ResolvedNode) => {
    out.set(node.path, node);
    for (const child of node.children) if (typeof child !== "string") visit(child);
  };
  visit(root);
  return out;
}

/** The Document as laid out: its pages, and each block on each. */
export function documentLayout(root: ResolvedNode, pages: Page[], placed: PlacedPage[], diagnostics: Diagnostic[]): DocumentLayout {
  const nodes = byPath(root);
  return {
    pages: pages.map((page, i) => ({ page: i + 1, width: px(page.width), height: px(page.height), room: { top: px(placed[i].room.top), bottom: px(placed[i].room.bottom) } })),
    nodes: placed.flatMap(({ room, blocks }, i) => {
      const outside = chrome(pages[i]);
      return blocks.map((block): DocumentNode => {
        const node = nodes.get(block.path);
        const cut = outside.some((path) => inside(block.path, path)) ? undefined : cutOf(block, room);
        return {
          path: block.path,
          ...(node?.id ? { id: node.id } : {}),
          ...(node?.field ? { field: node.field } : {}),
          type: node?.type ?? "",
          page: i + 1,
          x: px(block.x),
          y: px(block.y),
          width: px(block.width),
          height: px(block.height),
          ...(block.lines ? { lines: block.lines.length } : {}),
          ...(cut ? { cut } : {}),
        };
      });
    }),
    diagnostics,
  };
}

/**
 * Each page whose content runs past its room, measured: said at the first block cut off (the deepest one, so a long
 * Text in a Column is named rather than the Column), with how tall the content is beside its room.
 */
export function measuredOverflow(root: ResolvedNode, pages: Page[], placed: PlacedPage[]): Diagnostic[] {
  const nodes = byPath(root);
  const out: Diagnostic[] = [];
  placed.forEach(({ room, blocks }, i) => {
    const outside = chrome(pages[i]);
    const content = blocks.filter((block) => !outside.some((path) => inside(block.path, path)));
    const bottom = Math.max(room.top, ...content.map((block) => block.y + block.height));
    if (bottom <= room.bottom + SLACK) return;
    let first = content.find((block) => cutOf(block, room));
    for (const block of content) if (first && block !== first && inside(block.path, first.path) && cutOf(block, room)) first = block;
    const height = room.bottom - room.top;
    const id = first && nodes.get(first.path)?.id;
    out.push({
      code: "document/overflow",
      severity: "warning",
      message: `Page ${i + 1}'s content (split it with a PageBreak, or into pages) is ${Math.round(((bottom - room.top) / height) * 100)}% as tall as its room, measured with its fonts. What doesn't fit is cut off, from here on`,
      path: first?.path ?? "root",
      ...(id ? { nodeId: id } : {}),
    });
  });
  return out;
}
