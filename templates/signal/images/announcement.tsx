import { Canvas, Circle, Column, Heading, Image, Layer, Path, Row, Svg, Text, prop, token } from "@hyper-elements/react";
import { field, fitInside, formatDate, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { announcement } from "../../_categories/announcement";

// Each format's layout. It's the template's: no value changes it.
const SIGNAL_LAYOUT = {
  square: { width: 1080, height: 1080, words: 952, headline: [72, 64, 56], text: 30, art: { width: 952, height: 420 }, shot: { width: 512, height: 320 } },
  landscape: { width: 1200, height: 630, words: 504, headline: [52, 46, 40], text: 23, art: { width: 552, height: 566 }, shot: { width: 456, height: 285 } },
} as const;

const ASSET_BASE = "https://hyperelements.dev/generated/kits/assets/kits/signal/";

export default function signalAnnouncement(brand: Brand) {
  return template({
    id: "templates.SignalAnnouncementCanvas",
    version: "1.0.0",
    label: "Launch graphic",
    description: "A product launch for social posts: the date, a headline fitted to three lines, three features, and the product shown in a window over artwork",
    guidance: "For launches only. Sentence case, no emoji, no exclamation marks.",
    root: "Canvas",
    formats: { square: { width: 1080, height: 1080 }, landscape: { width: 1200, height: 630 } },
    fields: {
      ...announcement.required,
      features: prop.list(prop.text({ label: "Feature", maxLength: 40 }), { label: "Features", required: true, min: 3, max: 3 }),
      screenshot: field.image({ label: "Product screenshot", required: true, fit: "contain", aspect: { min: 1.2, max: 2 }, minWidth: 1000, accepts: ["png", "jpeg"] }),
      artwork: field.image({ label: "Artwork", required: true, fit: "cover", maxCrop: 0.6, accepts: ["png", "jpeg"], guidance: "Bold flat shapes. No text, logos or people." }),
    },
    // What only measuring decides has to hold: nothing past the Canvas, a font for every character, a headline that fits.
    rules: { require: { core: ["canvas/overflow", "image/overflow", "image/glyph", "image/fit"] } },
    example: {
      ...announcement.example,
      features: ["Drafts from merged changes", "Your voice, every release", "Ships to chat and email"],
      screenshot: { src: `${ASSET_BASE}screenshot.png`, width: 1600, height: 1000 },
      artwork: { src: `${ASSET_BASE}artwork.png`, width: 1600, height: 1200 },
    },
    render(v, { format }) {
      const f = SIGNAL_LAYOUT[format];
      const logo = <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 180 }} />;
      const words = (
        <Column style={{ width: f.words, gap: 18 }}>
          <Row style={{ gap: 10, alignItems: "center" }}>
            <Svg width={14} height={14}>
              <Circle cx={7} cy={7} r={7} style={{ fill: token("colors.accent") }} />
            </Svg>
            <Text field="date" style={{ color: token("colors.primary"), fontSize: f.text - 3, fontWeight: 700, lineHeight: 1.2, letterSpacing: 2, textTransform: "uppercase" }}>
              {formatDate(v.date, brand.lang ?? "en", { month: "long", day: "numeric" })}
            </Text>
          </Row>
          {/* The headline is drawn at the largest size that fits it in three lines. What's under it follows it. */}
          <Heading field="headline" level={1} fit={{ sizes: [...f.headline], maxLines: 3 }} style={{ lineHeight: 1.06 }}>
            {v.headline}
          </Heading>
          <Column style={{ gap: 8 }}>
            {v.features.map((feature, i) => (
              <Row key={i} style={{ gap: 12, alignItems: "center" }}>
                <Svg width={f.text - 2} height={f.text - 2} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={12} style={{ fill: token("colors.primary") }} />
                  <Path d="M6.5 12.5 L10.5 16.5 L17.5 8.5" style={{ fill: "transparent", stroke: token("colors.primaryForeground"), strokeWidth: 2.6 }} />
                </Svg>
                <Text field={`features[${i}]`} style={{ fontSize: f.text, lineHeight: 1.3 }}>
                  {feature}
                </Text>
              </Row>
            ))}
          </Column>
        </Column>
      );
      // The screenshot, shown whole in a window of the template's own.
      const shot = fitInside(v.screenshot, f.shot);
      const product = (
        <Column style={{ width: shot.width + 4, backgroundColor: token("colors.surface"), border: { width: 2, style: "solid", color: token("colors.foreground") }, borderRadius: token("radii.md"), overflow: "hidden" }}>
          <Row style={{ padding: [11, 14] }}>
            <Svg width={52} height={12}>
              <Circle cx={6} cy={6} r={6} style={{ fill: token("colors.primary") }} />
              <Circle cx={26} cy={6} r={6} style={{ fill: token("colors.accent") }} />
              <Circle cx={46} cy={6} r={6} style={{ fill: token("colors.border") }} />
            </Svg>
          </Row>
          <Image field="screenshot" src={v.screenshot} alt="The product" style={shot} />
        </Column>
      );
      // The artwork fills a panel, and the product sits in the middle of it.
      const art = (
        <Layer style={{ ...f.art, borderRadius: token("radii.md"), alignItems: "center", justifyItems: "center" }}>
          <Image field="artwork" src={v.artwork} alt="" />
          {product}
        </Layer>
      );
      return (
        <Canvas
          width={f.width}
          height={f.height}
          fonts={brand.fonts}
          lang={brand.lang ?? "en"}
          {...(brand.dir ? { dir: brand.dir } : {})}
          theme={brand.theme}
        >
          {format === "square" ? (
            <Column style={{ height: f.height, padding: 64, justifyContent: "space-between" }}>
              {logo}
              {words}
              {art}
            </Column>
          ) : (
            <Row style={{ height: f.height, padding: [32, 32, 32, 64], gap: 48 }}>
              <Column style={{ width: f.words, height: f.art.height, padding: [24, 0], justifyContent: "space-between" }}>
                {logo}
                {words}
              </Column>
              {art}
            </Row>
          )}
        </Canvas>
      );
    },
  });
}
