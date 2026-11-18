// @vitest-environment node

/**
 * Properties are data: `prop`'s helpers and `defineProperty()` import only each other and the engine, never React or
 * the render that collects a design, so the same limits can check a value where nothing renders. Each file they
 * import, and each file those import (type imports too), is in this folder, and their one package is the engine. Used
 * where React can't load, they make and check props as they do anywhere.
 */
import { existsSync, readFileSync, statSync } from "fs";
import { dirname, relative, resolve, sep } from "path";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { defineProperty, prop } from ".";

// Loading React, or the render that collects a design, fails this file.
vi.mock("react", () => {
  throw new Error("React was loaded");
});
vi.mock("react-dom/server", () => {
  throw new Error("react-dom was loaded");
});
vi.mock("../collect", () => {
  throw new Error("The render that collects a design was loaded");
});

const HERE = __dirname;
const name = (file: string) => relative(HERE, file).split(sep).join("/");

function resolveImport(from: string, specifier: string): string {
  const base = resolve(dirname(from), specifier);
  const file = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"].map((end) => base + end).find((path) => existsSync(path) && statSync(path).isFile());
  if (!file) throw new Error(`${name(from)} imports ${specifier}, which isn't a file`);
  return file;
}

/** Each file `entry` imports, and each those import, with a file that imports it; each package, with a file that imports it. */
function importsOf(entry: string): { files: Map<string, string | null>; packages: Map<string, string> } {
  const files = new Map<string, string | null>();
  const packages = new Map<string, string>();
  const visit = (file: string, from: string | null) => {
    if (files.has(file)) return;
    files.set(file, from);
    for (const { fileName } of ts.preProcessFile(readFileSync(file, "utf8"), true, true).importedFiles) {
      if (fileName.startsWith(".")) visit(resolveImport(file, fileName), file);
      else if (!packages.has(fileName)) packages.set(fileName, file);
    }
  };
  visit(entry, null);
  return { files, packages };
}

describe("properties' imports", () => {
  const { files, packages } = importsOf(resolve(HERE, "index.ts"));

  it("are this folder's files", () => {
    const outside = [...files].filter(([file]) => name(file).startsWith(".."));
    expect(outside.map(([file, from]) => `${name(from!)} → ${name(file)}`)).toEqual([]);
    expect([...files.keys()].map(name)).toEqual(expect.arrayContaining(["index.ts", "prop.ts", "define.ts"]));
  });

  it("import the engine and no other package", () => {
    const others = [...packages].filter(([specifier]) => specifier !== "@hyper-elements/core");
    expect(others.map(([specifier, file]) => `${name(file)} → ${specifier}`)).toEqual([]);
    expect([...packages.keys()]).toEqual(["@hyper-elements/core"]);
  });
});

describe("properties where React can't load", () => {
  it("make a team's own property on one of prop's helpers, with its options checked and defaulted", () => {
    const accentColor = defineProperty({
      name: "acme.accentColor",
      base: prop.color,
      options: { palette: prop.text({ enum: ["soft", "bold"], default: "soft" }) },
    });
    const background = accentColor({ label: "Background", default: "#fff4bf", transparency: false });
    expect(background).toMatchObject({ label: "Background", default: "#fff4bf", editor: { name: "acme.accentColor", options: { palette: "soft" } } });
    expect(background.kind.parse("#123456")).toMatchObject({ ok: true, value: "#123456" });
    expect(background.kind.parse("transparent").ok).toBe(false);
    expect(() => accentColor({ label: "Background", palette: "loud" as "soft" })).toThrow(/acme\.accentColor: its palette/);
  });

  it("check a list's items by their own limits", () => {
    const items = prop.list(prop.text({ label: "Item", maxLength: 3 }), { label: "Items", max: 2 });
    expect(items.kind.parse(["abc", "de"])).toMatchObject({ ok: true });
    expect(items.kind.parse(["abcd"]).ok).toBe(false);
    expect(items.kind.parse(["a", "b", "c"]).ok).toBe(false);
  });
});
