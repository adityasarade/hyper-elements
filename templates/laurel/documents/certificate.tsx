import { Column, Document, Heading, Image, Row, Text, token } from "@hyper-elements/react";
import { formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { certificate } from "../../_categories/certificate";

export default function laurelCertificate(brand: Brand) {
  return template({
    id: "templates.LaurelCertificateDocument",
    version: "1.0.0",
    label: "Certificate",
    description: "A certificate on a landscape page: a double frame, the recipient's name large, what they achieved, the date, and who signs it",
    guidance: "Say what was achieved as a phrase that follows \"for\": \"Completed the … course\".",
    root: "Document",
    formats: { a4: { size: "A4", orientation: "landscape" }, letter: { size: "Letter", orientation: "landscape" } },
    fields: { ...certificate.required },
    rules: { require: { core: ["layout/overflow", "document/overflow"] }, links: { domains: brand.links.domains } },
    example: { ...certificate.example },
    render(v, { format }) {
      // The page's height inside its margins (A4 and Letter, landscape, at 96px to the inch), for a frame that fills it.
      const height = (format === "letter" ? 816 : 794) - 2 * 28;
      const awarded = formatDate(v.awarded, brand.lang ?? "en", { month: "long", day: "numeric", year: "numeric" });
      const quiet = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;
      const line = (top: string, bottom: string, field: string) => (
        <Column field={field} style={{ width: 220, gap: 4, alignItems: "center" }}>
          <Text style={{ fontWeight: 700, textAlign: "center" }}>{top}</Text>
          <Column style={{ width: 220, border: { top: { width: 1, style: "solid", color: token("colors.foreground") } } }} />
          <Text style={{ ...quiet, textAlign: "center" }}>{bottom}</Text>
        </Column>
      );
      return (
        <Document size={format === "letter" ? "Letter" : "A4"} orientation="landscape" margin={28} title={`Certificate for ${v.recipient}, ${brand.name}`} lang={brand.lang ?? "en"} {...(brand.dir ? { dir: brand.dir } : {})} theme={brand.theme} fonts={brand.fonts} style={{ fontSize: 13, lineHeight: token("lineHeights.body") }}>
          <Document.Page>
            <Column style={{ height, border: { width: 3, style: "solid", color: token("colors.primary") }, padding: 8 }}>
              <Column style={{ height: height - 22, border: { width: 1, style: "solid", color: token("colors.border") }, padding: [44, 64], gap: token("spacing.lg"), alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 150 }} />
                <Text style={{ fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: token("colors.primary") }}>Certificate of achievement</Text>
                <Column style={{ gap: token("spacing.xs"), alignItems: "center" }}>
                  <Text style={{ color: token("colors.muted") }}>This certifies that</Text>
                  <Heading field="recipient" level={1} style={{ textAlign: "center" }}>{v.recipient}</Heading>
                </Column>
                <Text field="achievement" style={{ fontSize: 16, maxWidth: 520, textAlign: "center" }}>{v.achievement}</Text>
                <Row style={{ gap: 64, justifyContent: "center", padding: [token("spacing.md"), 0, 0] }}>
                  {line(awarded, "Date awarded", "awarded")}
                  {line(v.signer.name, v.signer.role, "signer")}
                </Row>
              </Column>
            </Column>
          </Document.Page>
        </Document>
      );
    },
  });
}
