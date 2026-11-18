import { Column, Document, Heading, Row, Text, prop, token } from "@hyper-elements/react";
import { formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { receipt } from "../../_categories/receipt";
import { LedgerFact, LedgerFooter, LedgerLetterhead, LedgerLines, ledgerLinks, ledgerMoney } from "../parts";

export default function ledgerReceiptDocument(brand: Brand) {
  return template({
    id: "templates.LedgerReceiptDocument",
    version: "1.0.0",
    label: "Receipt",
    description: "A receipt as a PDF: paid in full, with the items, the total, the date and how it was paid",
    guidance: "One receipt per payment. Describe each item as the customer's order names it.",
    root: "Document",
    formats: { a4: { size: "A4" }, letter: { size: "Letter" } },
    fields: {
      ...receipt.required,
      paidBy: prop.text({ label: "Paid by", required: true, maxLength: 60 }),
      method: prop.text({ label: "Paid with", maxLength: 40 }),
    },
    rules: { require: { core: ["layout/overflow", "document/overflow"] }, links: ledgerLinks(brand) },
    example: { ...receipt.example, paidBy: "Northwind Traders", method: "Visa ending 4242" },
    render(v, { format }) {
      const money = ledgerMoney(brand, v.currency);
      const total = v.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const paid = formatDate(v.paid, brand.lang ?? "en", { month: "long", day: "numeric", year: "numeric" });
      const quiet = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;
      return (
        <Document size={format === "letter" ? "Letter" : "A4"} margin={[56, 64, 64, 64]} title={`Receipt ${v.number}, ${brand.name}`} lang={brand.lang ?? "en"} {...(brand.dir ? { dir: brand.dir } : {})} theme={brand.theme} fonts={brand.fonts} style={{ fontSize: 12, lineHeight: token("lineHeights.body") }}>
          <Document.Page style={{ gap: token("spacing.xl") }}>
            <Column style={{ height: 6, backgroundColor: token("colors.primary"), borderRadius: 3 }} />
            <LedgerLetterhead brand={brand} />
            <Row style={{ alignItems: "end", gap: token("spacing.lg") }}>
              <Heading field="number" level={1}>Receipt {v.number}</Heading>
              <Column style={{ alignItems: "end" }}>
                <Column style={{ backgroundColor: token("colors.primary"), borderRadius: token("radii.sm"), padding: [6, 14] }}>
                  <Text style={{ color: token("colors.primaryForeground"), fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Paid in full</Text>
                </Column>
              </Column>
            </Row>
            <Row style={{ gap: token("spacing.lg") }}>
              <LedgerFact label="Paid by" value={v.paidBy} field="paidBy" />
              <LedgerFact label="Date paid" value={paid} field="paid" />
              {v.method ? <LedgerFact label="Paid with" value={v.method} field="method" /> : null}
            </Row>
            <LedgerLines brand={brand} currency={v.currency} lines={v.items} field="items" />
            <Row style={{ gap: token("spacing.lg"), alignItems: "start" }}>
              <Text style={quiet}>Thank you. Keep this receipt for your records; nothing more is owed.</Text>
              <Column style={{ width: 240, backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: token("spacing.lg"), gap: 2 }}>
                <Text style={quiet}>Total paid</Text>
                <Text style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{money.format(total)}</Text>
              </Column>
            </Row>
          </Document.Page>
          <LedgerFooter brand={brand} />
        </Document>
      );
    },
  });
}
