// The site's code theme for its static code blocks: the docs, the blog, the templates' pages and the home page read
// in the same colors as the playground's editor (src/lib/syntax.mjs). Mint and coral only for inserted and deleted
// lines.
import { SYNTAX } from "./syntax.mjs";

export const hyperTheme = {
  name: "hyper",
  type: "dark",
  colors: {
    "editor.background": "#0e0e0e",
    "editor.foreground": SYNTAX.text,
  },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: SYNTAX.comment, fontStyle: "italic" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator", "punctuation.definition.tag", "punctuation.separator"], settings: { foreground: SYNTAX.mark } },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.operator.expression", "variable.language.this"],
      settings: { foreground: SYNTAX.keyword },
    },
    {
      scope: ["string", "string.quoted", "string.template", "punctuation.definition.string", "punctuation.definition.template-expression", "support.constant.property-value"],
      settings: { foreground: SYNTAX.string },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character.escape", "keyword.other.unit", "constant.other.color"],
      settings: { foreground: SYNTAX.value },
    },
    // A component's tag is what a template is made of: the brightest hue.
    { scope: ["entity.name.tag", "support.class.component", "entity.name.tag.tsx", "entity.name.tag.jsx"], settings: { foreground: SYNTAX.component } },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function", "entity.name.type", "support.type", "entity.name.class", "entity.name.namespace"],
      settings: { foreground: SYNTAX.call },
    },
    // A prop's name and a style's key read alike: they're the same kind of thing.
    {
      scope: ["entity.other.attribute-name", "meta.object-literal.key", "support.type.property-name", "variable.other.property", "variable.other.object.property"],
      settings: { foreground: SYNTAX.name },
    },
    { scope: ["variable", "variable.other.readwrite", "variable.parameter"], settings: { foreground: SYNTAX.text } },
    { scope: ["markup.heading"], settings: { foreground: "#ffffff", fontStyle: "bold" } },
    { scope: ["markup.inserted"], settings: { foreground: "#7ee2a8" } },
    { scope: ["markup.deleted"], settings: { foreground: "#ff7b6e" } },
  ],
};
