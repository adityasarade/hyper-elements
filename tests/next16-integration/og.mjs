// An OpenGraph card as a template (@hyper-elements/react/template), drawn with @hyper-elements/react/image: what
// app/og/[slug]/opengraph-image.jsx serves, and what ../nextjs-integration/verify.mjs --og draws again in Node.
// The same file as tests/nextjs-integration/og.mjs: each app imports its own, and resolves the package from its own
// node_modules.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import React from "react";
import { Canvas, Heading, Text, prop } from "@hyper-elements/react";
import { renderImage } from "@hyper-elements/react/image";
import { template } from "@hyper-elements/react/template";

const h = React.createElement;

export const OgCard = template({
  id: "acme.OgCard",
  version: "1.0.0",
  label: "OpenGraph card",
  root: "Canvas",
  fields: {
    title: prop.text({ label: "Title", required: true, maxLength: 80 }),
    kicker: prop.text({ label: "Kicker", maxLength: 40 }),
  },
  example: { title: "Hyper Elements", kicker: "Docs" },
  render: (v) =>
    h(
      Canvas,
      { width: 1200, height: 630, style: { backgroundColor: "#0B1020", color: "#F7F7FB", fontFamily: "Inter", padding: 72, gap: 24, justifyContent: "end" } },
      v.kicker ? h(Text, { field: "kicker", style: { fontSize: 28, color: "#2DD4BF" } }, v.kicker) : null,
      h(Heading, { field: "title", level: 1, style: { fontSize: 72, lineHeight: 1.1 } }, v.title)
    ),
});

/** The pages that have a card: the first two prerendered when the app builds, the last drawn on request. */
export const PAGES = {
  orbit: { title: "Orbit is live", kicker: "Launch" },
  pricing: { title: "Simple pricing, for every team", kicker: "Pricing" },
  "on-request": { title: "Drawn on request" },
};

/** A page's card as a PNG: the template as the design's root, so its check runs before it's drawn. */
export async function ogImage(slug) {
  const values = PAGES[slug] ?? { title: "Not found" };
  // The app's folder is the working directory for `next build`, `next start` and the verifier alike.
  const font = await readFile(join(process.cwd(), "../fonts/Inter-Regular.ttf"));
  const { image } = await renderImage(h(OgCard, values), { fonts: [{ family: "Inter", src: font }] });
  return image;
}
