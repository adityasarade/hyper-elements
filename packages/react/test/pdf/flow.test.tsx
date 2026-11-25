/**
 * A Document's content that doesn't fit its page goes on to the next: each PDF read back with pdf.js (the words on
 * each page) and laid out with layoutDocument() (where each block landed).
 */
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Document, Heading, List, ListItem, PageFooter, PageNumber, Section, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { layoutDocument, renderPdf } from "../../src/pdf";

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
    // 200 sentences: 75 lines of 18 points, for rooms of 769.89. Drawn on its own, its first 42 lines come out in 43 (its
    // lines are broken as a whole), so it's cut a line shorter: none of it runs past its page.
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
    expect(nodes.map(({ page, lines, cut }) => ({ page, cut, lines: lines! >= 2 }))).toEqual([
      { page: 1, cut: undefined, lines: true },
      { page: 2, cut: undefined, lines: true },
    ]);
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
