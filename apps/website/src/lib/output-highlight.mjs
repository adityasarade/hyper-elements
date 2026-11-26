/**
 * The docs' and the blog's command output (```text blocks): what the CLI prints, a design's diagnostics, its outline,
 * a plain-text email, a file tree. Shiki leaves text uncolored; this transformer colors each line by what it is, in the
 * site's code colors (src/lib/syntax.mjs), with mint, coral and amber for a success, an error and a warning, as they
 * mean everywhere on the site. Only spans are added: the text, and so what the copy button copies, is unchanged.
 */
import { SYNTAX } from "./syntax.mjs";

const C = {
  ...SYNTAX,
  dim: "#8a8a8a",
  bright: "#f5f5f5",
  ok: "#7ee2a8",
  error: "#ff7b6e",
  warning: "#f5b971",
  info: "#89dceb",
};

const text = (value) => ({ type: "text", value });
const span = (value, style) => (style ? { type: "element", tagName: "span", properties: { style }, children: [text(value)] } : text(value));
const color = (c, extra = "") => `color:${c}${extra}`;
const BOLD = ";font-weight:600";
const NOWRAP = ";white-space:nowrap";
/** A small square of a color, before its hex value. Empty, so it's never copied. */
const swatch = (hex) => ({
  type: "element",
  tagName: "span",
  properties: {
    "aria-hidden": "true",
    style: `display:inline-block;width:.78em;height:.78em;margin-right:.4em;vertical-align:-.06em;border-radius:3px;background:${hex};box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)`,
  },
  children: [],
});

// ─── Inline: the parts of a message, an outline line, a path list ───────────────────────────────────────────────────

const ROOTS = "Email|Page|Document|Canvas";
const EXT = "tsx|ts|jsx|js|mjs|cjs|json|html|txt|png|jpe?g|webp|gif|pdf|svg|ttf|otf|woff2?|md|mdx|css|yaml|yml";
const INLINE = new RegExp(
  [
    String.raw`(?<url>https?:\/\/[^\s)"'\]]+)`,
    String.raw`(?<merge>\{\{[^}]+\}\})`,
    String.raw`(?<label>\b(?:Fix|See|Read more):)`,
    String.raw`(?<tag><\/?)(?<tagName>[A-Z][\w.]*)(?<tagEnd>\s*\/?>)?`,
    String.raw`(?<quoted>"[^"\n]*")`,
    String.raw`(?<hex>#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b)`,
    String.raw`(?<pkg>@[\w-]+\/[\w-]+(?:\/[\w.-]+)*)`,
    String.raw`(?<path>(?<![\w@.])\/?(?:[\w.\[\]<>…-]+\/)+[\w.\[\]<>…-]*|\b[\w-]+(?:\.[\w-]+)*\.(?:${EXT})\b)`,
    String.raw`(?<count>\b\d+ (?:errors?|warnings?|skipped)\b)`,
    String.raw`(?<root>\((?:${ROOTS})\))`,
    String.raw`(?<list>\[[a-z][\w.-]*(?:, [a-z][\w.-]*)*\])`,
    String.raw`(?<requiredBy>\(required by [\w.]+\))`,
    String.raw`(?<level>\bh[1-6]\b)`,
    String.raw`(?<num>\b\d+(?:\.\d+)?(?:×\d+(?:\.\d+)?)?(?:px|%|ms|s)?\b)`,
    String.raw`(?<mark>→|…|\||[├└│●])`,
    String.raw`(?<status>\b(?:failed|passed)\b)`,
  ].join("|"),
  "g",
);

/** Colors the parts of a stretch of text it recognizes; the rest stays the block's text color. */
function inline(value) {
  const out = [];
  let at = 0;
  for (const m of value.matchAll(INLINE)) {
    if (m.index > at) out.push(text(value.slice(at, m.index)));
    const g = m.groups;
    if (g.url) out.push(span(g.url, color(C.string)));
    else if (g.merge) out.push(span(g.merge, color(C.keyword)));
    else if (g.label) out.push(span(g.label, color(C.bright, BOLD)));
    else if (g.tag) {
      out.push(span(g.tag, color(C.mark)), span(g.tagName, color(C.component)));
      if (g.tagEnd) out.push(span(g.tagEnd, color(C.mark)));
    } else if (g.quoted) out.push(span(g.quoted, color(C.string)));
    else if (g.hex) out.push(swatch(g.hex), span(g.hex, color(C.value)));
    else if (g.pkg) out.push(span(g.pkg, color(C.call, NOWRAP)));
    else if (g.path) out.push(span(g.path, color(C.string)));
    else if (g.count) {
      const n = Number.parseInt(g.count, 10);
      const hue = g.count.includes("error") ? C.error : g.count.includes("warning") ? C.warning : C.text;
      out.push(span(g.count, color(n === 0 ? C.dim : hue)));
    } else if (g.root) out.push(span("(", color(C.mark)), span(g.root.slice(1, -1), color(C.component)), span(")", color(C.mark)));
    else if (g.list) out.push(span(g.list, color(C.name)));
    else if (g.requiredBy) out.push(span(g.requiredBy, color(C.dim)));
    else if (g.level) out.push(span(g.level, color(C.keyword)));
    else if (g.num) out.push(span(g.num, color(C.value)));
    else if (g.mark) out.push(span(g.mark, color(C.mark)));
    else if (g.status) out.push(span(g.status, color(g.status === "failed" ? C.error : C.ok)));
    at = m.index + m[0].length;
  }
  if (at < value.length) out.push(text(value.slice(at)));
  return out;
}

// ─── Lines: what a whole line is ─────────────────────────────────────────────────────────────────────────────────────

const SEVERITY = { error: C.error, warning: C.warning, info: C.info };
const LINES = [
  // A diagnostic: severity, code, where, message.
  [
    /^(\s*)(error|warning|info)( )([a-z][\w-]*\/[\w.-]+)(?:( at )(\S+?))?(:)(.*)$/,
    (m) => [text(m[1]), span(m[2], color(SEVERITY[m[2]], BOLD)), text(m[3]), span(m[4], color(C.keyword)), ...(m[5] ? [span(m[5], color(C.dim)), span(m[6], color(C.dim))] : []), span(m[7], color(C.mark)), ...inline(m[8])],
  ],
  // A design checked: ✓, ✗, or skipped.
  [/^(\s*)(✓|✗)( .*)$/, (m) => [text(m[1]), span(m[2], color(m[2] === "✓" ? C.ok : C.error, BOLD)), ...inline(m[3])]],
  [/^(\s*)(- )(.*)$/, (m) => [text(m[1]), span(m[2], color(C.dim)), ...inline(m[3])]],
  // A thrown error.
  [/^(Error)((?: \[\w+\])?)(:?)( .*)?$/, (m) => [span(m[1], color(C.error, BOLD)), span(m[2], color(C.dim)), span(m[3], color(C.mark)), ...inline(m[4] ?? "")]],
  // A prefix like "[Elements]" before a message.
  [/^(\[[A-Z]\w*\])( .+)$/, (m) => [span(m[1], color(C.dim)), ...inline(m[2])]],
  // A file and position before a message: emails/welcome.tsx:3:34: …
  [/^([\w./-]+\.\w+)(:\d+:\d+)(:)(.*)$/, (m) => [span(m[1], color(C.string)), span(m[2], color(C.value)), span(m[3], color(C.mark)), ...inline(m[4])]],
  // A path or tag, then a description after a gap (a file tree, an annotated outline).
  [/^(\s*\S.*?)( {2,})(\S.*)$/, (m) => (/[/.<>]/.test(m[1]) ? [...inline(m[1]), text(m[2]), span(m[3], color(C.dim))] : null)],
  // An element in an outline: Email 600px: …
  [/^(\s*)([A-Z][A-Za-z]+)(?=$| \d| h\d|:| \[)(.*)$/, (m) => [text(m[1]), span(m[2], color(C.component)), ...inline(m[3])]],
  // An indented "name: value" (a CLI's details).
  [/^(\s+)([a-z][\w .()-]*?)(:)( .*)$/, (m) => [text(m[1]), span(m[2], color(C.name)), span(m[3], color(C.mark)), ...inline(m[4])]],
];

/** A plain-text email (what render() writes as text): its brand line, its headings in capitals, its links. */
function emailLine(value, isLast) {
  if (/^\[[^\]]+\]$/.test(value)) return [span(value, color(C.bright, BOLD))];
  const bare = value.replace(/\{\{[^}]+\}\}/g, "");
  if (/[A-Z]/.test(bare) && bare === bare.toUpperCase() && /^[\p{Lu}\d\s,.'!?&:#$-]+$/u.test(bare))
    return value.split(/(\{\{[^}]+\}\})/).map((part) => (part.startsWith("{{") ? span(part, color(C.keyword, BOLD)) : span(part, color(C.bright, BOLD + ";letter-spacing:.03em"))));
  if (isLast) return [span(value, color(C.dim))];
  const out = [];
  for (const part of value.split(/(\(https?:\/\/[^)]+\)|\{\{[^}]+\}\}| \| )/)) {
    if (!part) continue;
    if (part.startsWith("(http")) out.push(span("(", color(C.mark)), span(part.slice(1, -1), color(C.string)), span(")", color(C.mark)));
    else if (part.startsWith("{{")) out.push(span(part, color(C.keyword)));
    else if (part === " | ") out.push(span(part, color(C.mark)));
    else out.push(text(part));
  }
  return out;
}

const lineText = (node) => (node.type === "text" ? node.value : (node.children ?? []).map(lineText).join(""));

/** The transformer, for astro.config.mjs's shikiConfig. */
export function outputHighlight() {
  return {
    name: "hyper-output",
    line(node) {
      if (this.options.lang !== "text") return;
      const source = this.source;
      const isEmail = /^\[[^\]\n]+\]\n/.test(source.trimStart());
      const value = lineText(node);
      if (!value) return;
      let children = null;
      if (isEmail) {
        const last = source.trimEnd().split("\n").at(-1);
        children = emailLine(value, value === last);
      } else {
        for (const [re, build] of LINES) {
          const m = value.match(re);
          if (m && (children = build(m))) break;
        }
        children ??= inline(value);
      }
      // A long line wraps under its own text, past its indent, not back at the block's edge.
      const indent = value.match(/^\s*/)[0].length + 2;
      node.properties.style = `display:inline-block;width:100%;vertical-align:top;padding-left:${indent}ch;text-indent:-${indent}ch`;
      node.children = [{ type: "element", tagName: "span", properties: {}, children: children.filter((c) => c.type !== "text" || c.value) }];
    },
  };
}
