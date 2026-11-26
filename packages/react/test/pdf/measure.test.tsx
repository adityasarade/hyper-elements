/**
 * A Document measured without drawing it (react-pdf-measure.ts: react-pdf's own text layout, and the page model's
 * arithmetic) as react-pdf lays it out when it draws it: every block's box and every line (its characters, its top, its
 * width and its glyphs' advances) within 0.05 points, over the gallery's, the stress set's and the templates' Documents
 * and designs made to stress it (every alignment, bold runs, letter spacing, a transform, a line's image, a font file
 * with its kerning, text written right to left, padding, borders and gaps, Rows (split by their columns too), Lists, Tables). What the plan is made from before anything's drawn.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement, type ReactElement } from "react";
import { Column, Document, Heading, Image, List, ListItem, PageFooter, PageHeader, PageNumber, prepare, Row, Section, Span, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { createLayout, flowDocument, reactPdf, reactPdfLayout, writeDocument, type DrawnDocument, type Layout, type PlacedPage } from "@hyper-elements/core/pdf";
import { gallery } from "../../src/primitives/examples/gallery";
import { stress } from "../../src/primitives/examples/stress";
import { arabicFonts, arabicSentences } from "./arabic";
const liberation = (name: string) => readFileSync(join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts", name));
const PNG = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`;
const para = (i: number) => `Paragraph ${i}: Elements writes the same design to email, the web, print and PDF, so this stands in for a section.`;
const synthetic: Record<string, ReactElement> = {
  aligned: <Document>{(["left", "center", "right", "justify"] as const).map((a) => <Text key={a} style={{ textAlign: a }}>{Array.from({ length: 30 }, (_, i) => (i % 5 === 2 ? <Span key={i} style={{ fontWeight: 700 }}>{`Bold ${i}. `}</Span> : `Sentence ${i} of a paragraph. `))}</Text>)}</Document>,
  styled: <Document><PageHeader style={{ padding: [0, 0, 8, 0] }}><Text style={{ fontSize: 10 }}>Header</Text></PageHeader><PageFooter><Text style={{ fontSize: 10, textAlign: "right" }}>Page <PageNumber /> of <PageNumber total /></Text></PageFooter><Heading level={2}>Title</Heading><Text style={{ letterSpacing: 1, textTransform: "uppercase" }}>{para(1)}</Text><Text style={{ fontSize: 22, lineHeight: 1.2 }}>{para(2)}</Text><Text>Inline <Image src={{ src: PNG, width: 12, height: 12 }} alt="x" /> image in a line, {para(3)}</Text></Document>,
  boxes: <Document style={{ gap: 12 }}><Section style={{ padding: 24, border: { top: { width: 2, style: "solid", color: "#000000" } }, backgroundColor: "#eeeeee", gap: 8 }}>{Array.from({ length: 4 }, (_, i) => <Text key={i}>{para(i)}</Text>)}</Section><Row style={{ gap: 16 }}><Column><Text>{para(5)}</Text><Text>{para(6)}</Text></Column><Column style={{ width: 200 }}><Text>{para(7)}</Text></Column></Row><List type="number"><ListItem>{para(8)}</ListItem><ListItem>{para(9)}</ListItem></List><Table><TableRow header><TableCell>Item</TableCell><TableCell>Amount</TableCell></TableRow>{Array.from({ length: 5 }, (_, i) => <TableRow key={i}><TableCell>{para(i)}</TableCell><TableCell>$1.00</TableCell></TableRow>)}</Table></Document>,
  long: (
    <Document>
      <PageHeader>
        <Text style={{ fontSize: 10 }}>Header</Text>
      </PageHeader>
      <Section style={{ padding: 24, backgroundColor: "#f3f4f6", gap: 6 }}>
        {(["left", "center", "right", "justify"] as const).map((textAlign) => (
          <Text key={textAlign} style={{ textAlign }}>
            {Array.from({ length: 60 }, (_, i) => (i % 7 === 3 ? <Span key={i} style={{ fontWeight: 700 }}>{`Bold ${i}. `}</Span> : `Sentence ${i} of a long paragraph. `))}
          </Text>
        ))}
      </Section>
      <Table>
        <TableRow header>
          <TableCell>Item</TableCell>
          <TableCell>Amount</TableCell>
        </TableRow>
        {Array.from({ length: 40 }, (_, i) => (
          <TableRow key={i}>
            <TableCell>{para(i)}</TableCell>
            <TableCell>$1.00</TableCell>
          </TableRow>
        ))}
      </Table>
    </Document>
  ),
  embedded: <Document style={{ fontFamily: "Liberation" }}>{Array.from({ length: 12 }, (_, i) => <Text key={i} style={{ textAlign: i % 2 ? "justify" : "left" }}>{`AVATAR WAVE Type ${i}: ` + para(i)}</Text>)}</Document>,
  // Rows of Columns taller than a page, split by their columns: one centered across its page, with a column that ends
  // early and keeps its room; one stretched down it, a column with a background going on beside one that ends.
  rows: (
    <Document style={{ gap: 12 }}>
      <Row style={{ gap: 16, justifyContent: "center" }}>
        <Column style={{ width: 300, padding: 8, backgroundColor: "#f3f4f6" }}>{Array.from({ length: 14 }, (_, i) => <Text key={i}>{para(i)}</Text>)}</Column>
        <Column style={{ width: 160 }}>{Array.from({ length: 3 }, (_, i) => <Text key={i}>{para(i)}</Text>)}</Column>
      </Row>
      <Row style={{ gap: 12, alignItems: "stretch" }}>
        <Column style={{ padding: 12, backgroundColor: "#e5e7eb" }}>{Array.from({ length: 4 }, (_, i) => <Text key={i}>{para(i)}</Text>)}</Column>
        <Column style={{ padding: 12, backgroundColor: "#fef3c7", gap: 6 }}>{Array.from({ length: 30 }, (_, i) => <Text key={i}>{para(i)}</Text>)}</Column>
      </Row>
    </Document>
  ),
  // Written right to left, in a font with Arabic letters: every alignment, a run of another color, English words in
  // it, and an English paragraph with Arabic in it; long enough to flow.
  arabic: (
    <Document dir="rtl" style={{ fontFamily: "Noto Arabic" }}>
      <Heading level={2}>عنوان التقرير</Heading>
      {(["right", "center", "left", "justify"] as const).map((textAlign, n) => (
        <Text key={textAlign} style={{ textAlign }}>
          {Array.from({ length: 24 }, (_, i) => (i % 4 === 1 ? <Span key={i} style={{ color: "#b91c1c" }}>{`ملف PDF رقم ${n * 24 + i}، كلمة Elements هنا. `}</Span> : `${arabicSentences(1, n * 24 + i)} `))}
        </Text>
      ))}
      <Text dir="ltr">{Array.from({ length: 12 }, (_, i) => `Sentence ${i} quotes «مرحبا بالعالم» in Arabic, then goes on. `)}</Text>
    </Document>
  ),
};
const fonts = [{ family: "liberation", data: new Uint8Array(liberation("LiberationSans-Regular.ttf")), weight: 400, style: "normal" as const }];
/** The font files a design is drawn with: its own family's, for those that name one. */
const given: Record<string, typeof fonts> = { embedded: fonts, arabic: arabicFonts };
/** The templates' Document designs (templates/documents/<name>/designs/*.tsx), each its default export. */
async function templateDesigns(): Promise<Array<[string, ReactElement]>> {
  const folder = join(dirname(fileURLToPath(import.meta.url)), "../../../../templates/documents");
  const files = readdirSync(folder).flatMap((name) => (existsSync(join(folder, name, "designs")) ? readdirSync(join(folder, name, "designs")).filter((file) => file.endsWith(".tsx")).map((file) => join(folder, name, "designs", file)) : []));
  return Promise.all(files.map(async (file) => [file.slice(folder.length + 1), createElement(((await import(file)) as { default: () => ReactElement }).default)] as [string, ReactElement]));
}

/** Every design measured: the gallery's, the stress tests' printed ones, the templates' and the ones above. */
const corpus = async (): Promise<Array<[string, ReactElement]>> => [
  ...Object.entries(gallery),
  ...Object.entries(stress).filter(([, e]) => e.roots !== "screen").map(([n, e]) => [n, e.template] as [string, ReactElement]),
  ...(await templateDesigns()),
  ...Object.entries(synthetic),
];

it("measures each Document as react-pdf draws it, without drawing it", async () => {
  const cases = await corpus();
  const differences: string[] = [];
  let docs = 0;
  let blocks = 0;
  let lines = 0;
  let unmeasured = 0;
  let flowed = 0;
  for (const [name, design] of cases) {
    const { root } = prepare(design as ReactElement);
    if (root?.type !== "Document") continue;
    docs++;
    const files = given[name] ?? [];
    const context = { families: new Set(files.map((font) => font.family)), fonts: files, image: (src: string) => (src.startsWith("data:") ? src : undefined), date: new Date(0) };
    const written = writeDocument(root, context);
    const compare = async (document: DrawnDocument, label: string): Promise<PlacedPage[]> => {
      const drawless = await reactPdfLayout(document);
      const drawn = (await reactPdf(document)).placed!;
      if (!drawless) {
        unmeasured++;
        differences.push(`${label}: not measured without drawing`);
        return drawn;
      }
      drawn.forEach((page, i) => {
        const d = drawless[i];
        if (Math.abs(page.room.top - d.room.top) > 0.05 || Math.abs(page.room.bottom - d.room.bottom) > 0.05) differences.push(`${label} page ${i + 1}: its room`);
        const byPath = new Map(d.blocks.map((b) => [b.path, b]));
        for (const b of page.blocks) {
          const m = byPath.get(b.path);
          blocks++;
          if (!m) {
            differences.push(`${label} ${b.path}: not measured`);
            continue;
          }
          if (Math.abs(b.y - m.y) > 0.05 || Math.abs(b.height - m.height) > 0.05 || Math.abs(b.x - m.x) > 0.05 || Math.abs(b.width - m.width) > 0.05) differences.push(`${label} ${b.path}: drawn ${JSON.stringify([b.x, b.y, b.width, b.height].map((v) => +v.toFixed(2)))}, measured ${JSON.stringify([m.x, m.y, m.width, m.height].map((v) => +v.toFixed(2)))}`);
          if ((b.lines?.length ?? 0) !== (m.lines?.length ?? 0)) {
            differences.push(`${label} ${b.path}: ${b.lines?.length} lines drawn, ${m.lines?.length} measured`);
            continue;
          }
          (b.lines ?? []).forEach((l, j) => {
            lines++;
            const k = m.lines![j];
            if (l.text !== k.text || Math.abs(l.top - k.top) > 0.05 || Math.abs(l.width - k.width) > 0.05 || Math.abs(l.natural - k.natural) > 0.05) differences.push(`${label} ${b.path} line ${j + 1}: drawn ${JSON.stringify([l.text, +l.top.toFixed(2), +l.width.toFixed(2), +l.natural.toFixed(2)])}, measured ${JSON.stringify([k.text, +k.top.toFixed(2), +k.width.toFixed(2), +k.natural.toFixed(2)])}`);
          });
        }
      });
      return drawless;
    };
    const laid = await compare(written, name);
    // Its pages as flowed and painted (split text drawn line by line), where they don't fit: measured as drawn too.
    if (laid.some(({ room, blocks: placed }) => placed.some((block) => block.y + block.height > room.bottom + 0.5))) {
      flowed++;
      await compare(flowDocument(root, context, written, laid).document, `${name} (flowed)`);
    }
  }
  console.info(`Measured without drawing: ${docs} Documents (${flowed} flowed too), ${blocks} blocks, ${lines} lines; ${unmeasured} not measured, ${differences.length} different`);
  expect(differences).toEqual([]);
  // The corpus holds what it should: the templates, and enough of every kind.
  expect(docs).toBeGreaterThan(15);
  expect(lines).toBeGreaterThan(300);
  expect(flowed).toBeGreaterThan(0);
});

it("measures each Document with a Layout made once as without one, laying out again only the text that's changed", async () => {
  // A Layout for each set of fonts, made once and kept: each Document measured as reactPdfLayout() measures it, then
  // again from what it laid out before, laying out nothing.
  const layouts = new Map<unknown, Layout>();
  let docs = 0;
  for (const [name, design] of await corpus()) {
    const { root } = prepare(design as ReactElement);
    if (root?.type !== "Document") continue;
    docs++;
    const files = given[name] ?? [];
    if (!layouts.has(files)) layouts.set(files, (await createLayout(files))!);
    const layout = layouts.get(files)!;
    const context = { families: new Set(files.map((font) => font.family)), fonts: files, image: (src: string) => (src.startsWith("data:") ? src : undefined), date: new Date(0) };
    const written = writeDocument(root, context);
    const measured = layout.measure(written);
    expect(measured, name).toEqual(await reactPdfLayout(written));
    const laid = layout.laid;
    expect(layout.measure(written), name).toEqual(measured);
    expect(layout.laid, name).toBe(laid);
  }
  expect(docs).toBeGreaterThan(15);

  // A paragraph of a report changed, as a keystroke changes it: that paragraph is laid out again, and nothing else.
  const report = (typed: string) => (
    <Document>
      {Array.from({ length: 40 }, (_, i) => (
        <Text key={i}>
          {para(i)}
          {i === 7 ? typed : ""}
        </Text>
      ))}
    </Document>
  );
  const layout = (await createLayout([]))!;
  const written = (typed: string) => writeDocument(prepare(report(typed)).root!, { families: new Set(), fonts: [], image: () => undefined, date: new Date(0) });
  layout.measure(written(""));
  expect(layout.laid).toBe(40);
  for (const typed of [" a", " an", " and"]) {
    const before = layout.laid;
    const measured = layout.measure(written(typed));
    expect(layout.laid - before).toBe(1);
    expect(measured).toEqual(await reactPdfLayout(written(typed)));
  }
});
