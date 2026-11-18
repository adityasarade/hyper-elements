import type { ReactNode } from "react";
import { Column, Document, Heading, Image, Layer, Polygon, Row, Svg, Text, token } from "@hyper-elements/react";
import { field, formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { certificate } from "../../_categories/certificate";

const LAUREL_ASSETS = "https://hyperelements.dev/generated/kits/assets/kits/laurel/";

/** The points of a seal's edge: a star of `points` points between two radii, around (c, c). */
function laurelSealEdge(c: number, outer: number, inner: number, points: number): string {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

/** The seal: a disc of the brand's color with a notched edge and ribbon tails, "Certified" and the year on it. */
function LaurelSeal({ year, size = 132 }: { year: string; size?: number }) {
  const c = size / 2;
  const tail = (x: number) => `${x},${c} ${x + 26},${c} ${x + 26},${size + 34} ${x + 13},${size + 22} ${x},${size + 34}`;
  return (
    <Layer style={{ width: size, height: size + 34, alignItems: "start", justifyItems: "center" }}>
      <Svg width={size} height={size + 34} viewBox={`0 0 ${size} ${size + 34}`}>
        <Polygon points={tail(c - 34)} style={{ fill: token("colors.accent") }} />
        <Polygon points={tail(c + 8)} style={{ fill: token("colors.accent") }} />
        <Polygon points={laurelSealEdge(c, c, c - 7, 28)} style={{ fill: token("colors.primary") }} />
      </Svg>
      <Column style={{ padding: [13, 0, 0] }}>
        <Column style={{ width: size - 26, height: size - 26, borderRadius: (size - 26) / 2, backgroundColor: token("colors.primary"), border: { width: 1.5, style: "solid", color: token("colors.primaryForeground") }, justifyContent: "center", alignItems: "center", gap: 2 }}>
          <Text style={{ color: token("colors.primaryForeground"), fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", textAlign: "center" }}>Certified</Text>
          <Text style={{ color: token("colors.primaryForeground"), fontSize: 24, fontWeight: 700, lineHeight: 1.1, textAlign: "center" }}>{year}</Text>
          <Text style={{ color: token("colors.primaryForeground"), fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", textAlign: "center" }}>Awarded</Text>
        </Column>
      </Column>
    </Layer>
  );
}

/** Whether a `#rgb` or `#rrggbb` color is light: dark ink reads on it better than light ink does. */
function laurelIsLight(color: string): boolean {
  const hex = color.length === 4 ? color.replace(/[0-9a-f]/gi, (d) => d + d) : color;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b! > 0.18;
}

export default function laurelCertificate(brand: Brand) {
  // The example's signature is in ink that reads on the brand's background: dark on a light page, light on a dark one.
  const ink = laurelIsLight((brand.theme.colors as Record<string, string>).background!) ? "dark" : "light";
  return template({
    id: "templates.LaurelCertificateDocument",
    version: "1.1.0",
    label: "Certificate",
    description: "A certificate on a landscape page: a double frame, the recipient's photo and name, what they achieved, the date, a seal, and the signer's signature",
    guidance: "Say what was achieved as a phrase that follows \"for\": \"Completed the … course\".",
    root: "Document",
    formats: { a4: { size: "A4", orientation: "landscape" }, letter: { size: "Letter", orientation: "landscape" } },
    fields: {
      ...certificate.required,
      photo: field.image({ label: "Recipient's photo", fit: "cover", maxCrop: 0.4, aspect: { min: 0.75, max: 1.34 }, minWidth: 300, accepts: ["png", "jpeg"], guidance: "A head-and-shoulders photo, the face in the middle" }),
      signature: field.image({ label: "Signature", aspect: { min: 2, max: 5 }, minWidth: 300, accepts: ["png"], transparent: "required", guidance: "The signer's signature on a transparent background, in ink that reads on your page" }),
    },
    rules: { require: { core: ["layout/overflow", "document/overflow"] }, links: { domains: brand.links.domains } },
    example: {
      ...certificate.example,
      photo: { src: `${LAUREL_ASSETS}recipient.jpg`, width: 600, height: 600 },
      signature: { src: `${LAUREL_ASSETS}signature-${ink}.png`, width: 740, height: 240 },
    },
    render(v, { format }) {
      // The page's height inside its margins (A4 and Letter, landscape, at 96px to the inch), for a frame that fills it.
      const height = (format === "letter" ? 816 : 794) - 2 * 28;
      const awarded = formatDate(v.awarded, brand.lang ?? "en", { month: "long", day: "numeric", year: "numeric" });
      const quiet = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;
      // A line to sign on, with what's over it (the date, or the signature) and what it is under it.
      const line = (over: ReactNode, name: string, role: string | undefined, field: string) => (
        <Column field={field} style={{ width: 230, gap: 4, alignItems: "center" }}>
          <Column style={{ height: 64, justifyContent: "end", alignItems: "center" }}>{over}</Column>
          <Column style={{ width: 230, border: { top: { width: 1, style: "solid", color: token("colors.foreground") } } }} />
          <Text style={{ fontWeight: 700, textAlign: "center" }}>{name}</Text>
          {role ? <Text style={{ ...quiet, textAlign: "center" }}>{role}</Text> : null}
        </Column>
      );
      return (
        <Document size={format === "letter" ? "Letter" : "A4"} orientation="landscape" margin={28} title={`Certificate for ${v.recipient}, ${brand.name}`} lang={brand.lang ?? "en"} {...(brand.dir ? { dir: brand.dir } : {})} theme={brand.theme} fonts={brand.fonts} style={{ fontSize: 13, lineHeight: token("lineHeights.body") }}>
          <Document.Page>
            <Column style={{ height, border: { width: 3, style: "solid", color: token("colors.primary") }, padding: 8 }}>
              <Column style={{ height: height - 22, border: { width: 1, style: "solid", color: token("colors.border") }, padding: [32, 56, 28], gap: 18, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 150 }} />
                <Text style={{ fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: token("colors.primary") }}>Certificate of achievement</Text>
                {v.photo ? (
                  <Column style={{ width: 128, padding: 4, borderRadius: 64, border: { width: 2, style: "solid", color: token("colors.primary") } }}>
                    <Layer field="photo" style={{ width: 116, height: 116, borderRadius: 58 }}>
                      <Image src={v.photo} alt={`${v.recipient}`} />
                    </Layer>
                  </Column>
                ) : null}
                <Column style={{ gap: token("spacing.xs"), alignItems: "center" }}>
                  <Text style={{ color: token("colors.muted") }}>This certifies that</Text>
                  <Heading field="recipient" level={1} style={{ textAlign: "center" }}>{v.recipient}</Heading>
                </Column>
                <Text field="achievement" style={{ fontSize: 16, maxWidth: 640, textAlign: "center" }}>{v.achievement}</Text>
                <Row style={{ gap: 48, justifyContent: "center", alignItems: "center" }}>
                  {line(<Text style={{ fontSize: 15 }}>{awarded}</Text>, "Date awarded", `Awarded by ${brand.name}`, "awarded")}
                  <LaurelSeal year={v.awarded.slice(0, 4)} />
                  {line(v.signature ? <Image field="signature" src={v.signature} alt={`${v.signer.name}'s signature`} style={{ width: 180 }} /> : null, v.signer.name, v.signer.role, "signer")}
                </Row>
              </Column>
            </Column>
          </Document.Page>
        </Document>
      );
    },
  });
}
