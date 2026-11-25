/**
 * A Document's content that doesn't fit its page goes on to the next: each PDF read back with pdf.js (the words on
 * each page) and laid out with layoutDocument() (where each block landed).
 */
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Document, Heading, List, ListItem, PageFooter, PageNumber, prepare, Section, Span, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { reactPdf, writeDocument } from "@hyper-elements/core/pdf";
import { layoutDocument, paginate, renderPdf } from "../../src/pdf";
import { arabicFonts, arabicGiven, arabicSentences } from "./arabic";

/** Each page's words, joined by spaces. */
async function words(pdf: Uint8Array): Promise<string[]> {
  const document = await getDocument({ data: pdf.slice(), useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= document.numPages; n++) {
    const items = (await (await document.getPage(n)).getTextContent()).items.filter((item): item is { str: string } & typeof item => "str" in item);
    pages.push(items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim());
  }
  return pages;
}

const sentences = (count: number, what: string) => Array.from({ length: count }, (_, i) => `Sentence ${i + 1} of ${what}.`).join(" ");

describe("a Document's content that doesn't fit its page", () => {
  it("goes on to the next pages: a paragraph split between its lines, going on where it stopped, two lines at least on each side", async () => {
    // 200 sentences: 75 lines of 18 points, for rooms of 769.89 (42 lines). Its parts are drawn line by line, as they were
    // laid out: the 42 on page 1 stay 42 (drawn as paragraphs, they'd break into 43).
    const text = sentences(200, "one long paragraph");
    const design = (
      <Document>
        <Text>{text}</Text>
      </Document>
    );
    const { pdf, diagnostics } = await renderPdf(design);
    expect(diagnostics).toEqual([]);
    const pages = await words(pdf);
    expect(pages).toHaveLength(2);
    expect(pages.join(" ")).toBe(text);
    const { nodes } = await layoutDocument(design);
    expect(nodes.map(({ page, part, lines, cut }) => ({ page, part, cut, lines: lines! >= 2 }))).toEqual([
      { page: 1, part: 0, cut: undefined, lines: true },
      { page: 2, part: 1, cut: undefined, lines: true },
    ]);
    // Each part's characters of the paragraph's text: the first from its start, the second from where it stopped.
    expect(nodes[0].chars!.start).toBe(0);
    expect(nodes[1].chars).toEqual({ start: nodes[0].chars!.end, end: text.length });
  });

  /** Page 1's lines, by their baselines: their words, and where they start and end. */
  const lines = async (pdf: Uint8Array) => {
    const document = await getDocument({ data: pdf.slice(), useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise;
    const items = (await (await document.getPage(1)).getTextContent()).items.filter((item): item is { str: string; width: number; transform: number[] } & typeof item => "str" in item && item.str.trim() !== "");
    const rows = new Map<number, typeof items>();
    for (const item of items) rows.set(Math.round(item.transform[5] * 10) / 10, [...(rows.get(Math.round(item.transform[5] * 10) / 10) ?? []), item]);
    return [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([y, row]) => ({ y, words: row.map((item) => item.str).join("").replace(/\s+/g, ""), start: Math.min(...row.map((item) => item.transform[4])), end: Math.max(...row.map((item) => item.transform[4] + item.width)) }));
  };

  it("draws a split paragraph's lines where the paragraph set them, in every alignment: the same words, within 2 points", async () => {
    for (const textAlign of ["left", "center", "right", "justify"] as const) {
      // Bold runs among plain ones, and lines its engine squeezes, stretches (justified) or breaks a word in.
      const design = (
        <Document>
          <Text style={{ textAlign }}>
            {Array.from({ length: 200 }, (_, i) => (i % 7 === 3 ? <Span key={i} style={{ fontWeight: 700 }}>{`Sentence ${i + 1} in bold. `}</Span> : `Sentence ${i + 1} of one long paragraph. `))}
          </Text>
        </Document>
      );
      const { root } = prepare(design);
      // The paragraph drawn whole (cut at the page's end, as before it was flowed), and the PDF.
      const whole = await lines((await reactPdf(writeDocument(root!, { families: new Set(), fonts: [], image: () => undefined, date: new Date(0) }))).pdf);
      const { pdf, diagnostics } = await renderPdf(design);
      const painted = await lines(pdf);
      expect(diagnostics).toEqual([]);
      expect(painted.length).toBe(42);
      painted.forEach((line, i) => {
        expect(line.words, `${textAlign}, line ${i + 1}`).toBe(whole[i].words);
        expect(line.y).toBeCloseTo(whole[i].y, 1);
        expect(Math.abs(line.start - whole[i].start), `${textAlign}, line ${i + 1}'s start`).toBeLessThan(2);
        expect(Math.abs(line.end - whole[i].end), `${textAlign}, line ${i + 1}'s end`).toBeLessThan(2);
      });
    }
  });

  it("splits a paragraph written right to left between its lines, each drawn as the paragraph set it: the same words, within 2 points", async () => {
    // A line of it is reported as drawn, its words reordered: it's matched to the paragraph's characters all the same.
    for (const textAlign of ["right", "justify", "left"] as const) {
      const design = (
        <Document dir="rtl" style={{ fontFamily: "Noto Arabic" }}>
          <Text style={{ textAlign }}>
            {Array.from({ length: 90 }, (_, i) => (i % 5 === 2 ? <Span key={i} style={{ color: "#b91c1c" }}>{`ملف PDF رقم ${i + 1}، مع كلمة Elements هنا. `}</Span> : `${arabicSentences(1, i + 1)} `))}
          </Text>
        </Document>
      );
      const { root } = prepare(design);
      const whole = await lines((await reactPdf(writeDocument(root!, { families: new Set(["noto arabic"]), fonts: arabicFonts, image: () => undefined, date: new Date(0) }))).pdf);
      const { pdf, diagnostics, plan } = await renderPdf(design, { fonts: arabicGiven });
      const painted = await lines(pdf);
      expect(diagnostics).toEqual([]);
      expect(plan.pages).toHaveLength(2);
      expect(painted.length).toBeGreaterThan(30);
      painted.forEach((line, i) => {
        expect(line.words, `${textAlign}, line ${i + 1}`).toBe(whole[i].words);
        expect(line.y).toBeCloseTo(whole[i].y, 1);
        expect(Math.abs(line.start - whole[i].start), `${textAlign}, line ${i + 1}'s start`).toBeLessThan(2);
        expect(Math.abs(line.end - whole[i].end), `${textAlign}, line ${i + 1}'s end`).toBeLessThan(2);
      });
      // Planned the same without drawing.
      expect((await paginate(design, { fonts: arabicGiven })).plan).toEqual(plan);
    }
  });

  it("is planned the same without drawing (paginate()) as from the PDF's own layout (renderPdf())", async () => {
    const designs = [
      <Document key="text">
        <Text style={{ textAlign: "justify" }}>{sentences(200, "one long paragraph")}</Text>
      </Document>,
      <Document key="table">
        <PageFooter>
          <Text>
            Page <PageNumber /> of <PageNumber total />
          </Text>
        </PageFooter>
        <Section style={{ padding: 24 }}>
          <Heading level={2}>Rows</Heading>
          <Table>
            <TableRow header>
              <TableCell>Item</TableCell>
              <TableCell>Amount</TableCell>
            </TableRow>
            {Array.from({ length: 70 }, (_, i) => (
              <TableRow key={i}>
                <TableCell>{`Row ${i + 1}`}</TableCell>
                <TableCell>$1.00</TableCell>
              </TableRow>
            ))}
          </Table>
        </Section>
      </Document>,
    ];
    for (const design of designs) {
      const drawn = await renderPdf(design);
      const planned = await paginate(design);
      expect(planned.plan.pages.length).toBeGreaterThan(1);
      expect(planned.plan).toEqual(drawn.plan);
      expect(planned.diagnostics).toEqual(drawn.diagnostics);
    }
  });

  it("goes on between a table's rows, its header row on top of each page, each row once", async () => {
    const rows = Array.from({ length: 70 }, (_, i) => `Row ${i + 1}`);
    const { pdf } = await renderPdf(
      <Document>
        <Table>
          <TableRow header>
            <TableCell>Item</TableCell>
            <TableCell>Amount</TableCell>
          </TableRow>
          {rows.map((row) => (
            <TableRow key={row}>
              <TableCell>{row}</TableCell>
              <TableCell>$1.00</TableCell>
            </TableRow>
          ))}
        </Table>
        <Text>Total: $70.00</Text>
      </Document>
    );
    const pages = await words(pdf);
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) expect(page.startsWith("Item Amount")).toBe(true);
    expect(pages.join(" ").match(/Row \d+/g)).toEqual(rows);
    expect(pages[pages.length - 1].endsWith("Total: $70.00")).toBe(true);
  });

  it("doesn't leave a heading last on a page: it goes on with what follows it", async () => {
    // 41 lines of 18 points (738) leave 31.89 of 769.89: the heading's 22.5 fit, the text after it doesn't.
    const design = (
      <Document>
        {Array.from({ length: 41 }, (_, i) => (
          <Text key={i}>Line {i + 1}</Text>
        ))}
        <Heading level={2}>Next section</Heading>
        <Text>Its first paragraph.</Text>
      </Document>
    );
    const { nodes } = await layoutDocument(design);
    const page = (path: string) => nodes.find((node) => node.path === path)?.page;
    expect([page("root.children[40]"), page("root.children[41]"), page("root.children[42]")]).toEqual([1, 2, 2]);
  });

  it("goes on between a list's items", async () => {
    const items = Array.from({ length: 60 }, (_, i) => `Item ${i + 1}`);
    const { pdf } = await renderPdf(
      <Document>
        <List>
          {items.map((item) => (
            <ListItem key={item}>{item}</ListItem>
          ))}
        </List>
      </Document>
    );
    const pages = await words(pdf);
    expect(pages.length).toBe(2);
    expect(pages.join(" ").match(/Item \d+/g)).toEqual(items);
  });

  it("cuts a Section where its page ends: its top padding on its first part only, its bottom padding on its last", async () => {
    const design = (
      <Document>
        <Section style={{ padding: 24, backgroundColor: "#f3f4f6" }}>
          {Array.from({ length: 60 }, (_, i) => (
            <Text key={i}>Line {i + 1}</Text>
          ))}
        </Section>
      </Document>
    );
    const { pages, nodes } = await layoutDocument(design);
    expect(pages).toHaveLength(2);
    const section = nodes.filter((node) => node.path === "root.children[0]");
    const first = (page: number) => nodes.find((node) => node.page === page && node.path.startsWith("root.children[0].children["))!;
    // Page 1: 24px of padding above its first line. Page 2: none, and the padding below its last line.
    expect(first(1).y - section[0].y).toBeCloseTo(24, 1);
    expect(first(2).y - section[1].y).toBeCloseTo(0, 1);
    const second = nodes.filter((node) => node.page === 2 && node.path.startsWith("root.children[0].children["));
    const last = second[second.length - 1];
    expect(section[1].y + section[1].height - (last.y + last.height)).toBeCloseTo(24, 1);
  });

  it("goes on from a Document.Page to pages with its background, then the next page starts", async () => {
    const { pages, nodes } = await layoutDocument(
      <Document>
        <Document.Page style={{ backgroundColor: "#fef3c7" }}>
          {Array.from({ length: 60 }, (_, i) => (
            <Text key={i}>Line {i + 1}</Text>
          ))}
        </Document.Page>
        <Document.Page>
          <Text>Back page</Text>
        </Document.Page>
      </Document>
    );
    expect(pages).toHaveLength(3);
    expect(nodes.find((node) => node.path === "root.children[1].children[0]")?.page).toBe(3);
    const { pdf } = await renderPdf(
      <Document>
        <Document.Page style={{ backgroundColor: "#fef3c7" }}>
          {Array.from({ length: 60 }, (_, i) => (
            <Text key={i}>Line {i + 1}</Text>
          ))}
        </Document.Page>
      </Document>
    );
    // The page's background, as its fill color (0.996 0.953 0.78), on both pages it goes on.
    const document = await getDocument({ data: pdf.slice(), verbosity: 0 }).promise;
    for (let n = 1; n <= document.numPages; n++) {
      const { argsArray } = await (await document.getPage(n)).getOperatorList();
      expect(JSON.stringify(argsArray)).toMatch(/"#fef3c7"|\[254,243,199\]|0\.99[0-9]*,0\.95[0-9]*,0\.78/);
    }
  });

  it("numbers each page's footer for the pages there are", async () => {
    const { pdf } = await renderPdf(
      <Document>
        <PageFooter>
          <Text>
            Page <PageNumber /> of <PageNumber total />
          </Text>
        </PageFooter>
        <Text>{sentences(300, "a report")}</Text>
      </Document>
    );
    const pages = await words(pdf);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.map((page) => /Page (\d+) of (\d+)$/.exec(page)?.slice(1).join("/"))).toEqual(pages.map((_, i) => `${i + 1}/${pages.length}`));
  });
});
