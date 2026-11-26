/**
 * A page as painted, as a hash (PlannedPage's `hash`): its paper, margins and background, and every block of its
 * header, content and footer (kinds, styles, text, images, drawings). The same where nothing drawn on it changed, so a
 * page view keeps a page it drew.
 */
import { hasher } from "../plan";
import type { Block, Page, Run } from "./model";

/** An image file's number in a page's hash (its data URI can be large): the last 1,000; a number never given twice. */
const files = new Map<string, number>();
let filed = 0;
const fileOf = (src: string): string => {
  let id = files.get(src);
  if (id === undefined) {
    files.set(src, (id = ++filed));
    if (files.size > 1000) files.delete(files.keys().next().value!);
  }
  return `#${id}`;
};

export function pageHash(page: Page): string {
  const hash = hasher();
  const run = (item: Run) => {
    if (typeof item === "string") return hash.add(`"${item}`);
    if (item.kind === "image") return hash.add(`i${fileOf(item.src)}${JSON.stringify(item.style)}`);
    hash.add(`${item.kind}${JSON.stringify(item.style)}${item.kind === "link" ? item.href : ""}(${item.runs.length}`);
    item.runs.forEach(run);
  };
  const block = (item: Block | undefined) => {
    if (!item) return hash.add("-");
    hash.add(`${item.kind}${item.path ?? ""}${"style" in item ? JSON.stringify(item.style) : ""}`);
    switch (item.kind) {
      case "text":
        hash.add(`(${item.runs.length}`);
        item.runs.forEach(run);
        return;
      case "image":
        return hash.add(fileOf(item.src));
      case "drawing":
        return hash.add(`${item.width}x${item.height}${item.viewBox}${JSON.stringify(item.shapes)}`);
      case "box":
      case "link":
        hash.add(`${item.kind === "link" ? item.href : ""}(${item.children.length}`);
        item.children.forEach(block);
    }
  };
  hash.add(`${page.width}x${page.height}${JSON.stringify(page.margin)}${page.background}${page.contentHeight}${page.gap ?? ""}`);
  block(page.header);
  hash.add(`(${page.content.length}`);
  page.content.forEach(block);
  block(page.footer);
  return hash.hex();
}
