// templates/launch-graphic.tsx
import { Canvas, Column, Heading, Image, Layer, Row, Text, prop } from "@hyper-elements/react";
import { field, fitInside, formatDate, template } from "@hyper-elements/react/template";

// The brand's fonts: a file for each weight the design uses.
const FONTS = [
  { family: "Inter", src: "../fonts/Inter-Regular.ttf", weight: 400 },
  { family: "Inter", src: "../fonts/Inter-Bold.ttf", weight: 700 },
];

// Each format's layout. It's the template's: no value changes it.
const LAYOUT = {
  square: { width: 1080, height: 1080, padding: 72, gap: 32, words: 936, headline: { height: 264, sizes: [72, 64, 56, 48] }, text: 30, art: { width: 936, height: 343 } },
  landscape: { width: 1200, height: 630, padding: 56, gap: 24, words: 548, headline: { height: 186, sizes: [56, 48, 40] }, text: 24, art: { width: 504, height: 518 } },
} as const;

export default template({
  id: "acme.LaunchGraphic",
  version: "1.0.0",
  label: "Product launch graphic",
  guidance: "For product launches only. Sentence case, no emoji, no exclamation marks.",
  root: "Canvas",
  formats: { square: { width: 1080, height: 1080 }, landscape: { width: 1200, height: 630 } },
  fields: {
    headline: prop.text({ label: "Headline", required: true, maxLength: 90 }),
    features: prop.list(prop.text({ label: "Feature", maxLength: 40 }), { label: "Features", required: true, min: 3, max: 3 }),
    launchDate: prop.date({ label: "Launch date", required: true }),
    locale: prop.choice(["en-US", "de-DE"], { label: "Language", default: "en-US" }),
    screenshot: field.image({ label: "Product screenshot", required: true, fit: "contain", aspect: { min: 1.2, max: 2 }, minWidth: 1000, accepts: ["png"] }),
    artwork: field.image({ label: "Artwork", required: true, fit: "cover", maxCrop: 0.6, accepts: ["png"], guidance: "Abstract light waves in violet and teal. No text, logos or people." }),
  },
  // What only measuring decides has to hold: nothing past the Canvas, a font for every character, a headline that fits.
  rules: { require: { core: ["image/overflow", "image/glyph", "image/fit"] } },
  example: {
    headline: "Meet Orbit 3.0: release notes that write themselves",
    features: ["Drafts from merged PRs", "Your voice, every release", "Ships to Slack and email"],
    launchDate: "2026-12-03",
    screenshot: { src: "../designs/art/screenshot.png", width: 1200, height: 750 },
    artwork: { src: "../designs/art/waves.png", width: 1080, height: 680 },
  },
  render(v, { format }) {
    const f = LAYOUT[format];
    const words = (
      <Column style={{ width: f.words, gap: 16 }}>
        {/* The headline's room is fixed, and its size is the largest that fits it in three lines. */}
        <Column style={{ height: f.headline.height }}>
          <Heading field="headline" level={1} fit={{ sizes: [...f.headline.sizes], maxLines: 3 }} style={{ color: "#f7f7fb", lineHeight: 1.1 }}>
            {v.headline}
          </Heading>
        </Column>
        <Column style={{ gap: 8 }}>
          {v.features.map((feature, i) => (
            <Text key={i} field={`features[${i}]`} style={{ color: "#c7d2fe", fontSize: f.text, lineHeight: 1.3 }}>
              {feature}
            </Text>
          ))}
        </Column>
        <Text field="launchDate" style={{ color: "#2dd4bf", fontSize: f.text - 2, fontWeight: 700, lineHeight: 1.25 }}>
          {formatDate(v.launchDate, v.locale, { dateStyle: "long" })}
        </Text>
      </Column>
    );
    // The artwork covers its region; the screenshot is shown whole over it.
    const art = (
      <Layer style={{ ...f.art, alignItems: "center", justifyItems: "center" }}>
        <Image field="artwork" src={v.artwork} alt="" />
        <Image field="screenshot" src={v.screenshot} alt="The product" style={fitInside(v.screenshot, { width: f.art.width - 48, height: f.art.height - 48 })} />
      </Layer>
    );
    const logo = <Image src={{ src: "./assets/orbit-logo.png", width: 252, height: 128 }} alt="Orbit" style={{ width: 126 }} />;
    return (
      <Canvas width={f.width} height={f.height} fonts={FONTS} lang={v.locale} style={{ backgroundColor: "#0b1020", fontFamily: "Inter", padding: f.padding }}>
        {format === "square" ? (
          <Column style={{ gap: f.gap }}>
            {logo}
            {words}
            {art}
          </Column>
        ) : (
          <Row style={{ gap: 36 }}>
            <Column style={{ width: f.words, gap: f.gap }}>
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
