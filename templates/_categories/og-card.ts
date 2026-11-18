import { prop } from "@hyper-elements/react";

export const ogCard = {
  group: "Content",
  label: "Open Graph card",
  roots: ["Canvas"],
  useWhen: "The picture a link shows when it's shared: an article's or a page's title, with the brand",
  avoidWhen: "A launch with features and a product picture (use announcement), or an ad (use ad)",
  required: {
    title: prop.text({ label: "Title", required: true, maxLength: 100 }),
  },
  example: { title: "How we cut our build times in half without changing a line of product code" },
} as const;
