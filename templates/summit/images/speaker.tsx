import { Canvas, Circle, Column, Heading, Image, Layer, Path, Row, Svg, Text, token } from "@hyper-elements/react";
import { field, template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { speaker } from "../../_categories/speaker";
import { summitDate } from "../parts";

const SUMMIT_ASSETS = "https://hyperelements.dev/generated/kits/assets/kits/summit/";

// Each format's layout: the canvas, its padding, the photo's block and circle, and the sizes the name and talk are
// fitted from. It's the template's: no value changes it.
const SUMMIT_SPEAKER = {
  square: { width: 1080, height: 1080, pad: 72, art: 580, photo: 460, name: [84, 76, 68, 60], talk: [36, 32, 28], words: 936 },
  landscape: { width: 1200, height: 630, pad: 56, art: 512, photo: 380, name: [64, 56, 50, 44], talk: [28, 26, 24], words: 560 },
} as const;

/** The photo in a circle, over shapes in the brand's colors: a disc behind it, a ring around it, and a grid of dots. */
function SummitPortrait({ src, size, photo }: { src: { src: string; width: number; height: number }; size: number; photo: number }) {
  const c = size / 2;
  const r = photo / 2;
  const dots = [0, 1, 2, 3, 4].flatMap((row) => [0, 1, 2, 3, 4].map((col) => ({ cx: 18 + col * 24, cy: size - 120 + row * 24 })));
  return (
    <Layer style={{ width: size, height: size, alignItems: "center", justifyItems: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={c + r * 0.16} cy={c + r * 0.16} r={r + 6} style={{ fill: token("colors.primary") }} />
        <Circle cx={c - r * 0.06} cy={c - r * 0.08} r={r + 26} style={{ fill: "transparent", stroke: token("colors.accent"), strokeWidth: 5 }} />
        {dots.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={5} style={{ fill: token("colors.accent") }} />
        ))}
        <Circle cx={size - 34} cy={46} r={22} style={{ fill: token("colors.accent") }} />
        <Path d={`M${size - 150},${size - 26} q18,-22 36,0 t36,0 t36,0 t36,0`} style={{ fill: "transparent", stroke: token("colors.primary"), strokeWidth: 6 }} />
      </Svg>
      <Layer field="photo" style={{ width: photo, height: photo, borderRadius: r, border: { width: 10, style: "solid", color: token("colors.background") } }}>
        <Image src={src} alt="" />
      </Layer>
    </Layer>
  );
}

export default function summitSpeakerCanvas(brand: Brand) {
  return template({
    id: "templates.SummitSpeakerCanvas",
    version: "1.1.0",
    label: "Speaker card",
    description: "A card announcing one speaker, for social posts: their photo in a circle over shapes in the brand's colors, their name and role, their talk in a block of color, and the event and date",
    guidance: "One speaker per card. The talk's title as it'll be on the schedule. A head-and-shoulders photo, the face in the middle.",
    root: "Canvas",
    formats: { square: { width: 1080, height: 1080 }, landscape: { width: 1200, height: 630 } },
    fields: {
      ...speaker.required,
      photo: field.image({ label: "Photo", required: true, fit: "cover", maxCrop: 0.4, aspect: { min: 0.75, max: 1.34 }, minWidth: 600, accepts: ["png", "jpeg"], guidance: "A head-and-shoulders photo of the speaker, the face in the middle" }),
    },
    rules: { require: { core: ["canvas/overflow", "image/overflow", "image/glyph", "image/fit"] } },
    example: { ...speaker.example, photo: { src: `${SUMMIT_ASSETS}speaker.jpg`, width: 800, height: 800 } },
    render(v, { format }) {
      const f = SUMMIT_SPEAKER[format];
      const logo = <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 170 }} />;
      const badge = (
        <Column style={{ width: 176, backgroundColor: token("colors.primary"), borderRadius: 999, padding: [10, 0] }}>
          <Text style={{ color: token("colors.primaryForeground"), fontSize: 22, fontWeight: 700, letterSpacing: 2, lineHeight: 1.2, textTransform: "uppercase", textAlign: "center" }}>Speaker</Text>
        </Column>
      );
      const when = (
        <Text field="event" style={{ fontSize: format === "square" ? 26 : 22, fontWeight: 700, letterSpacing: 1.5, lineHeight: 1.2, textTransform: "uppercase", color: token("colors.primary") }}>
          {v.event} · {summitDate(brand, v.starts, { month: "long", day: "numeric" })}
        </Text>
      );
      const who = (
        <Column style={{ gap: 10 }}>
          <Heading field="name" level={1} fit={{ sizes: [...f.name], maxLines: 2 }} style={{ lineHeight: 1.02, letterSpacing: -1 }}>{v.name}</Heading>
          <Text field="role" style={{ fontSize: format === "square" ? 28 : 23, lineHeight: 1.3, color: token("colors.muted") }}>{v.role}</Text>
        </Column>
      );
      const talk = (
        <Column field="talk" style={{ width: f.words, backgroundColor: token("colors.primary"), borderRadius: token("radii.md"), padding: format === "square" ? [26, 32] : [20, 26] }}>
          <Text fit={{ sizes: [...f.talk], maxLines: format === "square" ? 2 : 3 }} style={{ color: token("colors.primaryForeground"), fontWeight: 700, lineHeight: 1.22 }}>“{v.talk}”</Text>
        </Column>
      );
      const portrait = <SummitPortrait src={v.photo} size={f.art} photo={f.photo} />;
      return (
        <Canvas width={f.width} height={f.height} fonts={brand.fonts} lang={brand.lang ?? "en"} {...(brand.dir ? { dir: brand.dir } : {})} theme={brand.theme}>
          {format === "square" ? (
            <Column style={{ height: f.height, padding: f.pad, justifyContent: "space-between" }}>
              <Row style={{ alignItems: "start", justifyContent: "space-between" }}>
                <Column style={{ height: f.art, padding: [12, 0, 8], justifyContent: "space-between" }}>
                  <Column style={{ gap: 28 }}>
                    {logo}
                    {badge}
                  </Column>
                  <Column field="starts" style={{ gap: 6 }}>
                    <Text style={{ fontSize: 76, fontWeight: 700, lineHeight: 1, letterSpacing: -1, color: token("colors.primary") }}>{summitDate(brand, v.starts, { month: "short", day: "numeric" })}</Text>
                    <Text field="event" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, letterSpacing: 1.5, textTransform: "uppercase" }}>{v.event}</Text>
                  </Column>
                </Column>
                {portrait}
              </Row>
              <Column style={{ gap: 22 }}>
                {who}
                {talk}
              </Column>
            </Column>
          ) : (
            <Row style={{ height: f.height, padding: [f.pad, 40, f.pad, f.pad], gap: 32, alignItems: "center" }}>
              <Column style={{ width: f.words, height: f.height - 2 * f.pad, justifyContent: "space-between" }}>
                <Row style={{ alignItems: "center", gap: 24 }}>
                  {logo}
                  {badge}
                </Row>
                <Column style={{ gap: 18 }}>
                  {when}
                  {who}
                  {talk}
                </Column>
              </Column>
              {portrait}
            </Row>
          )}
        </Canvas>
      );
    },
  });
}
