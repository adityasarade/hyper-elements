/**
 * A Document measured without drawing it (react-pdf-measure.ts: react-pdf's own text layout, and the page model's
 * arithmetic) as react-pdf lays it out when it draws it: every block's box and every line (its characters, its top, its
 * width and its glyphs' advances) within 0.05 points, over the gallery's, the stress set's and the templates' Documents
 * and designs made to stress it (every alignment, bold runs, letter spacing, a transform, a line's image, a font file
 * with its kerning, padding, borders and gaps, Rows, Lists, Tables). What the plan is made from before anything's drawn.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement, type ReactElement } from "react";
import { Column, Document, Heading, Image, List, ListItem, PageFooter, PageHeader, PageNumber, prepare, Row, Section, Span, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { flowDocument, reactPdf, reactPdfLayout, writeDocument, type DrawnDocument, type PlacedPage } from "@hyper-elements/core/pdf";
import { gallery } from "../../src/primitives/examples/gallery";
import { stress } from "../../src/primitives/examples/stress";
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
};
const fonts = [{ family: "liberation", data: new Uint8Array(liberation("LiberationSans-Regular.ttf")), weight: 400, style: "normal" as const }];
/** The templates' Document designs (templates/documents/<name>/designs/*.tsx), each its default export. */
async function templateDesigns(): Promise<Array<[string, ReactElement]>> {
  const folder = join(dirname(fileURLToPath(import.meta.url)), "../../../../templates/documents");
  const files = readdirSync(folder).flatMap((name) => (existsSync(join(folder, name, "designs")) ? readdirSync(join(folder, name, "designs")).filter((file) => file.endsWith(".tsx")).map((file) => join(folder, name, "designs", file)) : []));
  return Promise.all(files.map(async (file) => [file.slice(folder.length + 1), createElement(((await import(file)) as { default: () => ReactElement }).default)] as [string, ReactElement]));
}

it("measures each Document as react-pdf draws it, without drawing it", async () => {
  const cases: Array<[string, ReactElement]> = [
    ...Object.entries(gallery),
    ...Object.entries(stress).filter(([, e]) => e.roots !== "screen").map(([n, e]) => [n, e.template] as [string, ReactElement]),
    ...(await templateDesigns()),
    ...Object.entries(synthetic),
  ];
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
    const families = new Set(name === "embedded" ? ["liberation"] : []);
    const context = { families, fonts: name === "embedded" ? fonts : [], image: (src: string) => (src.startsWith("data:") ? src : undefined), date: new Date(0) };
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
