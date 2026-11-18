import { Column, Heading, Row, Table, TableCell, TableRow, Text, prop, token } from "@hyper-elements/react";
import { formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { receipt } from "../../_categories/receipt";
import { MinimalKicker, minimalEmail, minimalRules } from "../parts";

export default function minimalReceipt(brand: Brand) {
  return template({
    id: "templates.MinimalReceiptEmail",
    version: "1.0.0",
    label: "Receipt",
    description: "A payment receipt that leads with the amount paid, then the items, the total, and how it was paid",
    guidance: "Describe each item as the customer's order names it. The total is added up for you.",
    root: "Email",
    fields: {
      ...receipt.required,
      method: prop.text({ label: "Paid with", maxLength: 40 }),
    },
    rules: minimalRules(brand),
    example: { ...receipt.example, method: "Visa ending 4242" },
    render(v) {
      const money = new Intl.NumberFormat(brand.lang ?? "en", { style: "currency", currency: v.currency });
      const total = v.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const paid = formatDate(v.paid, brand.lang ?? "en", { month: "long", day: "numeric", year: "numeric" });
      const line = { padding: [token("spacing.sm"), 0], border: { bottom: { width: 1, style: "solid", color: token("colors.border") } } } as const;
      const quiet = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;
      return minimalEmail(brand, {
        title: `Your ${brand.name} receipt`,
        preview: `${money.format(total)} paid on ${formatDate(v.paid, brand.lang ?? "en", { month: "long", day: "numeric" })}. Thanks.`,
        children: (
          <>
            <Column style={{ gap: token("spacing.xs"), alignItems: "center", textAlign: "center", padding: [0, 0, token("spacing.sm")] }}>
              <MinimalKicker color="primary">Payment received</MinimalKicker>
              <Heading level={1}>{money.format(total)}</Heading>
              <Text field="paid" style={{ color: token("colors.muted") }}>
                Paid on {paid}
                {v.method ? ` with ${v.method}` : ""}
              </Text>
            </Column>
            <Table field="items">
              <TableRow header>
                <TableCell style={{ ...line, ...quiet }}>Item</TableCell>
                <TableCell style={{ ...line, ...quiet, textAlign: "right", width: 110 }}>Amount</TableCell>
              </TableRow>
              {v.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell style={line}>
                    {item.description}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </TableCell>
                  <TableCell style={{ ...line, textAlign: "right", width: 110 }}>{money.format(item.quantity * item.price)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell style={{ padding: [token("spacing.sm"), 0], fontWeight: 700 }}>Total paid</TableCell>
                <TableCell style={{ padding: [token("spacing.sm"), 0], fontWeight: 700, textAlign: "right", width: 110 }}>{money.format(total)}</TableCell>
              </TableRow>
            </Table>
            <Row stackOnMobile={false} style={{ backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: token("spacing.md"), gap: token("spacing.md") }}>
              <Column>
                <Text style={quiet}>Receipt number</Text>
                <Text field="number" style={{ fontWeight: 700 }}>{v.number}</Text>
              </Column>
              <Column>
                <Text style={{ ...quiet, textAlign: "right" }}>Date paid</Text>
                <Text style={{ fontWeight: 700, textAlign: "right" }}>{paid}</Text>
              </Column>
            </Row>
            <Text style={{ color: token("colors.muted") }}>Keep this email for your records. To ask about a charge, reply to it.</Text>
          </>
        ),
      });
    },
  });
}
