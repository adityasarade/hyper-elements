---
title: "Templates"
description: "Reusable designs with guardrails: fixed parts, typed fields, blocks and slots with their rules, and a check of the result before anything is rendered."
---

A template is a design your team writes once: the brand's parts are fixed, and a few parts are left open. People and
agents make designs from it by giving values, and the template checks each one before anything is drawn. It's
`@hyper-elements/react/template`, and it runs wherever a design does: no service, account or engine of its own.

<div class="output-gallery">
<figure><a href="/generated/templates-guide/orbit-square.png" title="Open the square launch graphic at full size"><img src="/generated/templates-guide/orbit-square.png" width="1080" height="1080" alt="The square launch graphic: Orbit's logo, the headline in three lines, three features, the launch date, and the product screenshot over the artwork"></a><figcaption>square, 1080×1080</figcaption></figure>
<figure><a href="/generated/templates-guide/orbit-landscape.png" title="Open the landscape launch graphic at full size"><img src="/generated/templates-guide/orbit-landscape.png" width="1200" height="630" alt="The landscape launch graphic: the same copy on the left, the product screenshot over the artwork on the right"></a><figcaption>landscape, 1200×630</figcaption></figure>
</div>

Both images came from one template and one set of values. This page builds that template, makes a design from it, and
shows what it refuses. Everything shown is what the commands wrote. Every option is in the reference:

- [Fields, images and formats](/docs/guides/templates-fields)
- [Slots, blocks and rules](/docs/guides/templates-slots)
- [Checks and diagnostics](/docs/guides/templates-checks)
- [Templates in the command line](/docs/guides/templates-cli)

## What a template is

<figure class="diagram"><a href="/generated/templates-guide/parts.svg" title="Open the diagram at full size"><img src="/generated/templates-guide/parts.svg" width="884" height="486" alt="The square launch graphic with its parts outlined. The logo is fixed. The headline, the three features, the launch date, the screenshot and the artwork are open fields. Everything else (layout, colors, fonts, sizes) is fixed."></a></figure>

- **Fixed parts** are the template's: the logo, the layout of each format, the colors and the fonts. No value can
  change them.
- **Open parts** are what a design gives. Here they're six **fields**, each with its rules. A template can also open
  **blocks** (approved section types, picked and ordered as data) and **slots** (JSX someone writes, with only the
  elements and styles the template allows).
- **Rules over the result** are checked on the finished design: here, that nothing runs past the Canvas, every
  character has a font, and the headline fits.

A **design** is one finished piece made from a template: this launch's graphic, this month's newsletter.

## 1. Write the template

A template is `template({ … })`: an id and a version, its formats, its fields, an example, and a `render` that builds
the design from the values. The fields say what's open, each with its rules:

```tsx
// from templates/launch-graphic.tsx
fields: {
  headline: prop.text({ label: "Headline", required: true, maxLength: 90 }),
  features: prop.list(prop.text({ label: "Feature", maxLength: 40 }), { label: "Features", required: true, min: 3, max: 3 }),
  launchDate: prop.date({ label: "Launch date", required: true }),
  locale: prop.choice(["en-US", "de-DE"], { label: "Language", default: "en-US" }),
  screenshot: field.image({ label: "Product screenshot", required: true, fit: "contain", aspect: { min: 1.2, max: 2 }, minWidth: 1000, accepts: ["png"] }),
  artwork: field.image({ label: "Artwork", required: true, fit: "cover", maxCrop: 0.6, accepts: ["png"], guidance: "Abstract light waves in violet and teal. No text, logos or people." }),
},
```

`render` gets the values and the format's name. Whatever it writes that isn't a field is fixed. A node says which
field it shows with `field="…"`, which is how the template's checks find it. The headline has a fixed room in each
format and is fitted to it: drawn at the largest of its sizes that takes three lines or fewer.

```tsx
// from templates/launch-graphic.tsx
<Column style={{ height: f.headline.height }}>
  <Heading field="headline" level={1} fit={{ sizes: [...f.headline.sizes], maxLines: 3 }} style={{ color: "#f7f7fb", lineHeight: 1.1 }}>
    {v.headline}
  </Heading>
</Column>
```

The rules over the result are one line:

```tsx
// from templates/launch-graphic.tsx
rules: { require: { core: ["image/overflow", "image/glyph", "image/fit"] } },
```

<details>
<summary>The whole template: <code>templates/launch-graphic.tsx</code></summary>

```tsx
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
```

</details>

## 2. Make a design

A design gives the template its values. From the shell, `design new` makes one from a brief and the launch's pictures:

```bash
npx hyper-elements design new templates/launch-graphic.tsx -o designs/orbit.values.json --values brief.json --set screenshot=@designs/art/screenshot.png --set artwork=@designs/art/waves.png
```

```json
{
  "headline": "Meet Orbit 3.0: release notes that write themselves",
  "features": ["Drafts from merged PRs", "Your voice, every release", "Ships to Slack and email"],
  "launchDate": "2026-12-03"
}
```

It writes `designs/orbit.values.json`, a values file: the template it's made from, the formats it's for, and its
values, with each picture's size read from its file. The template checked the values before the file was written.

In code, the same design is the template as the design's root, its props the values. TypeScript checks them as they're
written: a missing required field, a field the template doesn't have and a number given for text are type errors.

```tsx
import Launch from "../templates/launch-graphic";

export default () => (
  <Launch
    format="square"
    headline="Meet Orbit 3.0: release notes that write themselves"
    features={["Drafts from merged PRs", "Your voice, every release", "Ships to Slack and email"]}
    launchDate="2026-12-03"
    screenshot={{ src: "./art/screenshot.png", width: 1200, height: 750 }}
    artwork={{ src: "./art/waves.png", width: 1080, height: 680 }}
  />
);
```

`render()`, `validate()`, `renderImage()` and the other entry points hand that root to the template, and go on with
what it built. A design the template refuses fails as any design with errors does.

## 3. Check it, then render it

```bash
npx hyper-elements check designs/orbit.values.json
```

```text
✓ designs/orbit.values.json [square] (Canvas)
  artwork (square): 936×343, needs 936×343px
  screenshot (square): 472×295, needs 472×295px
  fit headline: 72px (fits at 72, 64, 56, 48)
  review artwork: Abstract light waves in violet and teal. No text, logos or people.
  review acme.LaunchGraphic: For product launches only. Sentence case, no emoji, no exclamation marks.
  review screenshot: Of unknown origin: no source is recorded for this image (give one with design set … --source)
  review artwork: Of unknown origin: no source is recorded for this image (give one with design set … --source)
✓ designs/orbit.values.json [landscape] (Canvas)
  artwork (landscape): 504×518, needs 504×518px
  screenshot (landscape): 456×285, needs 456×285px
  fit headline: 56px (fits at 56, 48, 40)
  review artwork: Abstract light waves in violet and teal. No text, logos or people.
  review acme.LaunchGraphic: For product launches only. Sentence case, no emoji, no exclamation marks.
  review screenshot: Of unknown origin: no source is recorded for this image (give one with design set … --source)
  review artwork: Of unknown origin: no source is recorded for this image (give one with design set … --source)
2 designs: 0 errors, 0 warnings, 0 skipped
```

Each format is checked on its own: the values, the design the template builds, and what only measuring it with its
fonts says. `fit headline` is the size the headline is drawn at. Each picture's line is its region and the pixels it
needs. `review` lists what a person judges, which never fails a run.

```bash
npx hyper-elements render designs/orbit.values.json
```

```text
✓ designs/orbit.values.json [square] (Canvas) → out/designs/orbit.square.png
✓ designs/orbit.values.json [landscape] (Canvas) → out/designs/orbit.landscape.png
2 designs: 0 errors, 0 warnings, 0 skipped
```

Those are the two images at the top of this page.

## 4. Change one value

`design set` changes one value and keeps the rest. The template fits the new headline:

```bash
npx hyper-elements design set designs/orbit.values.json "headline=Meet Orbit 3.0: release notes that write themselves, in your voice"
```

<div class="output-gallery even">
<figure><a href="/generated/templates-guide/orbit-landscape.png" title="Open the landscape launch graphic at full size"><img src="/generated/templates-guide/orbit-landscape.png" width="1200" height="630" loading="lazy" alt="The landscape launch graphic with its first headline, drawn at 56px"></a><figcaption>51 characters: drawn at 56px</figcaption></figure>
<figure><a href="/generated/templates-guide/long-landscape.png" title="Open the landscape launch graphic with the longer headline at full size"><img src="/generated/templates-guide/long-landscape.png" width="1200" height="630" loading="lazy" alt="The landscape launch graphic with the longer headline, drawn at 40px in three lines, the rest of the design where it was"></a><figcaption>66 characters: drawn at 40px</figcaption></figure>
</div>

The landscape format's headline is narrow, so it's drawn at 40px, not 56px, in the same three lines. Nothing else in
the design moves. The square format still takes it at 72px.

## 5. What it refuses

**A picture of the wrong shape.** The screenshot is 1.2:1 to 2:1. A banner in its place is refused as it's set, and the
file stays as it was:

<div class="output-gallery even">
<figure><a href="/generated/templates-guide/art-screenshot.png" title="Open the product screenshot at full size"><img src="/generated/templates-guide/art-screenshot.png" width="1200" height="750" loading="lazy" alt="A product screenshot, 1200 by 750 pixels"></a><figcaption>Taken: 1200×750, 1.6:1</figcaption></figure>
<figure><a href="/generated/templates-guide/art-banner.png" title="Open the banner at full size"><img src="/generated/templates-guide/art-banner.png" width="1600" height="400" loading="lazy" alt="A wide banner, 1600 by 400 pixels"></a><figcaption>Refused: 1600×400, 4:1</figcaption></figure>
</div>

```bash
npx hyper-elements design set designs/orbit.values.json screenshot=@designs/art/banner.png
```

```text
✗ designs/orbit.values.json: not written
    error template/asset-aspect at values.screenshot: Product screenshot is 1600×400, 4:1; it takes 2:1 or narrower
```

**Copy that can't fit.** A headline inside its 90 characters can still be too long for the landscape format's three
lines at its smallest size. That's found when the design is measured: `check` exits 1, and `render` writes nothing for
a format that fails.

```bash
npx hyper-elements design set designs/orbit.values.json "headline=Meet Orbit 3.0: release notes that write themselves, in your own voice"
npx hyper-elements check designs/orbit.values.json
```

```text
✓ designs/orbit.values.json [square] (Canvas)
  artwork (square): 936×343, needs 936×343px
  screenshot (square): 472×295, needs 472×295px
  fit headline: 64px (fits at 64, 56, 48)
  review artwork: Abstract light waves in violet and teal. No text, logos or people.
  review acme.LaunchGraphic: For product launches only. Sentence case, no emoji, no exclamation marks.
  review screenshot: Of unknown origin: no source is recorded for this image (give one with design set … --source)
  review artwork: Of unknown origin: no source is recorded for this image (give one with design set … --source)
✗ designs/orbit.values.json [landscape] (Canvas)
    error image/fit at root.children[0].children[0].children[1].children[0].children[0]: This Heading doesn't fit: it takes 4 lines at 40px, its smallest size, and fits 3: cut about 18 characters (required by acme.LaunchGraphic) Fix: Shorten the text, or give the template a smaller size
  rule image/fit (landscape): failed
  artwork (landscape): 504×518, needs 504×518px
  screenshot (landscape): 456×285, needs 456×285px
  fit headline: no size fits
  review artwork: Abstract light waves in violet and teal. No text, logos or people.
  review acme.LaunchGraphic: For product launches only. Sentence case, no emoji, no exclamation marks.
  review screenshot: Of unknown origin: no source is recorded for this image (give one with design set … --source)
  review artwork: Of unknown origin: no source is recorded for this image (give one with design set … --source)
2 designs: 1 error, 0 warnings, 0 skipped
```

## A slot: a newsletter anyone can write

Fields hold values. A **slot** holds content someone writes: this month's sections, in JSX, inside limits the template
sets. This newsletter's header, title and footer are fixed; its body is a slot that takes five elements, in the
brand's look, with one or two buttons.

<div class="output-gallery single">
<figure><a href="/generated/templates-guide/newsletter.png" title="Open the newsletter at full size"><img src="/generated/templates-guide/newsletter.png" width="680" height="476" loading="lazy" alt="The June newsletter: Orbit's dark header, the title, two short sections with headings, a button, and a footer with an unsubscribe link"></a><figcaption>designs/june.tsx, rendered and drawn in Chromium</figcaption></figure>
</div>

The issue is the template with its values. What's inside `body` is the writer's:

```tsx
// designs/june.tsx
import { Button, Column, Heading, Text } from "@hyper-elements/react";
import Newsletter from "../templates/newsletter";

export default () => (
  <Newsletter
    subject="What's new in Orbit this June"
    preview="Release notes in your voice, faster exports, and an invitation to our open house"
    body={
      <Column>
        <Heading level={2}>Release notes in your voice</Heading>
        <Text>Orbit now learns how your team writes from the notes you've already published, and drafts the next ones the same way.</Text>
        <Heading level={2}>Faster exports</Heading>
        <Text>Exports finish in half the time, with no settings to change.</Text>
        <Button href="https://orbit.example/changelog">Read the changelog</Button>
      </Column>
    }
  />
);
```

An issue that styles its own heading and adds a table is refused, with what to change:

```bash
npx hyper-elements check designs/off-brand.tsx
```

```text
✗ designs/off-brand.tsx (Email)
    error template/slot-style at root.children[2].children[0].children[0].style.color: acme.Newsletter's body takes no styles of its own (styles: "none"): use the theme's named styles (style={{ apply: [...] }}) and variants, not color
    error template/slot-component at root.children[2].children[0].children[1]: A Table isn't one of the components acme.Newsletter's body takes (Column, Heading, Text, Button, Link)
  review body: One to three short sections, each a Heading and a Text.
  review acme.Newsletter: Orbit's monthly newsletter. Friendly and plain: sentence case, no exclamation marks, no emoji.
1 design: 1 error, 0 warnings, 0 skipped
```

[Slots, blocks and rules](/docs/guides/templates-slots) has the whole newsletter template and every option.

## Keeping templates trusted

A template guarantees what it checks, not who may edit it: a process that can write the template's file can change
it. Commit templates and review changes to them (with CODEOWNERS, for example), and give the agents that fill them the
designs folder, not the templates folder. [Templates in the command line](/docs/guides/templates-cli#trusted-templates)
shows how to list the templates a project trusts.
