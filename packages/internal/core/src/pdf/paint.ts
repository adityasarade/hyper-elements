/**
 * A Plan's page as blocks to draw (model.ts): each part of a block as the page shows it. A block on one page is drawn
 * as written. A stack that's cut has its top edge (padding, border, corners) on its first part only, its bottom edge on
 * its last, and no set height. A block of text that's cut is drawn line by line, each line as it was measured: its
 * characters, and the room its spaces between words were given (squeezed into its box, or justified), so the engine
 * draws it where it was and can't break its lines otherwise.
 */
import type { Block, Run, Style } from "./model";
import { isWhole, type MeasuredBlock, type PlannedPart } from "./plan";
import { splitRuns } from "./runs";

const TOP = ["paddingTop", "borderTopWidth", "borderTopStyle", "borderTopColor", "borderTopLeftRadius", "borderTopRightRadius"];
const BOTTOM = ["paddingBottom", "borderBottomWidth", "borderBottomStyle", "borderBottomColor", "borderBottomLeftRadius", "borderBottomRightRadius"];

/** A part of a block's style: its top edge on its first part only, its bottom edge on its last, no set height on a part. */
export function slice(style: Style, first: boolean, last: boolean): Style {
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

/**
 * Room past a line's box, on the side away from where it's aligned, so a line drawn on its own is never broken again
 * (a space's width rounded, a glyph its engine draws a hair wider): its text stays where its alignment puts it.
 */
const BEYOND = 10000;
const unbounded = (align: unknown): Style =>
  align === "right" ? { marginLeft: -BEYOND } : align === "center" ? { marginLeft: -BEYOND, marginRight: -BEYOND } : { marginRight: -BEYOND };

/** A line's runs ending in a hyphen, in its last run's style: a line that ends in a word broken across lines. */
function withHyphen(runs: Run[]): Run[] {
  const out = [...runs];
  const last = out[out.length - 1];
  if (typeof last === "string" || last === undefined) out.push("-");
  else if (last.kind === "image") out.push("-");
  else out[out.length - 1] = { ...last, runs: withHyphen(last.runs) };
  return out;
}

/** A line's runs with each space between its words given `spacing` more room (its letter spacing). */
function spaced(runs: Run[], spacing: number): Run[] {
  if (!spacing) return runs;
  return runs.flatMap((run): Run[] => {
    if (typeof run === "string") return run.split(/( )/).filter(Boolean).map((piece): Run => (piece === " " ? { kind: "span", style: { letterSpacing: spacing }, runs: [" "] } : piece));
    if (run.kind === "image") return [run];
    return [{ ...run, runs: spaced(run.runs, spacing) }];
  });
}

/** The runs between two characters of their text. */
const runsBetween = (runs: Run[], from: number, to: number): Run[] => splitRuns(splitRuns(runs, to)[0], from)[1];

/** The runs less the spaces they end in: a line's trailing space, which takes no room where it ends a line. */
function trimEnd(runs: Run[]): Run[] {
  const out = [...runs];
  while (out.length) {
    const last = out[out.length - 1];
    if (typeof last === "string") {
      const trimmed = last.replace(/[ \t]+$/, "");
      if (trimmed) {
        out[out.length - 1] = trimmed;
        return out;
      }
      out.pop();
    } else if (last.kind === "image") return out;
    else {
      const inner = trimEnd(last.runs);
      if (inner.length) {
        out[out.length - 1] = { ...last, runs: inner };
        return out;
      }
      out.pop();
    }
  }
  return out;
}

export class Painter {
  /** `blocks` and `measured`: the page as written, and as measured, each block by its path. */
  constructor(
    private readonly blocks: ReadonlyMap<string, Block>,
    private readonly measured: ReadonlyMap<string, MeasuredBlock>
  ) {}

  part(part: PlannedPart): Block {
    const block = this.blocks.get(part.path)!;
    if (isWhole(part)) return block;
    if (part.lines && block.kind === "text") {
      const lines = this.measured.get(part.path)!.lines!.slice(part.lines[0], part.lines[1]);
      // Its lines one under another, each as measured. Its text style is the box's, which they take; a justified
      // block's lines are as wide as its spacing makes them, each set from its start.
      const align = block.style.textAlign === "justify" ? "left" : block.style.textAlign;
      const style: Style = { ...unbounded(align), ...(block.style.textAlign === "justify" ? { textAlign: "left" } : {}) };
      return {
        kind: "box",
        path: part.path,
        style: { ...slice(block.style, part.first, part.last), flexDirection: "column" },
        children: lines.map((line): Block => {
          const runs = trimEnd(runsBetween(block.runs, line.start, line.end));
          return { kind: "text", style, runs: spaced(line.hyphenated ? withHyphen(runs) : runs, line.wordSpacing) };
        }),
      };
    }
    if (part.children && block.kind === "box") return { ...block, style: slice(block.style, part.first, part.last), children: part.children.map((child) => this.part(child)) };
    return block;
  }
}
