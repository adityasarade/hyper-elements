import { Column, Document, Heading, Link, PageFooter, PageNumber, Row, Table, TableCell, TableRow, Text, token } from "@hyper-elements/react";
import { formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { invoice } from "../../_categories/invoice";
import { LedgerFact, LedgerLetterhead, ledgerHref, ledgerLinks, ledgerMoney } from "../parts";

export default function ledgerInvoiceDocument(brand: Brand) {
  return template({
    id: "templates.LedgerInvoiceDocument",
    version: "1.0.0",
    label: "Invoice",
    description: "An invoice as a PDF: the letterhead, who it's billed to, the lines with their sums, the total due, and page numbers",
    guidance: "One invoice per customer per period. Describe each line as the customer's plan names it.",
    root: "Document",
    formats: { a4: { size: "A4" }, letter: { size: "Letter" } },
    fields: { ...invoice.required },
    rules: { require: { core: ["layout/overflow", "document/overflow"] }, links: ledgerLinks(brand) },
    example: { ...invoice.example },
    render(v, { format }) {
      const money = ledgerMoney(brand, v.currency);
      const total = v.lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
      const date = (d: string) => formatDate(d, brand.lang ?? "en", { month: "long", day: "numeric", year: "numeric" });
      const quiet = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;
      const cell = { padding: [token("spacing.sm"), 0], border: { bottom: { width: 1, style: "solid", color: token("colors.border") } } } as const;
      const right = { ...cell, textAlign: "right" } as const;
      return (
        <Document
          size={format === "letter" ? "Letter" : "A4"}
          margin={[56, 64, 64, 64]}
          title={`Invoice ${v.number}, ${brand.name}`}
          lang={brand.lang ?? "en"}
          {...(brand.dir ? { dir: brand.dir } : {})}
          theme={brand.theme}
          fonts={brand.fonts}
          style={{ fontSize: 12, lineHeight: token("lineHeights.body") }}
        >
          <Document.Page style={{ gap: token("spacing.xl") }}>
            {/* A bar of the brand's color across the top of the page. */}
            <Column style={{ height: 6, backgroundColor: token("colors.primary"), borderRadius: 3 }} />
            <LedgerLetterhead brand={brand} />
            <Heading field="number" level={1}>Invoice {v.number}</Heading>
            <Row style={{ alignItems: "start", gap: token("spacing.lg") }}>
              <Column field="customer" style={{ gap: 2 }}>
                <Text style={quiet}>Billed to</Text>
                <Text style={{ fontWeight: 700 }}>{v.customer.name}</Text>
                {v.customer.address.map((line, i) => (
                  <Text key={i}>{line}</Text>
                ))}
              </Column>
              <Row style={{ gap: token("spacing.lg") }}>
                <LedgerFact label="Issued" value={date(v.issued)} field="issued" />
                <LedgerFact label="Due" value={date(v.due)} field="due" />
              </Row>
            </Row>
            <Table field="lines">
              <TableRow header>
                <TableCell style={{ ...cell, ...quiet }}>Description</TableCell>
                <TableCell style={{ ...right, ...quiet, width: 60 }}>Qty</TableCell>
                <TableCell style={{ ...right, ...quiet, width: 100 }}>Unit price</TableCell>
                <TableCell style={{ ...right, ...quiet, width: 110 }}>Amount</TableCell>
              </TableRow>
              {v.lines.map((line, i) => (
                <TableRow key={i}>
                  <TableCell style={cell}>{line.description}</TableCell>
                  <TableCell style={right}>{String(line.quantity)}</TableCell>
                  <TableCell style={right}>{money.format(line.price)}</TableCell>
                  <TableCell style={right}>{money.format(line.quantity * line.price)}</TableCell>
                </TableRow>
              ))}
            </Table>
            <Row style={{ gap: token("spacing.lg"), alignItems: "start" }}>
              <Column style={{ gap: token("spacing.xs") }}>
                <Text style={{ fontWeight: 700 }}>How to pay</Text>
                <Text field="pay" style={quiet}>
                  Pay online at <Link href={ledgerHref(brand, v.pay)}>{ledgerHref(brand, v.pay).replace(/^https:\/\//, "")}</Link>, or by bank transfer quoting {v.number}.
                </Text>
              </Column>
              <Column style={{ width: 240, backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: token("spacing.lg"), gap: 2 }}>
                <Text style={quiet}>Amount due</Text>
                <Text style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, color: token("colors.primary") }}>{money.format(total)}</Text>
                <Text style={{ fontWeight: 700 }}>by {date(v.due)}</Text>
              </Column>
            </Row>
          </Document.Page>
          <PageFooter>
            <Text style={{ ...quiet, padding: [token("spacing.sm"), 0, 0], border: { top: { width: 1, style: "solid", color: token("colors.border") } } }}>
              {brand.name}
              {brand.address ? `, ${brand.address}` : ""}. Page <PageNumber /> of <PageNumber total />
            </Text>
          </PageFooter>
        </Document>
      );
    },
  });
}
