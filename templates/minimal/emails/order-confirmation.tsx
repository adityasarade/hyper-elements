import { Column, Heading, LineBreak, Link, Row, Span, Table, TableCell, TableRow, Text, token } from "@hyper-elements/react";
import { formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { orderConfirmation } from "../../_categories/order-confirmation";
import { MinimalKicker, minimalEmail, minimalHref, minimalRules } from "../parts";

export default function minimalOrderConfirmation(brand: Brand) {
  return template({
    id: "templates.MinimalOrderConfirmationEmail",
    version: "1.0.0",
    label: "Order confirmation",
    description: "An order confirmed: its number and date, the items with the total, and where it's going",
    guidance: "Describe each item as the store names it. The total is added up for you.",
    root: "Email",
    fields: { ...orderConfirmation.required },
    rules: minimalRules(brand),
    example: { ...orderConfirmation.example },
    render(v) {
      const money = new Intl.NumberFormat(brand.lang ?? "en", { style: "currency", currency: v.currency });
      const total = v.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const placed = formatDate(v.placed, brand.lang ?? "en", { month: "long", day: "numeric", year: "numeric" });
      const line = { padding: [token("spacing.sm"), 0], border: { bottom: { width: 1, style: "solid", color: token("colors.border") } } } as const;
      const quiet = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;
      const first = v.shipTo.name.split(" ")[0];
      return minimalEmail(brand, {
        title: `Your ${brand.name} order ${v.number}`,
        preview: `Order ${v.number} is confirmed: ${money.format(total)}. We'll email you when it ships.`,
        band: (
          <>
            <MinimalKicker color="primaryForeground">Order confirmed</MinimalKicker>
            <Heading level={1} style={{ color: token("colors.primaryForeground") }}>
              Thanks for your order, {first}
            </Heading>
          </>
        ),
        children: (
          <>
            <Text>We've got it, and we'll email you again when it ships.</Text>
            <Row stackOnMobile={false} style={{ gap: token("spacing.md") }}>
              <Column>
                <Text style={quiet}>Order</Text>
                <Text field="number" style={{ fontWeight: 700 }}>{v.number}</Text>
              </Column>
              <Column>
                <Text style={{ ...quiet, textAlign: "right" }}>Placed on</Text>
                <Text field="placed" style={{ fontWeight: 700, textAlign: "right" }}>{placed}</Text>
              </Column>
            </Row>
            <Table field="items">
              {v.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell style={line}>
                    {item.description}
                    <LineBreak />
                    <Span style={quiet}>Quantity {String(item.quantity)}</Span>
                  </TableCell>
                  <TableCell style={{ ...line, textAlign: "right", width: 110 }}>{money.format(item.quantity * item.price)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell style={{ padding: [token("spacing.sm"), 0], fontWeight: 700 }}>Total</TableCell>
                <TableCell style={{ padding: [token("spacing.sm"), 0], fontWeight: 700, textAlign: "right", width: 110 }}>{money.format(total)}</TableCell>
              </TableRow>
            </Table>
            <Column field="shipTo" style={{ backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: token("spacing.md"), gap: 2 }}>
              <Text style={quiet}>Shipping to</Text>
              <Text style={{ fontWeight: 700 }}>{v.shipTo.name}</Text>
              {v.shipTo.address.map((part, i) => (
                <Text key={i}>{part}</Text>
              ))}
            </Column>
            <Text style={{ color: token("colors.muted") }}>
              Need to change something? Reply within the hour, or see <Link href={minimalHref(brand, `/orders/${v.number}`)}>order {v.number}</Link>.
            </Text>
          </>
        ),
      });
    },
  });
}
