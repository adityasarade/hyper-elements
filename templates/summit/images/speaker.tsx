import { Canvas, Column, Heading, Image, Row, Text, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { speaker } from "../../_categories/speaker";
import { summitDate } from "../parts";

const SUMMIT_SPEAKER = {
  square: { width: 1080, height: 1080, pad: 80, name: [72, 64, 56, 48], talk: [40, 36, 32], ring: 300 },
  landscape: { width: 1200, height: 630, pad: 64, name: [60, 52, 46, 40], talk: [32, 28, 24], ring: 280 },
} as const;

export default function summitSpeakerCanvas(brand: Brand) {
  return template({
    id: "templates.SummitSpeakerCanvas",
    version: "1.0.0",
    label: "Speaker card",
    description: "A card announcing one speaker: their initials in a circle of the brand's color, their name and role, and their talk, for social posts",
    guidance: "One speaker per card. The talk's title as it'll be on the schedule.",
    root: "Canvas",
    formats: { square: { width: 1080, height: 1080 }, landscape: { width: 1200, height: 630 } },
    fields: { ...speaker.required },
    rules: { require: { core: ["canvas/overflow", "image/overflow", "image/glyph", "image/fit"] } },
    example: { ...speaker.example },
    render(v, { format }) {
      const f = SUMMIT_SPEAKER[format];
      const initials = v.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");
      const ring = (
        <Column style={{ width: f.ring, height: f.ring, backgroundColor: token("colors.primary"), borderRadius: f.ring / 2, justifyContent: "center" }}>
          <Text style={{ color: token("colors.primaryForeground"), fontSize: f.ring * 0.36, fontWeight: 700, lineHeight: 1, textAlign: "center" }}>{initials}</Text>
        </Column>
      );
      const words = (
        <Column style={{ gap: 20 }}>
          <Text field="event" style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: token("colors.primary") }}>
            Speaking at {v.event} · {summitDate(brand, v.starts, { month: "long", day: "numeric" })}
          </Text>
          <Heading field="name" level={1} fit={{ sizes: [...f.name], maxLines: 2 }} style={{ lineHeight: 1.05 }}>{v.name}</Heading>
          <Text field="role" style={{ fontSize: 26, color: token("colors.muted") }}>{v.role}</Text>
          <Text field="talk" fit={{ sizes: [...f.talk], maxLines: 3 }} style={{ fontWeight: 700, lineHeight: 1.25 }}>“{v.talk}”</Text>
        </Column>
      );
      const logo = <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 180 }} />;
      return (
        <Canvas width={f.width} height={f.height} fonts={brand.fonts} lang={brand.lang ?? "en"} {...(brand.dir ? { dir: brand.dir } : {})} theme={brand.theme}>
          {format === "square" ? (
            <Column style={{ height: f.height, padding: f.pad, justifyContent: "space-between" }}>
              <Row style={{ alignItems: "center", justifyContent: "space-between" }}>
                {logo}
                {ring}
              </Row>
              {words}
            </Column>
          ) : (
            <Row style={{ height: f.height, padding: f.pad, gap: 56, alignItems: "center" }}>
              <Column style={{ height: f.height - 2 * f.pad, justifyContent: "space-between" }}>
                {logo}
                {words}
              </Column>
              <Column style={{ width: f.ring }}>{ring}</Column>
            </Row>
          )}
        </Canvas>
      );
    },
  });
}
