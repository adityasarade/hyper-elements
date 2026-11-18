/** What a design's laid-out tree holds, read with a plugin passed to `validate()`: its root, its images and its words. */
import type { ReactElement } from "react";
import { validate, type ElementsPlugin, type PluginNode } from "@hyper-elements/react";

export interface TreeFacts {
  root: string;
  /** Every image's address, logos included. */
  images: string[];
  /** Every word it shows, joined. */
  text: string;
  /** What `validate()` found. */
  diagnostics: ReturnType<typeof validate>["diagnostics"];
}

export function treeFacts(design: ReactElement): TreeFacts {
  const facts = { root: "", images: [] as string[], text: [] as string[] };
  const plugin: ElementsPlugin = {
    name: "templates-folder-tree",
    api: 1,
    check({ root }) {
      facts.root = root.type;
      const walk = (node: PluginNode) => {
        if (node.type === "Image") {
          const src = typeof node.props.src === "string" ? node.props.src : (node.props.src as { src?: string } | undefined)?.src;
          if (src) facts.images.push(src);
        }
        for (const child of node.children) {
          if (typeof child === "string") facts.text.push(child);
          else walk(child);
        }
      };
      walk(root);
      return [];
    },
  };
  const { diagnostics } = validate(design, { plugins: [plugin] });
  return { root: facts.root, images: [...new Set(facts.images)], text: facts.text.join(" "), diagnostics };
}
