/**
 * Where a caret goes on a Document's pages (caretAt(), caretBox()) and what a selection covers (selectionBoxes()), from
 * a paginator's layout with its lines: each line where its PDF draws it, read back with pdf.js, and each character
 * where it's drawn (the measuring test holds every character's edges to react-pdf's own, drawn).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ReactElement } from "react";
import { Button, Document, List, ListItem, PageHeader, Section, Span, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { caretAt, caretBox, createPaginator, renderPdf, selectionBoxes, type DocumentLayout, type DocumentLine, type DocumentNode } from "../../src/pdf";
import { arabic, arabicSentences } from "./arabic";
import { glyphs } from "./operators";

const sentences = (count: number, what: string) => Array.from({ length: count }, (_, i) => `Sentence ${i + 1} of ${what}.`).join(" ");
const liberation = new Uint8Array(readFileSync(join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts", "LiberationSans-Regular.ttf")));
const fonts = [
  { family: "Noto Arabic", src: arabic },
  { family: "Liberation", src: liberation },
];

/** A Document with text of each kind a caret goes in: every alignment, a paragraph across pages, a list, a table, a button. */
const report = (
  <Document>
    <PageHeader>
      <Text style={{ fontSize: 10 }}>Quarterly report</Text>
    </PageHeader>
    {(["left", "center", "right", "justify"] as const).map((textAlign) => (
      <Text key={textAlign} style={{ textAlign }}>
        {sentences(8, textAlign)} <Span style={{ fontWeight: 700 }}>In bold.</Span> {sentences(3, `${textAlign}, after`)}
      </Text>
    ))}
    <Text style={{ textAlign: "justify" }}>{sentences(200, "one long paragraph")}</Text>
    <List type="number">
      <ListItem>{sentences(6, "a list item")}</ListItem>
    </List>
    <Table>
      <TableRow>
        <TableCell>{sentences(3, "a cell")}</TableCell>
        <TableCell>$1.00</TableCell>
      </TableRow>
    </Table>
    <Section>
      <Button href="https://example.com">Read more</Button>
    </Section>
  </Document>
);

const laidOut = async (design: ReactElement): Promise<DocumentLayout> => (await (await createPaginator({ fonts })).paginate(design, { layout: true })).layout!;
const lined = (layout: DocumentLayout) => layout.nodes.filter((node): node is DocumentNode & { lineBoxes: DocumentLine[]; text: string } => !!node.lineBoxes);
/** px in PDF points. */
const pt = (px: number) => px * 0.75;

describe("a paginator's layout with its lines", () => {
  it("has each character where its PDF draws it: the caret before it where its glyph starts", async () => {
    const layout = await laidOut(report);
    const { pdf } = await renderPdf(report, { fonts });
    const document = await getDocument({ data: pdf.slice(), useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise;
    const nodes = lined(layout);
    // Each kind has its lines: the paragraphs, the one across pages on each, the list item's, the cell's, the button's.
    expect(new Set(nodes.map((node) => node.type))).toEqual(new Set(["Text", "ListItem", "TableCell", "Button"]));
    expect(nodes.some((node) => node.part > 0)).toBe(true);
    let checked = 0;
    for (let n = 1; n <= document.numPages; n++) {
      const drawn = await glyphs(await document.getPage(n));
      for (const node of nodes.filter((node) => node.page === n)) {
        for (const line of node.lineBoxes) {
          const words = node.text.slice(line.start, line.end).trimEnd();
          if (!words) continue;
          // The glyphs on its baseline, across it, left to right: its characters (a space it ends in, or a hyphen where a
          // word is broken, after them).
          const on = drawn.filter((glyph) => Math.abs(glyph.baseline - pt(line.baseline)) < 0.3 && glyph.x >= pt(line.x) - 0.5 && glyph.x <= pt(line.x + line.width) + 0.5).sort((a, b) => a.x - b.x);
          expect([words, `${words}-`], `${node.path} on page ${n}`).toContain(on.map((glyph) => glyph.text).join("").trimEnd());
          words.split("").forEach((_, i) => {
            const caret = caretBox(layout, { path: node.path, offset: line.start + i, page: n })!;
            expect(Math.abs(pt(caret.x) - on[i].x), `${node.path} on page ${n}, character ${line.start + i}`).toBeLessThan(0.05);
          });
          checked += words.length;
        }
      }
    }
    expect(checked).toBeGreaterThan(5000);
  });

  it("puts a caret at a place back where it's drawn, at each offset of each line (caretAt() of caretBox())", async () => {
    const layout = await laidOut(report);
    for (const node of lined(layout)) {
      for (const line of node.lineBoxes) {
        for (let offset = line.start; offset <= line.end; offset++) {
          const box = caretBox(layout, { path: node.path, offset, page: node.page })!;
          const back = caretAt(layout, { page: box.page, x: box.x, y: box.y + box.height / 2 })!;
          expect(back.path).toBe(node.path);
          // The offset it's at, or one drawn in the same place (where a line's spaces end it, or a run meets the next).
          expect(caretBox(layout, { ...back, page: box.page })!.x, `${node.path} at ${offset}`).toBeCloseTo(box.x, 1);
        }
      }
    }
  });

  it("puts the caret at the start of the next line after a line's last character, or (affinity before) at the end of its own", async () => {
    const layout = await laidOut(report);
    const node = lined(layout).find((node) => node.text.startsWith("Sentence 1 of left"))!;
    const [first, second] = node.lineBoxes;
    expect(first.end).toBe(second.start);
    const after = caretBox(layout, { path: node.path, offset: first.end })!;
    const before = caretBox(layout, { path: node.path, offset: first.end, affinity: "before" })!;
    expect(after).toEqual({ page: 1, x: second.x, y: second.y, height: second.height });
    expect(before.y).toBe(first.y);
    expect(before.x).toBeGreaterThan(second.x + 100);
    // On the next page, where a paragraph goes on: its first line there.
    const long = lined(layout).filter((node) => node.text.startsWith("Sentence 1 of one long"));
    expect(long.length).toBeGreaterThan(1);
    const [here, next] = long;
    const end = here.lineBoxes[here.lineBoxes.length - 1].end;
    expect(caretBox(layout, { path: here.path, offset: end })!.page).toBe(next.page);
    expect(caretBox(layout, { path: here.path, offset: end, affinity: "before" })!.page).toBe(here.page);
  });

  it("selects a stretch of text: a box on each line it's on, from caret to caret, across pages", async () => {
    const layout = await laidOut(report);
    const node = lined(layout).find((node) => node.text.startsWith("Sentence 1 of left"))!;
    const [first, second] = node.lineBoxes;
    // "Sentence 2" on the first line: from its caret to its caret.
    const from = node.text.indexOf("Sentence 2");
    const [box] = selectionBoxes(layout, { path: node.path, start: from, end: from + "Sentence 2".length });
    expect(box.x).toBe(caretBox(layout, { path: node.path, offset: from })!.x);
    expect(box.x + box.width).toBeCloseTo(caretBox(layout, { path: node.path, offset: from + "Sentence 2".length })!.x, 1);
    expect(box.y).toBe(first.y);
    // From the first line's middle into the second: two boxes.
    const across = selectionBoxes(layout, { path: node.path, start: from, end: second.start + 5 });
    expect(across.map(({ y }) => y)).toEqual([first.y, second.y]);
    // The long paragraph, all of it: a box on each of its lines on each page.
    const long = lined(layout).filter((node) => node.text.startsWith("Sentence 1 of one long"));
    const all = selectionBoxes(layout, { path: long[0].path, start: 0, end: long[0].text.length });
    expect(all.length).toBe(long.reduce((sum, node) => sum + node.lineBoxes.length, 0));
    expect(new Set(all.map((box) => box.page))).toEqual(new Set(long.map((node) => node.page)));
  });

  it("puts a caret in text written right to left from its right, English words in it left to right, each where it's drawn", async () => {
    const words = `${arabicSentences(1)} PDF ${arabicSentences(1, 2)}`;
    const design = (
      <Document dir="rtl" style={{ fontFamily: "Noto Arabic" }}>
        <Text>{words}</Text>
      </Document>
    );
    const layout = await laidOut(design);
    const [node] = lined(layout);
    const [line] = node.lineBoxes;
    expect(node.text).toBe(words);
    // The caret before its first character is at its right, after its last at its left.
    expect(caretBox(layout, { path: node.path, offset: 0 })!.x).toBeCloseTo(line.x + line.width, 1);
    expect(caretBox(layout, { path: node.path, offset: words.length })!.x).toBeCloseTo(line.x, 1);
    // "PDF", left to right: P, D and F each further right, in a run of its own.
    const p = words.indexOf("PDF");
    const xs = [0, 1, 2, 3].map((i) => caretBox(layout, { path: node.path, offset: p + i, affinity: i === 0 ? "after" : "before" })!.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    const run = line.runs.find((run) => run.start <= p && run.end >= p + 3 && !run.rtl)!;
    expect(run).toBeDefined();
    // A caret placed at P's left is before it.
    expect(caretAt(layout, { page: 1, x: xs[0] + 0.1, y: line.y + 1 })!.offset).toBe(p);
    // "PD": one box. "F" and the Arabic word after "PDF ", written on together: drawn apart, with "PD" between (the
    // word is left of "PDF", the F at its right), so two boxes.
    expect(selectionBoxes(layout, { path: node.path, start: p, end: p + 2 })).toHaveLength(1);
    const end = words.indexOf(" ", p + 4);
    const split = selectionBoxes(layout, { path: node.path, start: p + 2, end });
    expect(split).toHaveLength(2);
    expect(split.every((box) => box.y === line.y)).toBe(true);
    const pd = selectionBoxes(layout, { path: node.path, start: p, end: p + 2 })[0];
    expect(split.some((box) => box.x + box.width <= pd.x + 0.01) && split.some((box) => box.x >= pd.x + pd.width - 0.01)).toBe(true);
  });

  it("puts a caret between characters, never inside one: a letter and its accent, a pair of UTF-16 units", async () => {
    // "é" as e and an acute accent, and "𝐀" (a pair of UTF-16 units), in a font with each.
    const words = "Café and 𝐀 bold";
    const design = (
      <Document style={{ fontFamily: "Liberation" }}>
        <Text>{words}</Text>
      </Document>
    );
    const layout = await laidOut(design);
    const [node] = lined(layout);
    const accent = words.indexOf("́");
    const pair = words.indexOf("𝐀") + 1;
    for (const inside of [accent, pair]) {
      // An offset inside a character has its caret before it, and a place there is before it or after it.
      expect(caretBox(layout, { path: node.path, offset: inside })!.x).toBe(caretBox(layout, { path: node.path, offset: inside - 1 })!.x);
      const box = caretBox(layout, { path: node.path, offset: inside })!;
      expect([inside - 1, inside + 1]).toContain(caretAt(layout, { page: 1, x: box.x, y: box.y + 1 })!.offset);
    }
    // No place puts a caret inside one.
    const [line] = node.lineBoxes;
    for (let x = line.x - 5; x < line.x + line.width + 5; x += 0.5) {
      const { offset } = caretAt(layout, { page: 1, x, y: line.y + 1 })!;
      expect([accent, pair]).not.toContain(offset);
    }
  });
});
