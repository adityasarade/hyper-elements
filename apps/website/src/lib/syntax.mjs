/**
 * The site's code colors: the playground's editor (src/playground/editor.ts), its HTML tab (`.pg-source` in
 * playground.css) and every static code block (src/lib/shiki-theme.mjs) read the same. Four hues on the code
 * surface's near-black: blue for components and calls, lavender for keywords, sand for strings, sky for numbers.
 * Coral and mint stay out of it: on this site they mean an error and a success, and a diagnostic's mark has to read
 * as one.
 */
export const SYNTAX = {
  text: "#d6d6d6",
  comment: "#6b6b6b",
  keyword: "#c4a7e7",
  component: "#7ab8ff",
  call: "#9cc8ff",
  name: "#b9c3d4",
  string: "#e4cfa1",
  value: "#89dceb",
  mark: "#727272",
};
