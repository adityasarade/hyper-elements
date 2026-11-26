/**
 * A Document's content that doesn't fit its page goes on to the next: each PDF read back with pdf.js (the words on
 * each page) and laid out with layoutDocument() (where each block landed).
 */
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Column, Document, Heading, Image, List, ListItem, PageFooter, PageNumber, prepare, Row, Section, Span, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import type { PlannedPart } from "@hyper-elements/core";
import { reactPdf, writeDocument } from "@hyper-elements/core/pdf";
import { createPaginator, layoutDocument, paginate, renderPdf } from "../../src/pdf";
import { arabic, arabicFonts, arabicGiven, arabicSentences } from "./arabic";

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

  it("is planned by a paginator as paginate() plans it, as it's typed into, and without diagnostics when asked", async () => {
    const report = (typed: string) => (
      <Document fonts={[{ family: "Inter", src: "https://example.com/inter.woff" }]}>
        <Heading level={2}>Report</Heading>
        {Array.from({ length: 30 }, (_, i) => (
          <Text key={i} style={{ textAlign: i % 2 ? "justify" : "left" }}>
            {sentences(10, `paragraph ${i}`)}
            {i === 3 ? typed : ""}
          </Text>
        ))}
      </Document>
    );
    const arabic = (
      <Document dir="rtl" style={{ fontFamily: "Noto Arabic" }}>
        <Text style={{ textAlign: "justify" }}>{arabicSentences(200)}</Text>
      </Document>
    );
    const paginator = await createPaginator({ fonts: arabicGiven });
    for (const design of [report(""), report(" and"), report(" and more"), arabic]) {
      const planned = await paginate(design, { fonts: arabicGiven });
      expect(planned.plan.pages.length).toBeGreaterThan(1);
      expect(paginator.paginate(design)).toEqual(planned);
      // Without diagnostics: the same plan, and nothing said.
      expect(paginator.paginate(design, { diagnostics: false })).toEqual({ plan: planned.plan, diagnostics: [] });
    }
    // The report says its font isn't given, with its diagnostics; a template with errors throws without them too.
    expect(paginator.paginate(report("")).diagnostics.map((d) => d.code)).toContain("pdf/font");
    const broken = (
      <Document>
        <Image src="https://example.com/photo.png" alt="A photo" />
      </Document>
    );
    expect(() => paginator.paginate(broken, { diagnostics: false })).toThrow(/images option/);
  });

  it("draws each family a paginator is given as that family, where another is given the same font file as another family", async () => {
    const page = (family: string, words: string) => (
      <Document dir="rtl" style={{ fontFamily: family }}>
        <Text>{words}</Text>
      </Document>
    );
    const first = await createPaginator({ fonts: [{ family: "Primary", src: arabic }] });
    expect(first.paginate(page("Primary", arabicSentences(1)), { svg: true }).svg![0]).toContain(`font-family="'primary'"`);
    const second = await createPaginator({ fonts: [{ family: "Secondary", src: arabic }] });
    expect(second.paginate(page("Secondary", arabicSentences(1)), { svg: true }).svg![0]).toContain(`font-family="'secondary'"`);
    // Typed into after the other was made: what's laid out anew is still in its own family.
    const typed = first.paginate(page("Primary", arabicSentences(2)), { svg: true }).svg![0];
    expect(typed).toContain(`font-family="'primary'"`);
    expect(typed).not.toContain("secondary");
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

  it("fills the rest of a page with a part that goes on to the next, as a browser does: its background to the room's foot", async () => {
    const { pages, nodes } = await layoutDocument(
      <Document>
        <Section style={{ padding: 24, backgroundColor: "#f3f4f6" }}>
          <Column style={{ padding: 12, backgroundColor: "#e5e7eb" }}>
            {Array.from({ length: 12 }, (_, i) => (
              <Text key={i}>{sentences(20, `paragraph ${i + 1}`)}</Text>
            ))}
          </Column>
        </Section>
      </Document>
    );
    expect(pages.length).toBeGreaterThan(1);
    const bottom = (path: string, page: number) => {
      const node = nodes.find((node) => node.path === path && node.page === page)!;
      return node.y + node.height;
    };
    for (const path of ["root.children[0]", "root.children[0].children[0]"]) {
      // Down to the room's foot on each page it goes on from, though its lines end above it (two at least stay together)…
      for (const page of pages.slice(0, -1)) expect(bottom(path, page.page), `${path} on page ${page.page}`).toBeCloseTo(page.room.bottom, 0);
      // …and on its last, where it ends.
      expect(bottom(path, pages.length)).toBeLessThan(pages[pages.length - 1].room.bottom - 100);
    }
    // A table that goes on ends with its last row on the page (its rows would be stretched with it in the print HTML).
    const table = await layoutDocument(
      <Document>
        <Table>
          {Array.from({ length: 80 }, (_, i) => (
            <TableRow key={i}>
              <TableCell>{`Row ${i + 1}`}</TableCell>
            </TableRow>
          ))}
        </Table>
      </Document>
    );
    const part = table.nodes.find((node) => node.path === "root.children[0]" && node.page === 1)!;
    const rows = table.nodes.filter((node) => node.page === 1 && /^root\.children\[0\]\.children\[\d+\]$/.test(node.path));
    expect(part.y + part.height).toBeCloseTo(Math.max(...rows.map((row) => row.y + row.height)), 1);
  });

  it("splits a Row of Columns taller than a page by its columns: each goes on in its own place, one that has ended keeps its room", async () => {
    // Centered: were a column that has ended left out, the one going on would move to the middle.
    const design = (
      <Document>
        <Row style={{ gap: 16, justifyContent: "center" }}>
          <Column style={{ width: 300, padding: 8, backgroundColor: "#f3f4f6" }}>
            {Array.from({ length: 16 }, (_, i) => (
              <Text key={i}>{sentences(12, `the long column's paragraph ${i + 1}`)}</Text>
            ))}
          </Column>
          <Column style={{ width: 200 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <Text key={i}>{sentences(4, `the short column's paragraph ${i + 1}`)}</Text>
            ))}
          </Column>
        </Row>
      </Document>
    );
    const { pdf, plan, diagnostics } = await renderPdf(design);
    expect(diagnostics).toEqual([]);
    expect(plan.pages.length).toBeGreaterThan(2);
    // Every sentence of each column drawn once (a word broken across lines joined again).
    const all = (await words(pdf)).join(" ").replace(/(\w)- (\w)/g, "$1$2");
    expect(all.match(/of the long column's paragraph/g)).toHaveLength(16 * 12);
    expect(all.match(/of the short column's paragraph/g)).toHaveLength(3 * 4);
    const { nodes } = await layoutDocument(design);
    const column = (i: number, page: number) => nodes.find((node) => node.path === `root.children[0].children[${i}]` && node.page === page);
    for (let page = 2; page <= plan.pages.length; page++) {
      expect(column(0, page)!.x, `the long column on page ${page}`).toBeCloseTo(column(0, 1)!.x, 1);
      // The short one ended on page 1: its room is kept, with nothing drawn.
      expect(column(1, page)).toBeUndefined();
    }
    // The plan: each column's last part is one, on a page where it has something; an empty part is neither its first nor its last.
    const parts = plan.pages.flatMap((page) => page.parts).flatMap(function all(part: PlannedPart): PlannedPart[] {
      return [part, ...(part.children ?? []).flatMap(all)];
    });
    for (const i of [0, 1]) {
      const path = `root.children[0].children[${i}]`;
      expect(parts.filter((part) => part.path === path && part.last)).toHaveLength(1);
      expect(parts.filter((part) => part.path === path && part.first)).toHaveLength(1);
    }
    expect(parts.filter((part) => part.empty).length).toBe(plan.pages.length - 1);
    expect(parts.filter((part) => part.empty).every((part) => !part.first && !part.last && !part.children)).toBe(true);
  });

  it("keeps a Row of Columns that fits on a page together: it goes on to the next page whole, with its heading", async () => {
    const { nodes } = await layoutDocument(
      <Document>
        {Array.from({ length: 30 }, (_, i) => (
          <Text key={i}>{`Paragraph ${i + 1}.`}</Text>
        ))}
        <Heading level={2}>Side by side</Heading>
        <Row style={{ gap: 16 }}>
          {[0, 1].map((n) => (
            <Column key={n}>
              {Array.from({ length: 10 }, (_, i) => (
                <Text key={i}>{sentences(3, `column ${n + 1}'s paragraph ${i + 1}`)}</Text>
              ))}
            </Column>
          ))}
        </Row>
      </Document>
    );
    const row = nodes.filter((node) => node.path === "root.children[31]");
    expect(row.map((node) => [node.page, node.part, node.cut])).toEqual([[2, 0, undefined]]);
    expect(nodes.find((node) => node.path === "root.children[30]")!.page).toBe(2);
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
