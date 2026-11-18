import { Column, Heading, Row, Table, TableCell, TableRow, Text, token } from "@hyper-elements/react";
import { formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { receipt } from "../../_categories/receipt";
import { minimalEmail, minimalRules } from "../parts";

export default function minimalReceipt(brand: Brand) {
  return template({
    id: "templates.MinimalReceiptEmail",
    version: "1.0.0",
    label: "Receipt",
    description: "A payment receipt: the items, the total, the date paid and the receipt number",
    guidance: "Describe each item as the customer's order names it. The total is added up for you.",
    root: "Email",
    fields: { ...receipt.required },
    rules: minimalRules(brand),
    example: { ...receipt.example },
    render(v) {
      const money = new Intl.NumberFormat(brand.lang ?? "en", { style: "currency", currency: v.currency });
      const total = v.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const cell = { padding: [token("spacing.sm"), 0], border: { bottom: { width: 1, style: "solid", color: token("colors.border") } } } as const;
      return minimalEmail(brand, {
        title: `Your ${brand.name} receipt`,
        preview: `${money.format(total)} paid on ${formatDate(v.paid, brand.lang ?? "en", { month: "long", day: "numeric" })}`,
        children: (
          <>
            <Heading level={1}>Thanks for your payment</Heading>
            <Row stackOnMobile={false} style={{ gap: token("spacing.md") }}>
              <Column>
                <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>Receipt</Text>
                <Text field="number" style={{ fontWeight: 700 }}>{v.number}</Text>
              </Column>
              <Column>
                <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), textAlign: "right" }}>Paid on</Text>
                <Text field="paid" style={{ fontWeight: 700, textAlign: "right" }}>
                  {formatDate(v.paid, brand.lang ?? "en", { month: "long", day: "numeric", year: "numeric" })}
                </Text>
              </Column>
            </Row>
            <Table field="items">
              {v.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell style={cell}>
                    {item.description}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </TableCell>
                  <TableCell style={{ ...cell, textAlign: "right", width: 120 }}>{money.format(item.quantity * item.price)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell style={{ padding: [token("spacing.sm"), 0], fontWeight: 700 }}>Total</TableCell>
                <TableCell style={{ padding: [token("spacing.sm"), 0], fontWeight: 700, textAlign: "right", width: 120 }}>{money.format(total)}</TableCell>
              </TableRow>
            </Table>
          </>
        ),
      });
    },
  });
}
