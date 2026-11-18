import { Column, Document, Heading, Image, Row, Text, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { ticket } from "../../_categories/ticket";
import { summitDate, summitLinks } from "../parts";

export default function summitTicketDocument(brand: Brand) {
  return template({
    id: "templates.SummitTicketDocument",
    version: "1.0.0",
    label: "Ticket",
    description: "A ticket as a PDF: the event on a band of the brand's color, who it's for, when and where, and the code to show at the door",
    guidance: "One ticket per person. The code is what the door checks.",
    root: "Document",
    fields: { ...ticket.required },
    rules: { require: { core: ["layout/overflow", "document/overflow"] }, links: summitLinks(brand) },
    example: { ...ticket.example },
    render(v) {
      const day = summitDate(brand, v.starts, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const label = { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: token("colors.muted") } as const;
      return (
        <Document
          size="A5"
          orientation="landscape"
          margin={32}
          title={`Ticket for ${v.event}, ${v.holder}`}
          lang={brand.lang ?? "en"}
          {...(brand.dir ? { dir: brand.dir } : {})}
          theme={brand.theme}
          fonts={brand.fonts}
          style={{ fontSize: 12, lineHeight: token("lineHeights.body") }}
        >
          <Document.Page>
            <Row style={{ border: { width: 1, style: "solid", color: token("colors.border") }, borderRadius: token("radii.md") }}>
              <Column style={{ width: 200, backgroundColor: token("colors.primary"), color: token("colors.primaryForeground"), padding: token("spacing.lg"), gap: token("spacing.sm"), borderRadius: { topLeft: token("radii.md"), bottomLeft: token("radii.md") } }}>
                <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Admit one</Text>
                <Heading field="event" level={2} style={{ color: token("colors.primaryForeground") }}>{v.event}</Heading>
                <Text field="starts">{day}</Text>
              </Column>
              <Column style={{ padding: token("spacing.lg"), gap: token("spacing.md") }}>
                <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 120 }} />
                <Row style={{ gap: token("spacing.lg") }}>
                  <Column field="holder" style={{ gap: 2 }}>
                    <Text style={label}>Ticket holder</Text>
                    <Text style={{ fontSize: 16, fontWeight: 700 }}>{v.holder}</Text>
                  </Column>
                  <Column field="time" style={{ gap: 2 }}>
                    <Text style={label}>Doors open</Text>
                    <Text style={{ fontSize: 16, fontWeight: 700 }}>{v.time}</Text>
                  </Column>
                </Row>
                <Column field="place" style={{ gap: 2 }}>
                  <Text style={label}>Where</Text>
                  <Text>{v.place}</Text>
                </Column>
                <Column field="code" style={{ backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.md")], gap: 2 }}>
                  <Text style={label}>Show this at the door</Text>
                  <Text style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>{v.code}</Text>
                </Column>
              </Column>
            </Row>
          </Document.Page>
        </Document>
      );
    },
  });
}
