/** An Svg as inline SVG, and its shapes as SVG's (../shared/svg.ts, which an email's file is written by too). */
import { h } from "../jsx";
import { svgFrame, svgShapes } from "../shared/svg";
import type { Component } from "./context";
import { box } from "./layout";

export const Svg: Component = ({ node, parent, placement, classes }) => {
  const { width, height, viewBox } = svgFrame(node);
  const title = node.props.title as string | undefined;
  return (
    <svg
      id={node.id}
      class={classes()}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={viewBox}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
      // Its padding and border around the drawing, as the resolver counts them (a framed box is border-box elsewhere).
      style={[placement, { display: "block", flex: "none" }, { ...box(node, parent.type !== "Row"), boxSizing: undefined }]}
    >
      {svgShapes(node)}
    </svg>
  );
};
