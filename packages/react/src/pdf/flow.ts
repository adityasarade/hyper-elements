/**
 * The checks around flowing a Document's pages: whether any page's content runs past its room (so it's flowed), and
 * whether each block of text split across pages came out as its lines were planned.
 */
import type { Page, PlacedPage, SplitText } from "@hyper-elements/core/pdf";

/**
 * How far past its room a page's content must run to be flowed: a document that fits, give or take the engine's
 * rounding, is drawn as it always was.
 */
const ROUNDING = 0.5;

const inside = (path: string, of: string) => path === of || path.startsWith(`${of}.`);

/** Whether any page's content (not its header or footer) runs past its room. */
export function overflows(pages: Page[], placed: PlacedPage[]): boolean {
  return placed.some(({ room, blocks }, i) => {
    const outside = [pages[i]?.header?.path, pages[i]?.footer?.path].filter((path): path is string => path !== undefined);
    return blocks.some((block) => !outside.some((path) => inside(block.path, path)) && block.y + block.height > room.bottom + ROUNDING);
  });
}

/**
 * The blocks of text split across pages with a part drawn in more lines than it was cut from (its engine breaks a
 * part's lines as a whole, and can break them otherwise than the block's), by how many more: a part that's taller than
 * planned, which can run past its page. A part in as many lines or fewer holds the same text, in no more room.
 */
export function linesOver(splits: SplitText[][], placed: PlacedPage[]): Map<string, number> {
  const over = new Map<string, number>();
  splits.forEach((parts, i) => {
    for (const part of parts) {
      const drawn = placed[i]?.blocks.find((block) => block.path === part.path)?.lines?.length ?? Infinity;
      if (drawn > part.lines.length) over.set(part.path, Math.max(over.get(part.path) ?? 0, Math.min(drawn - part.lines.length, part.lines.length)));
    }
  });
  return over;
}
