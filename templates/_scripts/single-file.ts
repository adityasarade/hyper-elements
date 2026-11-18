/**
 * One self-contained file per template and brand, for anyone to copy: the `Brand` type written locally, the brand's
 * block between `// brand: start` and `// brand: end`, the category's and the kit's parts' declarations inlined, the
 * imports merged (React's and Elements' only), and `export default <factory>(brand);` at the end.
 *
 * It relies on the folder's grammar (templates/CONTRIBUTING.md): named declarations only in categories and parts, no
 * renamed imports, no colliding names, and a brand file of one `export const brand: Brand = { … }`.
 *
 *   pnpm --filter ./templates single-file <kit>/<root folder>/<category> <brand> [out-file]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { ROOT } from "./assets";

const PACKAGE = /^(react|@hyper-elements\/[a-z-]+(\/[a-z-]+)?)$/;

interface Imports {
  /** By module: its named values, and its named types. */
  values: Map<string, Set<string>>;
  types: Map<string, Set<string>>;
}

const parse = (file: string) => ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

/** A file's package imports, added to `into`, and its local imports by resolved path. */
function importsOf(source: ts.SourceFile, into: Imports): string[] {
  const local: string[] = [];
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const from = (statement.moduleSpecifier as ts.StringLiteral).text;
    const clause = statement.importClause;
    if (!PACKAGE.test(from)) {
      local.push(resolve(dirname(source.fileName), from));
      continue;
    }
    if (!clause || clause.name || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) throw new Error(`${source.fileName}: import named bindings only from ${from}`);
    for (const element of clause.namedBindings.elements) {
      if (element.propertyName) throw new Error(`${source.fileName}: no renamed imports (${element.propertyName.text} as ${element.name.text})`);
      const typeOnly = clause.isTypeOnly || element.isTypeOnly;
      const map = typeOnly ? into.types : into.values;
      if (!map.has(from)) map.set(from, new Set());
      map.get(from)!.add(element.name.text);
    }
  }
  return local;
}

/** A file's statements but its imports, with `export` taken off (and `export default` off a function). */
function bodyOf(source: ts.SourceFile): { text: string; defaultName?: string } {
  const text = source.getFullText();
  const parts: string[] = [];
  let defaultName: string | undefined;
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) continue;
    let chunk = text.slice(statement.getFullStart(), statement.getEnd());
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
    const isDefault = modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (isDefault) {
      if (!ts.isFunctionDeclaration(statement) || !statement.name) throw new Error(`${source.fileName}: the default export is a named function`);
      defaultName = statement.name.text;
      chunk = chunk.replace(/export\s+default\s+function/, "function");
    } else {
      chunk = chunk.replace(/^(\s*(?:\/\*\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*)export\s+/, "$1");
    }
    parts.push(chunk);
  }
  return { text: parts.join("").replace(/^\n+/, ""), ...(defaultName ? { defaultName } : {}) };
}

/** The brand's block: its one declaration as `const brand: Brand = { … };`, between the markers. */
export function brandBlock(brandFile: string, into?: Imports): string {
  const source = parse(brandFile);
  if (into) importsOf(source, into);
  const declarations = source.statements.filter((s) => !ts.isImportDeclaration(s));
  const statement = declarations[0];
  if (declarations.length !== 1 || !statement || !ts.isVariableStatement(statement)) throw new Error(`${brandFile}: a brand file is one \`export const brand: Brand = { … }\``);
  const declaration = statement.declarationList.declarations[0];
  if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "brand" || !declaration.initializer) throw new Error(`${brandFile}: the declaration is \`brand\``);
  return `// brand: start (replace with your own; every value below is used)\nconst brand: Brand = ${declaration.initializer.getText(source)};\n// brand: end`;
}

/** `_brand.ts`'s `BrandFont` and `Brand` types, as the file declares them. */
function brandTypes(into: Imports): string {
  const source = parse(join(ROOT, "_brand.ts"));
  importsOf(source, into);
  const text = source.getFullText();
  return source.statements
    .filter((s): s is ts.TypeAliasDeclaration => ts.isTypeAliasDeclaration(s) && ["BrandFont", "Brand"].includes(s.name.text))
    .map((s) => text.slice(s.getFullStart(), s.getEnd()).replace(/^(\s*(?:\/\*\*[\s\S]*?\*\/\s*)?)export\s+/, "$1").trim())
    .join("\n\n");
}

/** What a template's file holds apart from a brand: its imports, the category's and the kit's parts' declarations,
 * and its own body. */
function templatePieces(templateFile: string): { imports: Imports; inlined: string[]; body: string; defaultName: string } {
  const imports: Imports = { values: new Map(), types: new Map() };
  const template = parse(templateFile);
  const locals = importsOf(template, imports);
  const inlined: string[] = [];
  for (const local of locals) {
    const file = [local, `${local}.ts`, `${local}.tsx`].find((f) => /\.(tsx?)$/.test(f) && safeRead(f));
    if (!file) throw new Error(`${templateFile}: can't find ${local}`);
    if (resolve(file) === resolve(ROOT, "_brand.ts")) continue;
    const source = parse(file);
    const nested = importsOf(source, imports).filter((path) => resolve(`${path}.ts`) !== resolve(ROOT, "_brand.ts"));
    if (nested.length) throw new Error(`${file}: a category or a kit's parts import only packages and _brand.ts`);
    inlined.push(`// From ${relative(ROOT, file)}\n${bodyOf(source).text.trim()}`);
  }
  const { text: body, defaultName } = bodyOf(template);
  if (!defaultName) throw new Error(`${templateFile}: no default export`);
  return { imports, inlined, body: body.trim(), defaultName };
}

/** The import lines for what `imports` holds: React's first, then by module. */
function importLines(imports: Imports): string {
  const lines: string[] = [];
  const modules = [...new Set([...imports.values.keys(), ...imports.types.keys()])].sort((a, b) => (a === "react" ? -1 : b === "react" ? 1 : a.localeCompare(b)));
  for (const from of modules) {
    const values = [...(imports.values.get(from) ?? [])].sort();
    const typeNames = [...(imports.types.get(from) ?? [])].filter((name) => !values.includes(name)).sort();
    if (values.length) lines.push(`import { ${values.join(", ")} } from "${from}";`);
    if (typeNames.length) lines.push(`import type { ${typeNames.join(", ")} } from "${from}";`);
  }
  return lines.join("\n");
}

/** The copyable file for a template (`<kit>/<root folder>/<category>.tsx`) in a brand (a brand file). */
export function singleFile(templateFile: string, brandFile: string): string {
  const { imports, inlined, body, defaultName } = templatePieces(templateFile);
  const types = brandTypes(imports);
  const block = brandBlock(brandFile, imports);
  const header = `// ${relative(ROOT, templateFile)}, from hyperelements.dev/templates. Replace the brand block with your own brand.`;
  return [header, importLines(imports), types, block, ...inlined, `// The template\n${body}`, `export default ${defaultName}(brand);`].join("\n\n") + "\n";
}

/** The same template as two files: its code, which imports the brand from `./brand`, and that `brand.ts`. Together
 * they're the single file, with the brand kept apart (what a template's page shows first). */
export function splitFiles(templateFile: string, brandFile: string): { code: string; brand: string } {
  const { imports, inlined, body, defaultName } = templatePieces(templateFile);
  const header = `// ${relative(ROOT, templateFile)}, from hyperelements.dev/templates. Your brand is in ./brand.ts.`;
  const code = [header, `${importLines(imports)}\nimport { brand, type Brand } from "./brand";`, ...inlined, `// The template\n${body}`, `export default ${defaultName}(brand);`].join("\n\n") + "\n";
  const brandImports: Imports = { values: new Map(), types: new Map() };
  const types = brandTypes(brandImports).replace(/^((?:\/\*\*[\s\S]*?\*\/\s*)?)type /gm, "$1export type ");
  const block = brandBlock(brandFile, brandImports)
    .replace("const brand: Brand", "export const brand: Brand")
    .replace(/^\/\/ brand: (start|end).*\n?/gm, "")
    .trim();
  const brand = [`// brand.ts: your brand, which the template draws in. Every value below is used.`, importLines(brandImports), types, block].join("\n\n") + "\n";
  return { code, brand };
}

function safeRead(file: string): boolean {
  try {
    readFileSync(file);
    return true;
  } catch {
    return false;
  }
}

/** The text between a file's markers, replaced with another brand's block: what the playground's Brand menu does. */
export function swapBrand(file: string, block: string): string {
  const start = file.indexOf("// brand: start");
  const end = file.indexOf("// brand: end");
  if (start < 0 || end < start) throw new Error("no brand block");
  return file.slice(0, start) + block + file.slice(end + "// brand: end".length);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(ROOT, "_scripts", "single-file.ts")) {
  const [path, brandId, out] = process.argv.slice(2);
  if (!path || !brandId) throw new Error("usage: single-file <kit>/<root folder>/<category> <brand> [out-file]");
  const file = singleFile(join(ROOT, `${path}.tsx`), join(ROOT, "_brands", `${brandId}.ts`));
  if (out) writeFileSync(out, file);
  else process.stdout.write(file);
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** A value as a JavaScript literal: keys unquoted where they can be, on one line where it's short. */
function literal(value: unknown, indent: string): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return String(value);
  if (Array.isArray(value)) {
    const items = value.map((v) => literal(v, `${indent}  `));
    const line = `[${items.join(", ")}]`;
    return line.length <= 72 && !line.includes("\n") ? line : `[\n${items.map((i) => `${indent}  ${i},`).join("\n")}\n${indent}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    const items = entries.map(([k, v]) => `${IDENTIFIER.test(k) ? k : JSON.stringify(k)}: ${literal(v, `${indent}  `)}`);
    const line = `{ ${items.join(", ")} }`;
    return line.length <= 72 && !line.includes("\n") ? line : `{\n${items.map((i) => `${indent}  ${i},`).join("\n")}\n${indent}}`;
  }
  throw new Error(`can't write ${typeof value} as a literal`);
}

/** The component's name a design imports a template by: its category, in PascalCase ("sign-in-code" is SignInCode). */
export const componentName = (category: string) => category.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

/** A design made from a template: the template as its root, the values as its props, as a person or an agent writes
 * one (the brand-templates skill's step 2). It imports the template from `./<category>`. */
export function designFile(category: string, values: Record<string, unknown>): string {
  const name = componentName(category);
  const props = Object.entries(values)
    .filter(([, v]) => v !== undefined)
    .map(([key, v]) => (typeof v === "string" && !/["{}<>\n&]/.test(v) ? `${key}="${v}"` : `${key}={${literal(v, "    ")}}`));
  return [
    `// design.tsx: a design made from the template, its fields as props. Check it, then render it:`,
    `//   npx hyper-elements check design.tsx`,
    `//   npx hyper-elements render design.tsx`,
    "",
    `import ${name} from "./${category}";`,
    "",
    `export default () => (`,
    `  <${name}`,
    ...props.map((p) => `    ${p}`),
    `  />`,
    `);`,
    "",
  ].join("\n");
}
