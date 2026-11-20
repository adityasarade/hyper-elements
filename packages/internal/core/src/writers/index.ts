import { checkDocument } from "../normalize";
import { checkTargetExpanded, resolveExpanded, type ResolvedDocument, type ResolvedNode } from "../resolve";
import { ElementsError, type Diagnostic } from "../diagnostics";
import { acceptPlugins, pluginChecks, pluginOutputChecks, type ElementsPlugin, type PluginsOption } from "../plugins";
import { expandDocument } from "../expand";
import { registryOf, type ComponentsOption } from "../registry";
import type { Target } from "../define";
import { checkAssetsOption, drawEmailFiles, renderEmail, svgsIn, type EmailAsset, type EmailOptions, type RenderedFile } from "./email";
import { emailSupport } from "./email/support";
import { overflow, pagedSupport } from "./shared/paged";
import { support } from "./shared/support";
import { pageBreakpoints, renderPage, type PageOptions } from "./page";
import { renderText } from "./plain-text";
import { prettyHtml } from "./shared/pretty";
import type { BlockMap } from "./shared/block-map";

export { checkAssetsOption, renderEmail, svgsIn, EMAIL_PHONE_MARGIN, type EmailHtml, type EmailOptions, type EmailAssetsOption, type Rasterizer, type RenderedFile, type SvgDrawing } from "./email";
export { renderPage, PAGE_PHONE_WIDTH, pagePhoneWidth, type PageHtml, type PageOptions } from "./page";
export { renderText, type TextOptions } from "./plain-text";
export { emailSupport } from "./email/support";
export { support } from "./shared/support";
export { overflow, pagedSupport } from "./shared/paged";
export { Stylesheet, CLASS_PREFIX, type Media } from "./shared/classes";
export { BLOCK_MAP_VERSION, type BlockMap, type BlockMapEntry } from "./shared/block-map";

export interface RenderOptions extends PageOptions, EmailOptions, PluginsOption {
  /** The HTML indented, for reading it; for sending, the compact HTML (white space may change how some email clients show it). */
  pretty?: boolean;
  /**
   * For tools that preview an Email: also return `blocks`, where each block is in `html` (its template path and the
   * UTF-8 byte offset just after its outermost element's tag name). The HTML is the same either way. Not with `pretty`.
   */
  blockMap?: boolean;
}

export interface RenderResult {
  /** The whole document, from `<!DOCTYPE html>`. */
  html: string;
  /** The plain-text version. */
  text: string;
  /** What goes in `<head>` and in `<body>`, and the body's own style: to embed the output in a page of your own. */
  head: string;
  body: string;
  bodyStyle: string;
  /** Warnings and notes (errors are thrown). */
  diagnostics: Diagnostic[];
  /** With `blockMap`, for an Email: where each block is in `html`. */
  blocks?: BlockMap;
  /**
   * For an Email with an Svg: the image files it links to (each Svg's SVG, and classic Outlook's PNG of it), named as
   * the HTML links to them under `assets.baseUrl`. Upload them there before sending.
   */
  files?: RenderedFile[];
}

/** renderTemplate()'s result: with the Svgs' files still to draw (finishRender() draws classic Outlook's). */
export type WrittenTemplate = RenderResult & { assets?: EmailAsset[] };

/**
 * What an Email's Svgs need of `assets`: an error where it's missing (email clients drop inline SVG, so each is a file
 * the email links to), and a warning where classic Outlook's PNG is left out (`rasterize: false`: it shows a hosted SVG
 * as a broken image).
 */
function svgAssetProblems(root: ResolvedNode, assets: EmailOptions["assets"]): Diagnostic[] {
  // Every Svg that draws something, hidden or not: each has its files (svgsIn).
  const svgs = svgsIn(root);
  if (!svgs.length) return [];
  const first = svgs[0]!;
  const at = { path: first.path, ...(first.id ? { nodeId: first.id } : {}) };
  if (!assets) {
    return [
      {
        code: "email/svg-assets",
        severity: "error",
        message: "An Svg in an Email is an image file the email links to, as email clients drop inline SVG: say where the files are hosted with render()'s assets option, and upload the files it returns",
        fix: 'render(email, { assets: { baseUrl: "https://cdn.example.com/email/", rasterize: pngRasterizer() } }), with pngRasterizer from @hyper-elements/react/image; then upload each of result.files to baseUrl',
        ...at,
      },
    ];
  }
  if (assets.rasterize === false) {
    return [
      {
        code: "email/svg-outlook",
        severity: "warning",
        message: "Classic Outlook (2019 in the real client) shows a hosted SVG as a broken image, and assets.rasterize is false: it gets no PNG of this Email's Svgs",
        fix: "rasterize: pngRasterizer(), with pngRasterizer from @hyper-elements/react/image",
        ...at,
      },
    ];
  }
  return [];
}

/**
 * A written template's files drawn: each Svg's SVG, and classic Outlook's PNG of it by `assets.rasterize`. What
 * render() returns; a template without Svgs is returned as it was written.
 */
export async function finishRender(written: WrittenTemplate, options: Pick<RenderOptions, "assets"> = {}): Promise<RenderResult> {
  const { assets, ...result } = written;
  if (!assets?.length || !options.assets) return result;
  return { ...result, files: await drawEmailFiles(assets, options.assets.rasterize) };
}

/** The output each root renders to, and whether its writer exists yet. */
const OUTPUTS: Record<string, { target: Target; ready: boolean; later?: string }> = {
  Page: { target: "web", ready: true },
  // Print HTML: a page writer's, each page a box of the paper's size.
  Document: { target: "web", ready: true },
  // A Canvas as HTML, to look at (@hyper-elements/react/image writes the image).
  Canvas: { target: "web", ready: true },
  Email: { target: "email", ready: true },
};

export interface Prepared {
  /** The template laid out, its custom components expanded; null where it has errors. */
  resolved: ResolvedDocument | null;
  /** The output its root renders to. */
  target: Target | null;
  /** Everything found: errors, warnings and notes. */
  diagnostics: Diagnostic[];
  /** The plugins passed that can run (their `checkOutput` runs on the written output). */
  plugins: ElementsPlugin[];
}

/**
 * What both validating and rendering do, once: the template checked, its
 * custom components expanded (each rendered once), checked against the output
 * its root says, laid out, and what that output can't do as asked found; then
 * what the plugins find on the laid-out tree (their `check`). What needs the
 * written output is left to rendering (their `checkOutput`).
 */
export function prepareTemplate(input: unknown, options: ComponentsOption & PluginsOption = {}): Prepared {
  const accepted = acceptPlugins(options.plugins);
  const registry = registryOf(options);
  const checked = checkDocument(input, registry);
  const diagnostics = [...checked.diagnostics];
  const failed = () => diagnostics.some((d) => d.severity === "error");
  if (!checked.document || failed()) return { resolved: null, target: null, diagnostics: [...diagnostics, ...accepted.diagnostics], plugins: accepted.plugins };
  const root = checked.document.root.type;
  /** What it found, then what core said about the plugins passed (their `check` runs only on a template laid out without errors). */
  const done = (resolved: ResolvedDocument | null, target: Target | null, checks: Diagnostic[] = []): Prepared => ({ resolved, target, diagnostics: [...diagnostics, ...accepted.diagnostics, ...checks], plugins: accepted.plugins });
  const output = OUTPUTS[root];
  if (!output?.ready) {
    diagnostics.push({ code: "output/unavailable", severity: "error", message: output?.later ?? `A ${root} can't be rendered yet`, path: "root" });
    return done(null, null);
  }
  const expanded = expandDocument(checked.document, registry, output.target);
  diagnostics.push(...expanded.diagnostics);
  if (failed()) return done(null, output.target);
  diagnostics.push(...checkTargetExpanded(expanded.document, output.target, registry, expanded.paths));
  if (failed()) return done(null, output.target);
  const resolved = resolveExpanded(expanded.document, registry, expanded.paths);
  diagnostics.push(...resolved.diagnostics);
  const found = output.target === "email" ? emailSupport(resolved.root) : support(resolved.root, output.target);
  // A Document's page and a Canvas are a fixed size: content that can't fit is cut off.
  if (root === "Document" || root === "Canvas") found.push(...overflow(resolved.root));
  found.push(...pageBreakpoints(resolved.root));
  diagnostics.push(...inTemplate(resolved, found));
  if (failed()) return done(null, output.target);
  return done(resolved, output.target, pluginChecks(accepted.plugins, resolved));
}

/** Diagnostics found on the tree as laid out, at their places in the template (a Grid's children, a custom component's). */
export function inTemplate(resolved: ResolvedDocument, diagnostics: Diagnostic[]): Diagnostic[] {
  const { templatePath } = resolved;
  return templatePath ? diagnostics.map((diagnostic) => ({ ...diagnostic, path: templatePath(diagnostic.path) })) : diagnostics;
}

/**
 * A template's problems, without writing it: errors make it invalid, warnings and notes don't. A Document's are its
 * PDF's too, and a Canvas's its image's (what they can't show that its HTML can).
 */
export function validateTemplate(input: unknown, options: ComponentsOption & PluginsOption = {}): { valid: boolean; diagnostics: Diagnostic[] } {
  const { diagnostics, resolved } = prepareTemplate(input, options);
  const root = resolved?.root;
  const paged = root?.type === "Document" ? pagedSupport(root, "pdf") : root?.type === "Canvas" ? pagedSupport(root, "image") : [];
  const all = [...diagnostics, ...(resolved ? inTemplate(resolved, paged) : paged)];
  return { valid: !all.some((d) => d.severity === "error"), diagnostics: all };
}

/**
 * A template (Elements' internal tree, with the custom components it uses)
 * rendered to the output its root says: prepared (`prepareTemplate`), then
 * written. Throws an `ElementsError` listing the errors if there are any.
 */
export function renderTemplate(input: unknown, options: RenderOptions & ComponentsOption = {}): WrittenTemplate {
  // Indenting rewrites the HTML after it's written, which would move every offset.
  if (options.blockMap && options.pretty) throw new ElementsError([{ code: "render/block-map-pretty", severity: "error", message: "blockMap gives offsets in the compact HTML; leave pretty off", path: "root" }]);
  const badAssets = checkAssetsOption(options.assets);
  if (badAssets.length) throw new ElementsError(badAssets);
  const { resolved, target, diagnostics, plugins } = prepareTemplate(input, options);
  if (!resolved) throw new ElementsError(diagnostics);
  const svgProblems = target === "email" ? inTemplate(resolved, svgAssetProblems(resolved.root, options.assets)) : [];
  if (svgProblems.some((d) => d.severity === "error")) throw new ElementsError([...diagnostics, ...svgProblems]);
  diagnostics.push(...svgProblems);
  const text = renderText(resolved, options);
  const written = target === "email" ? renderEmail(resolved, options) : { ...renderPage(resolved, options), stylesheet: "", diagnostics: [], assets: [] };
  // The plugins' checks on the written output, compact (what `pretty` would change isn't what an email client receives).
  const outputChecks = pluginOutputChecks(plugins, { root: resolved.root.type, html: written.html, head: written.head, body: written.body, stylesheet: written.stylesheet }, resolved);
  const shown = (html: string) => (options.pretty ? prettyHtml(html) : html);
  const blocks = "blocks" in written ? written.blocks : undefined;
  return {
    html: shown(written.html),
    head: shown(written.head),
    body: shown(written.body),
    bodyStyle: written.bodyStyle,
    text,
    diagnostics: [...diagnostics, ...inTemplate(resolved, written.diagnostics), ...outputChecks],
    ...(blocks ? { blocks } : {}),
    ...(written.assets.length ? { assets: written.assets } : {}),
  };
}
