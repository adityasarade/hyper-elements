import { Button, Column, Divider, Email, Heading, Link, Row, Text, token } from "@hyper-elements/react";
import { formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { invoice } from "../../_categories/invoice";
import { LedgerFact, LedgerLetterhead, ledgerEmailRules, ledgerHref, ledgerMoney } from "../parts";

export default function ledgerInvoiceEmail(brand: Brand) {
  return template({
    id: "templates.LedgerInvoiceEmail",
    version: "1.0.0",
    label: "Invoice email",
    description: "The email that sends an invoice: the amount due, the due date, the lines, and a button to pay online",
    guidance: "Send it with the invoice PDF attached. The amount is added up from the lines.",
    root: "Email",
    fields: { ...invoice.required },
    rules: ledgerEmailRules(brand),
    example: { ...invoice.example },
    render(v) {
      const money = ledgerMoney(brand, v.currency);
      const total = v.lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
      const due = formatDate(v.due, brand.lang ?? "en", { month: "long", day: "numeric", year: "numeric" });
      return (
        <Email
          width={600}
          title={`Invoice ${v.number} from ${brand.name}`}
          previewText={`${money.format(total)} due ${due}`}
          lang={brand.lang ?? "en"}
          {...(brand.dir ? { dir: brand.dir } : {})}
          theme={brand.theme}
          fonts={brand.fonts}
          style={{ fontSize: token("fontSizes.body"), lineHeight: token("lineHeights.body") }}
        >
          <Column style={{ padding: token("spacing.xl"), gap: token("spacing.lg") }}>
            <LedgerLetterhead brand={brand} />
            <Column style={{ gap: token("spacing.sm") }}>
              <Heading level={1}>Invoice {v.number}</Heading>
              <Text>
                Hello {v.customer.name}, here's your invoice from {brand.name}. The PDF is attached.
              </Text>
            </Column>
            <Column style={{ backgroundColor: token("colors.surface"), padding: token("spacing.lg"), gap: token("spacing.md"), borderRadius: token("radii.sm") }}>
              <Row stackOnMobile={false} style={{ gap: token("spacing.md"), alignItems: "end" }}>
                <Column style={{ gap: 2 }}>
                  <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>Amount due</Text>
                  <Text style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: token("colors.primary") }}>{money.format(total)}</Text>
                </Column>
                <LedgerFact label="Due" value={due} field="due" align="right" />
              </Row>
              <Divider />
              {v.lines.map((line, i) => (
                <Row key={i} stackOnMobile={false} style={{ gap: token("spacing.md") }}>
                  <Column>
                    <Text>
                      {line.description}
                      {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                    </Text>
                  </Column>
                  <Column style={{ width: 120 }}>
                    <Text style={{ textAlign: "right" }}>{money.format(line.quantity * line.price)}</Text>
                  </Column>
                </Row>
              ))}
            </Column>
            <Button field="pay" href={ledgerHref(brand, v.pay)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
              Pay {money.format(total)} online
            </Button>
            <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              Questions about this invoice? <Link href={ledgerHref(brand, "/billing")}>Visit {brand.name} billing</Link>
            </Text>
          </Column>
        </Email>
      );
    },
  });
}
