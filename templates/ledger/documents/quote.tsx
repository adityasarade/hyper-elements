import { Column, Document, Heading, Row, Text, token } from "@hyper-elements/react";
import { formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { quote } from "../../_categories/quote";
import { LedgerFact, LedgerFooter, LedgerLetterhead, LedgerLines, ledgerLinks, ledgerMoney } from "../parts";

export default function ledgerQuoteDocument(brand: Brand) {
  return template({
    id: "templates.LedgerQuoteDocument",
    version: "1.0.0",
    label: "Quote",
    description: "A quote as a PDF: who it's for, the work with its prices, the estimated total, how long it holds, and lines to sign it",
    guidance: "Describe each line as the work it is. The total is added up for you.",
    root: "Document",
    formats: { a4: { size: "A4" }, letter: { size: "Letter" } },
    fields: { ...quote.required },
    rules: { require: { core: ["layout/overflow", "document/overflow"] }, links: ledgerLinks(brand) },
    example: { ...quote.example },
    render(v, { format }) {
      const money = ledgerMoney(brand, v.currency);
      const total = v.lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
      const date = (d: string) => formatDate(d, brand.lang ?? "en", { month: "long", day: "numeric", year: "numeric" });
      const quiet = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;
      const sign = (label: string) => (
        <Column style={{ gap: 4, padding: [token("spacing.xl"), 0, 0] }}>
          <Column style={{ border: { top: { width: 1, style: "solid", color: token("colors.foreground") } } }} />
          <Text style={quiet}>{label}</Text>
        </Column>
      );
      return (
        <Document size={format === "letter" ? "Letter" : "A4"} margin={[56, 64, 64, 64]} title={`Quote ${v.number}, ${brand.name}`} lang={brand.lang ?? "en"} {...(brand.dir ? { dir: brand.dir } : {})} theme={brand.theme} fonts={brand.fonts} style={{ fontSize: 12, lineHeight: token("lineHeights.body") }}>
          <Document.Page style={{ gap: token("spacing.xl") }}>
            <Column style={{ height: 6, backgroundColor: token("colors.primary"), borderRadius: 3 }} />
            <LedgerLetterhead brand={brand} />
            <Heading field="number" level={1}>Quote {v.number}</Heading>
            <Row style={{ alignItems: "start", gap: token("spacing.lg") }}>
              <Column field="customer" style={{ gap: 2 }}>
                <Text style={quiet}>Prepared for</Text>
                <Text style={{ fontWeight: 700 }}>{v.customer.name}</Text>
                {v.customer.address.map((line, i) => (
                  <Text key={i}>{line}</Text>
                ))}
              </Column>
              <Row style={{ gap: token("spacing.lg") }}>
                <LedgerFact label="Issued" value={date(v.issued)} field="issued" />
                <LedgerFact label="Valid until" value={date(v.validUntil)} field="validUntil" />
              </Row>
            </Row>
            <LedgerLines brand={brand} currency={v.currency} lines={v.lines} field="lines" />
            <Row style={{ gap: token("spacing.lg"), alignItems: "start" }}>
              <Column style={{ gap: token("spacing.xs") }}>
                <Text style={{ fontWeight: 700 }}>To go ahead</Text>
                <Text style={quiet}>Sign below and send it back before {date(v.validUntil)}. Prices hold until then; we'll invoice when the work starts.</Text>
              </Column>
              <Column style={{ width: 240, backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: token("spacing.lg"), gap: 2 }}>
                <Text style={quiet}>Estimated total</Text>
                <Text style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, color: token("colors.primary") }}>{money.format(total)}</Text>
              </Column>
            </Row>
            <Row style={{ gap: token("spacing.xl") }}>
              {sign(`Accepted for ${v.customer.name}`)}
              {sign("Date")}
            </Row>
          </Document.Page>
          <LedgerFooter brand={brand} />
        </Document>
      );
    },
  });
}
