/**
 * Rules over the result, which fail closed. A template requires lint rules and core codes, limits its links and
 * requires root props; each required rule ends `passed`, `failed` or `not-run`, and one that didn't run never counts as
 * passed. What can be refused when the template is defined is refused then (`template/rule-unavailable`).
 */
import type { Diagnostic, ElementsPlugin, ResolvedNode, RootName } from "@hyper-elements/core";

/** What lint's plugin says of each rule (lint 0.2): `lint().rules`. */
export interface LintRuleDescriptor {
  readonly id: string;
  readonly roots: readonly string[];
  readonly enabled: boolean;
  readonly summary: string;
  readonly fix: string;
}

export interface LinkRules {
  /** The hosts an http(s) link may go to: `acme.com`, or `*.acme.com` for its subdomains. */
  domains?: readonly string[];
  /** Query parameters every http(s) link carries, with their values. */
  params?: Readonly<Record<string, string>>;
  /** Schemes besides http(s) a link may use (`mailto`, `tel`). */
  schemes?: readonly string[];
  /** A sending service's tag in a URL (`{{…}}`): listed for review (`"allow"`, the default) or refused (`"deny"`). */
  tags?: "allow" | "deny";
}

export interface TemplateRules {
  plugins?: { lint?: ElementsPlugin; other?: readonly ElementsPlugin[] };
  require?: { lint?: readonly string[]; core?: readonly string[] };
  links?: LinkRules;
  /** Root props a design must set: `{ lang: true, previewText: true }`. */
  root?: Readonly<Record<string, true>>;
}

/** A required rule's result in one format. */
export interface RuleResult {
  rule: string;
  source: "lint" | "core" | "template";
  format?: string;
  status: "passed" | "failed" | "not-run";
  diagnostics: Diagnostic[];
}

/** The core codes a template can require: the stage that decides each and the roots it runs for. */
export const CORE_RULES: Readonly<Record<string, { stage: "read" | "measured"; roots: readonly RootName[] }>> = Object.freeze({
  "layout/overflow": { stage: "read", roots: ["Email", "Page", "Document", "Canvas"] },
  "layout/shrunk": { stage: "read", roots: ["Email", "Page", "Document", "Canvas"] },
  "document/overflow": { stage: "read", roots: ["Document"] },
  "canvas/overflow": { stage: "read", roots: ["Canvas"] },
  "image/overflow": { stage: "measured", roots: ["Canvas"] },
  "image/glyph": { stage: "measured", roots: ["Canvas"] },
  "image/fit": { stage: "measured", roots: ["Canvas"] },
});

const unavailable = (message: string, path: string): Diagnostic => ({ code: "template/rule-unavailable", severity: "error", message, path });
const LINT_ROOTS: readonly RootName[] = ["Email", "Page"];

/** A template's rules checked when it's defined, and owned: frozen copies, so they can't be emptied or widened later. */
export function readRules(given: TemplateRules | undefined, root: RootName, id: string): { rules: TemplateRules; problems: Diagnostic[] } {
  const problems: Diagnostic[] = [];
  if (given === undefined) return { rules: Object.freeze({}), problems };
  if (typeof given !== "object" || given === null) return { rules: Object.freeze({}), problems: [{ code: "template/spec", severity: "error", message: "rules is { plugins, require, links, root }", path: "rules" }] };
  const lint = given.plugins?.lint;
  const other = [...(given.plugins?.other ?? [])];
  for (const [i, plugin] of other.entries()) {
    if (plugin && typeof (plugin as { then?: unknown }).then === "function") problems.push({ code: "template/plugin", severity: "error", message: "A plugin in rules.plugins.other is a Promise: await it first (emailClients() is async)", path: `rules.plugins.other[${i}]` });
  }
  const descriptors = (lint as { rules?: readonly LintRuleDescriptor[] } | undefined)?.rules;
  for (const [i, rule] of (given.require?.lint ?? []).entries()) {
    const at = `rules.require.lint[${i}]`;
    if (!lint) problems.push(unavailable(`${id} requires the lint rule ${rule}, but rules.plugins.lint isn't given: add lint() from @hyper-elements/lint`, at));
    else if (!descriptors) problems.push(unavailable(`The lint given doesn't describe its rules (lint 0.2 does): requiring ${rule} can't be checked`, at));
    else {
      const found = descriptors.find((d) => d.id === rule);
      if (!found) problems.push(unavailable(`Lint has no rule ${JSON.stringify(rule)}`, at));
      else if (!LINT_ROOTS.includes(root) || !found.roots.includes(root)) problems.push(unavailable(`Lint's ${rule} doesn't run on a ${root}${LINT_ROOTS.includes(root) ? "" : " (lint checks Emails and Pages)"}`, at));
      else if (!found.enabled) problems.push(unavailable(`Lint's ${rule} is off as lint() is configured${rule === "unsubscribe" ? ' (it runs with kind: "marketing")' : ""}`, at));
    }
  }
  for (const [i, code] of (given.require?.core ?? []).entries()) {
    const known = CORE_RULES[code];
    if (!known) problems.push(unavailable(`${JSON.stringify(code)} isn't a code a template can require (${Object.keys(CORE_RULES).join(", ")})`, `rules.require.core[${i}]`));
    else if (!known.roots.includes(root)) problems.push(unavailable(`${code} doesn't run on a ${root} (it runs on ${known.roots.join(", ")})`, `rules.require.core[${i}]`));
  }
  const links = given.links;
  if (links?.tags !== undefined && links.tags !== "allow" && links.tags !== "deny") problems.push({ code: "template/spec", severity: "error", message: 'rules.links.tags is "allow" or "deny"', path: "rules.links.tags" });
  for (const [i, domain] of (links?.domains ?? []).entries()) {
    if (typeof domain !== "string" || !/^(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain)) problems.push({ code: "template/spec", severity: "error", message: `A domain is a host (acme.com) or its subdomains (*.acme.com), not ${JSON.stringify(domain)}`, path: `rules.links.domains[${i}]` });
  }
  const freeze = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
  const rules: TemplateRules = Object.freeze({
    ...(lint || other.length ? { plugins: Object.freeze({ ...(lint ? { lint } : {}), ...(other.length ? { other: Object.freeze(other) } : {}) }) } : {}),
    ...(given.require ? { require: deepFreeze(freeze({ lint: given.require.lint ?? [], core: given.require.core ?? [] })) } : {}),
    ...(links ? { links: deepFreeze(freeze(links)) } : {}),
    ...(given.root ? { root: deepFreeze(freeze(given.root)) } : {}),
  });
  return { rules, problems };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

/** The plugins `validate()` runs a template's design with: its lint, and the rest. */
export const pluginsOf = (rules: TemplateRules): ElementsPlugin[] => [...(rules.plugins?.lint ? [rules.plugins.lint] : []), ...(rules.plugins?.other ?? [])];

/** Whether lint failed in a run (it threw, or what it returned was thrown out): its required rules then didn't run. */
const lintFailed = (diagnostics: readonly Diagnostic[]) => diagnostics.some((d) => (d.code === "plugin/failed" || d.code === "plugin/invalid") && /\blint\b/.test(d.message));

/**
 * The required rules decided over one format's design: lint's findings and core's read-stage codes from `validate()`,
 * links and root props from the laid-out tree. A finding of a required rule is raised to an error; a measured rule is
 * `not-run` (a note), which a writer refuses until the image entry decides it.
 */
export function decideRules(
  rules: TemplateRules,
  context: { id: string; root: RootName; format?: string; validated: readonly Diagnostic[]; laidOut: ResolvedNode | null }
): { results: RuleResult[]; diagnostics: Diagnostic[]; raised: Set<Diagnostic> } {
  const results: RuleResult[] = [];
  const raised = new Set<Diagnostic>();
  const extra: Diagnostic[] = [];
  const by = `(required by ${context.id})`;
  const raise = (d: Diagnostic): Diagnostic => {
    const up = { ...d, severity: "error" as const, message: `${d.message} ${by}` };
    raised.add(d);
    return up;
  };
  const failedLint = lintFailed(context.validated);
  for (const rule of rules.require?.lint ?? []) {
    if (failedLint) {
      const d: Diagnostic = { code: "template/rule-not-run", severity: "error", message: `Lint didn't run, so the rule ${rule} ${by} isn't decided`, path: "rules" };
      results.push({ rule, source: "lint", ...(context.format ? { format: context.format } : {}), status: "not-run", diagnostics: [d] });
      extra.push(d);
      continue;
    }
    const code = `${context.root.toLowerCase()}/lint-${rule}`;
    const found = context.validated.filter((d) => d.code === code).map(raise);
    results.push({ rule, source: "lint", ...(context.format ? { format: context.format } : {}), status: found.length ? "failed" : "passed", diagnostics: found });
    extra.push(...found);
  }
  for (const code of rules.require?.core ?? []) {
    const known = CORE_RULES[code];
    if (known?.stage === "measured") {
      const d: Diagnostic = { code: "template/rule-not-run", severity: "info", message: `${code} ${by} is decided when the image is measured: renderImage() of this snapshot, or checkLayout()`, path: "rules" };
      results.push({ rule: code, source: "core", ...(context.format ? { format: context.format } : {}), status: "not-run", diagnostics: [d] });
      extra.push(d);
      continue;
    }
    const found = context.validated.filter((d) => d.code === code).map(raise);
    results.push({ rule: code, source: "core", ...(context.format ? { format: context.format } : {}), status: found.length ? "failed" : "passed", diagnostics: found });
    extra.push(...found);
  }
  if (rules.links && context.laidOut) {
    const found = linkProblems(rules.links, context.laidOut, context.id);
    results.push({ rule: "links", source: "template", ...(context.format ? { format: context.format } : {}), status: found.some((d) => d.severity === "error") ? "failed" : "passed", diagnostics: found });
    extra.push(...found);
  }
  if (rules.root && context.laidOut) {
    const found = Object.keys(rules.root)
      .filter((key) => {
        const value = context.laidOut!.props[key];
        return value === undefined || value === null || value === "";
      })
      .map((key): Diagnostic => ({ code: "template/root-prop", severity: "error", message: `${context.id} requires the ${context.root}'s ${key}`, path: `root.props.${key}` }));
    results.push({ rule: "root", source: "template", ...(context.format ? { format: context.format } : {}), status: found.length ? "failed" : "passed", diagnostics: found });
    extra.push(...found);
  }
  return { results, diagnostics: extra, raised };
}

// ─── Links ──────────────────────────────────────────────────────────────────

const SERVICE_TAG = /<%[\s\S]*?%>|\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/;

/** Whether a host matches a domain rule: `acme.com` itself, or `*.acme.com`'s subdomains (one label or more). */
export function hostMatches(host: string, domain: string): boolean {
  const rule = domain.toLowerCase();
  if (rule.startsWith("*.")) {
    const base = rule.slice(2);
    return host.endsWith(`.${base}`) && host.length > base.length + 1;
  }
  return host === rule;
}

/** Every link a laid-out tree writes (a prop of the link or video kind), after expansion (a Menu's, a Social's), with its path. */
function linksOf(node: ResolvedNode, out: Array<{ href: string; path: string }> = []): Array<{ href: string; path: string }> {
  for (const [key, spec] of Object.entries(node.definition.props)) {
    const kind = spec.kind.name;
    if (kind !== "link" && kind !== "video") continue;
    const value = node.props[key];
    if (value === undefined || value === null) continue;
    const href = typeof value === "string" ? value : typeof value === "object" && !Array.isArray(value) ? (value as { href?: unknown; src?: unknown }).href : undefined;
    if (typeof href === "string") out.push({ href, path: `${node.path}.props.${key}` });
  }
  for (const child of node.children) if (typeof child !== "string") linksOf(child, out);
  return out;
}

export function linkProblems(rules: LinkRules, root: ResolvedNode, id: string): Diagnostic[] {
  const out: Diagnostic[] = [];
  const fail = (code: string, message: string, path: string) => out.push({ code, severity: "error", message: `${message} (required by ${id})`, path });
  for (const { href, path } of linksOf(root)) {
    if (SERVICE_TAG.test(href)) {
      if (rules.tags === "deny") fail("template/link-tag", `${JSON.stringify(href)} holds a sending service's tag, which ${id} refuses: its URL can't be checked until the service fills it`, path);
      else out.push({ code: "template/link-tag", severity: "info", message: `${JSON.stringify(href)} holds a sending service's tag: its URL is checked by the service that fills it, not by ${id}'s link rules`, path });
      continue;
    }
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(href)?.[1]?.toLowerCase();
    if (!scheme) {
      fail("template/link-relative", `${JSON.stringify(href)} isn't an absolute URL: an email's links are`, path);
      continue;
    }
    if (scheme !== "http" && scheme !== "https") {
      if (!(rules.schemes ?? []).map((s) => s.toLowerCase()).includes(scheme)) fail("template/link-scheme", `A ${scheme}: link isn't one ${id} takes (${["http", "https", ...(rules.schemes ?? [])].join(", ")})`, path);
      continue;
    }
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      fail("template/link-domain", `${JSON.stringify(href)} isn't a URL`, path);
      continue;
    }
    if (rules.domains) {
      if (url.username || url.password) fail("template/link-domain", `${JSON.stringify(href)} carries credentials (user@host): ${id}'s links go to ${rules.domains.join(", ")}`, path);
      else if (!rules.domains.some((domain) => hostMatches(url.hostname, domain))) fail("template/link-domain", `${url.hostname} isn't one of ${id}'s domains (${rules.domains.join(", ")})`, path);
    }
    for (const [name, value] of Object.entries(rules.params ?? {})) {
      const given = url.searchParams.get(name);
      if (given !== value) fail("template/link-param", `${JSON.stringify(href)} ${given === null ? `has no ${name}` : `has ${name}=${given}`}; ${id}'s links carry ${name}=${value}`, path);
    }
  }
  return out;
}
