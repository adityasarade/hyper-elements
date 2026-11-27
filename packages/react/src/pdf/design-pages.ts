import type { Plan, PlannedPart } from "@hyper-elements/core";

/** A part of a builder design on a page: where it is in the design's body, its id there, and whether it starts or ends there. */
export interface DesignPagePart {
  at: string;
  id?: string;
  /** The page has its first part (it starts here), and its last (it ends here). On both, it's whole on the page. */
  first: boolean;
  last: boolean;
}

/**
 * Each page's parts of a builder design, as a plan of the template fromDesign() made of it puts them: `parts` is
 * fromDesign()'s, the plan is of its `element`. A page lists every part of the design with something on it, in the
 * order it's drawn (a row before its columns, a column before its blocks, a table before its rows), each once. A
 * part that goes on from the page before isn't `first`; one that goes on to the next isn't `last`. A table's header
 * rows are on every page it runs to. The Document's header and footer aren't listed: they're on every page.
 */
export function designPages(plan: Plan, parts: Readonly<Record<string, { at: string; id?: string }>>): DesignPagePart[][] {
  // What's in each node, in the template's order (fromDesign() names each node before what's in it).
  const inside = new Map<string, string[]>();
  for (const path of Object.keys(parts)) {
    const around = path.replace(/\.children\[\d+\]$/, "");
    inside.set(around, [...(inside.get(around) ?? []), path]);
  }
  return plan.pages.map((page) => {
    const listed = new Map<string, DesignPagePart>();
    const add = (path: string, first: boolean, last: boolean) => {
      const of = parts[path];
      const seen = of && listed.get(of.at);
      // A part of the design made of several nodes (a block and the box made around it): first where any of them starts.
      if (seen) {
        seen.first ||= first;
        seen.last ||= last;
      } else if (of) listed.set(of.at, { at: of.at, ...(of.id !== undefined ? { id: of.id } : {}), first, last });
    };
    // What's in a block planned as one part (whole on the page, or a text's lines) is there as it is.
    const within = (path: string, first: boolean, last: boolean) => {
      for (const child of inside.get(path) ?? []) {
        add(child, first, last);
        within(child, first, last);
      }
    };
    const visit = (part: PlannedPart) => {
      // A Row's column with nothing on this page keeps its room there and draws nothing.
      if (part.empty) return;
      add(part.path, part.first, part.last);
      if (part.children) part.children.forEach(visit);
      else within(part.path, part.first, part.last);
    };
    page.parts.forEach(visit);
    return [...listed.values()];
  });
}
