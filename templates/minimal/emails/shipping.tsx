import { Button, Column, Heading, Row, Text, token } from "@hyper-elements/react";
import { formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { shipping } from "../../_categories/shipping";
import { MinimalKicker, minimalEmail, minimalHref, minimalRules } from "../parts";

export default function minimalShipping(brand: Brand) {
  return template({
    id: "templates.MinimalShippingEmail",
    version: "1.0.0",
    label: "Shipping",
    description: "An order on its way: when it should arrive, who's carrying it, a button to track it, and what's in the box",
    guidance: "Lead with when it arrives. One button, to track it.",
    root: "Email",
    fields: { ...shipping.required },
    rules: minimalRules(brand),
    example: { ...shipping.example },
    render(v) {
      const arrives = formatDate(v.arrives, brand.lang ?? "en", { weekday: "long", month: "long", day: "numeric" });
      const quiet = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;
      return minimalEmail(brand, {
        title: `Your ${brand.name} order ${v.number} is on its way`,
        preview: `It should arrive by ${arrives}, with ${v.carrier}.`,
        band: (
          <>
            <MinimalKicker color="primaryForeground">On its way</MinimalKicker>
            <Heading level={1} style={{ color: token("colors.primaryForeground") }}>
              Your order has shipped
            </Heading>
          </>
        ),
        children: (
          <>
            <Column style={{ backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: token("spacing.lg"), gap: 2 }}>
              <Text style={quiet}>Arrives by</Text>
              <Text field="arrives" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25 }}>{arrives}</Text>
              <Text field="carrier" style={{ color: token("colors.muted") }}>
                With {v.carrier}, order {v.number}
              </Text>
            </Column>
            <Button field="tracking" href={minimalHref(brand, v.tracking)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
              Track your parcel
            </Button>
            <Column field="items" style={{ gap: token("spacing.xs"), padding: [token("spacing.sm"), 0, 0] }}>
              <Text style={{ fontWeight: 700 }}>In the box</Text>
              {v.items.map((item, i) => (
                <Row key={i} stackOnMobile={false} style={{ gap: token("spacing.md") }}>
                  <Column>
                    <Text>{item.description}</Text>
                  </Column>
                  <Column style={{ width: 60 }}>
                    <Text style={{ color: token("colors.muted"), textAlign: "right" }}>× {String(item.quantity)}</Text>
                  </Column>
                </Row>
              ))}
            </Column>
          </>
        ),
      });
    },
  });
}
