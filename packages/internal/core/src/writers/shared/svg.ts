/**
 * An Svg's drawing as SVG markup, the one every HTML output writes: inline on a page, and as the file an email links to
 * (writers/email/Svg.tsx). Its shapes in the order given, each with its props and how it's painted ("transparent"
 * paint as SVG's none). Written by code alone, so the same Svg is the same bytes on every engine: an email names the
 * file by them.
 */
import type { ResolvedNode } from "../../resolve";
import { h, type Html } from "../jsx";

const paint = (value: unknown) => (value === "transparent" ? "none" : (value as string | undefined));

/** A shape's attributes: its props, and how it's painted. */
export function shapeAttributes(node: ResolvedNode): Record<string, string | number | undefined> {
  const { style, props } = node;
  return {
    ...(props as Record<string, string | number | undefined>),
    fill: paint(style.fill),
    stroke: paint(style.stroke),
    "stroke-width": style.strokeWidth as number | undefined,
    opacity: style.opacity as number | undefined,
  };
}

const TAGS: Record<string, string> = { Rect: "rect", Circle: "circle", Ellipse: "ellipse", Line: "line", Polygon: "polygon", Path: "path" };

const isNode = (child: ResolvedNode | string): child is ResolvedNode => typeof child !== "string";

/** An Svg's shapes, as SVG elements. */
export function svgShapes(node: ResolvedNode): Html[] {
  return node.children.filter(isNode).map((shape) => h(TAGS[shape.type]!, shapeAttributes(shape)));
}

/** An Svg's size and the coordinates its shapes are in. */
export function svgFrame(node: ResolvedNode): { width: number; height: number; viewBox: string } {
  const { width, height, viewBox } = node.props as { width: number; height: number; viewBox?: string };
  return { width, height, viewBox: viewBox ?? `0 0 ${width} ${height}` };
}

/** An Svg as a file of its own: its drawing, at its size, with nothing of the page around it (no id, class or style). */
export function svgFile(node: ResolvedNode): string {
  const { width, height, viewBox } = svgFrame(node);
  return String(h("svg", { xmlns: "http://www.w3.org/2000/svg", width, height, viewBox }, ...svgShapes(node)));
}
