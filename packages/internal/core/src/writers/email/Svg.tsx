/**
 * An Svg as an image file the email links to (assets.ts): email clients drop inline `<svg>`. Every client but classic
 * Outlook gets the SVG file; classic Outlook, which shows a hosted SVG as a broken image (2019, in the real client), gets its PNG, in
 * a conditional comment the others read as a comment. Both are the drawing's size in their `width` and `height`
 * attributes (Word sizes images by them, not by CSS), and fluid elsewhere, its width at most. Its padding, background
 * and border are a cell around it (Box), as Word draws no box on an image.
 */
import { h, NotOutlook, Outlook } from "../jsx";
import { addEmailAsset, emailAsset } from "./assets";
import type { Component } from "./context";
import { Box } from "./layout";

export const Svg: Component = ({ node, fill, options }) => {
  // render() refuses an Email with an Svg and no assets before writing (renderTemplate): here it always has them.
  const assets = options.assets!;
  const asset = emailAsset(node, assets);
  addEmailAsset(asset);
  const { width, height } = asset.drawing;
  const alt = (node.props.title as string | undefined) ?? "";
  const image = (src: string, fluid: boolean) =>
    h("img", {
      src,
      alt,
      width,
      height,
      border: "0",
      // Fluid where CSS is read: its width at most, narrower on a narrow screen.
      style: { display: "block", width: fluid ? "100%" : undefined, maxWidth: fluid ? width : undefined, height: fluid ? "auto" : undefined, border: "0" },
    });
  // The pair in a div: one element, which takes the Svg's id where it has no box of its own (a Row's cell).
  const content = asset.rasterUrl ? (
    <div>
      <Outlook>{image(asset.rasterUrl, false)}</Outlook>
      <NotOutlook>{image(asset.svgUrl, true)}</NotOutlook>
    </div>
  ) : (
    image(asset.svgUrl, true)
  );
  return (
    <Box node={node} fill={fill}>
      {content}
    </Box>
  );
};
