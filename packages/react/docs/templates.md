# Templates: reusable designs with guardrails

A template is how a team gets the output it wants, from people and from agents. It holds the parts of a design that
never change, opens typed fields for whoever fills it, and checks the result before anything is rendered. It's
`@hyper-elements/react/template`, and it runs wherever a design does: no service, account, engine or Node API.

A template has two kinds of parts:

- **Fixed parts:** everything in its `render` that no field reaches. The logo, the header and footer, the fonts and
  colors, the layout per format and the legal text are the template's; nothing a value can say changes them.
- **Fields:** typed values, each with its rules: a headline of at most 90 characters, a date, exactly three features,
  an optional promo, a product screenshot at least 1600px wide and 1.2:1 to 2:1, shown whole.

A **design** is one finished piece (this week's newsletter, the launch graphic for Orbit). A design made from a
template is the template used as the design's root, its props the values:

```tsx
// designs/launch.tsx
import Launch from "../templates/launch-graphic";

export default () => (
  <Launch
    format="square"
    headline="Meet Orbit: release notes that write themselves"
    features={["Drafts from merged PRs", "Your voice, every release", "Ships to Slack and email"]}
    launchDate="2026-12-03"
    screenshot={{ src: "./art/screenshot.png", width: 2400, height: 1500 }}
    artwork={{ src: "./art/waves.png", width: 2160, height: 1360 }}
  />
);
```

`render()`, `validate()`, `outline()`, `prepare()`, `inspect()`, `renderPdf()` and `renderImage()` all hand that root to
the template: it reads the values, builds its design for the format and checks it, and the entry point goes on with
what the template built. A design the template refuses fails as any design with errors does (`render()` rejects with
an `ElementsError` listing the problems), and each result names the template: `template: { id, version }`.
TypeScript checks the props as they're written: a missing required field, a field the template doesn't have and a
number given for text are type errors.

## Writing a template

```tsx
// templates/launch-graphic.tsx
import { Canvas, Column, Heading, Image, Layer, List, ListItem, Row, Text, prop } from "@hyper-elements/react";
import { field, fitInside, formatDate, template } from "@hyper-elements/react/template";

export default template({
  id: "acme.LaunchGraphic", // a namespace, a dot and a capitalized name
  version: "1.0.0", // semver: a values file records it
  label: "Product launch graphic",
  guidance: "For product launches only. Copy is in sentence case, with no emoji and no exclamation marks.",
  root: "Canvas",
  formats: {
    square: { width: 1080, height: 1080, scale: 2 },
    landscape: { width: 1200, height: 675, scale: 2 },
  },
  fields: {
    headline: prop.text({ label: "Headline", required: true, maxLength: 90 }),
    features: prop.list(prop.text({ label: "Feature", maxLength: 48 }), { label: "Features", required: true, min: 3, max: 3 }),
    launchDate: prop.date({ label: "Launch date", required: true }),
    locale: prop.choice(["en-US", "de-DE", "fr-FR"], { label: "Language", default: "en-US" }),
    screenshot: field.image({ label: "Product screenshot", required: true, fit: "contain", aspect: { min: 1.2, max: 2 }, minWidth: 1600, accepts: ["png"] }),
    artwork: field.image({
      label: "Decorative artwork",
      required: true,
      fit: "cover",
      maxCrop: 0.6,
      guidance: "Abstract light waves in violet and teal on dark navy. No text, letters, logos, UI or people.",
    }),
  },
  example: {
    headline: "Meet Orbit: release notes that write themselves",
    features: ["Drafts from merged PRs", "Your voice, every release", "Ships to Slack and email"],
    launchDate: "2026-12-03",
    screenshot: { src: "./example/screenshot.png", width: 2400, height: 1500 },
    artwork: { src: "./example/waves.png", width: 2160, height: 1360 },
  },
  render(v, { format }) {
    const square = format === "square";
    const region = square ? { width: 952, height: 400 } : { width: 488, height: 547 };
    const words = (
      <Column style={{ gap: 24 }}>
        <Heading field="headline" level={1} style={{ fontSize: square ? 76 : 56 }}>{v.headline}</Heading>
        <List>{v.features.map((feature, i) => <ListItem key={i} field={`features[${i}]`}>{feature}</ListItem>)}</List>
        <Text field="launchDate">{formatDate(v.launchDate, v.locale, { dateStyle: "long" })}</Text>
      </Column>
    );
    const art = (
      <Layer style={{ ...region, alignItems: "center", justifyItems: "center" }}>
        <Image field="artwork" src={v.artwork} alt="" />
        <Image field="screenshot" src={v.screenshot} alt="Orbit" style={fitInside(v.screenshot, { width: region.width - 92, height: region.height - 60 })} />
      </Layer>
    );
    return (
      <Canvas {...(square ? { width: 1080, height: 1080 } : { width: 1200, height: 675 })} lang={v.locale} style={{ padding: 64, gap: 32 }}>
        {square ? <>{words}{art}</> : <Row style={{ gap: 64 }}>{words}{art}</Row>}
      </Canvas>
    );
  },
});
```

- **Fields** are the main entry's `prop` helpers: `prop.text({ maxLength, pattern })` (a regular expression's
  source, matched with the `u` flag), `prop.date()` (`YYYY-MM-DD`), `prop.list(item, { min, max })`,
  `prop.object(fields)`, `prop.choice()`, `prop.number()`, `prop.link()` and the rest. A field is required only with
  `required: true`; a list not given is `[]` (its `min` applies to that too), an optional object is `undefined`, and a
  `default` is filled in. Lists and objects compose: a `field.image()` inside a list of objects keeps its rules, at
  `stories[1].image`.
- **`field.image()`** takes `{ src, width, height }`, the file's size in px, and the rules a template checks:
  `fit` (`"contain"`, shown whole; `"cover"`, cropped from the center to fill its region), `aspect: { min, max }`,
  `minWidth`, `minHeight`, `accepts` (`png`, `jpeg`, `gif`, `svg`, `webp`), `transparent` and `maxCrop`.
- **`field="…"`** on a built-in says which field it shows (`headline`, `features[1]`, `stories[1].image`). It's how the
  template's checks find each image where it's drawn, and a diagnostic on a bound node names its `field`. A binding
  inside a `component()`'s own render is left out (`field/dropped`).
- **`guidance`**, on a field or the template, is plain English for whoever fills it: never enforced, listed by
  `describe()` and returned by `check()` as `review` items for a person to judge.
- **`formats`** are a template's named sizes: a Canvas's `{ width, height, scale }`, a Document's `{ size,
  orientation }`. `render` gets the format's name and arranges the design for it.
- **`example`** is required: `describe()` lays it out, and tests render it in each format.
- A field can't be named `format`, `key`, `ref` or `children` (`template/field-name`): they're props of the
  template's component.

## Checking

`check(values, { format })` never throws. It returns `{ valid, values, diagnostics, review, snapshots, template }`:

```ts
const checked = launch.check(brief);
if (!checked.valid) console.error(formatDiagnostics(checked.diagnostics));
const { image } = await renderImage(checked.snapshots.square!, { fonts, images });
```

It checks, in order:

1. **The values**, by their fields: a field the template doesn't have (`template/unknown-field`, naming the fields it
   has), a missing required one (`template/required`), a value its kind refuses (`template/value`), a list outside its
   counts (`template/count`), and each image's declared size against its rules (`template/asset-aspect`,
   `template/asset-pixels`, and `template/asset-type` from the file's extension).
2. **The design it builds in each format**, as `validate()` checks any design, and what only the template knows: its
   root and its format's size (`template/root`, `template/format`), its bindings (`template/unknown-binding` for a
   `field` that names no field; `template/unbound`, a warning, for an image with rules that nothing shows), and how
   each bound image is shown. A `contain` image shown at another aspect than its file's is `template/asset-distorted`;
   one that's a Layer's base, which is drawn as a cover, and a `cover` image cropped past `maxCrop`, are
   `template/asset-cropped`. These catch the template's own mistakes, not only bad values: size a `contain` image with
   `fitInside(image, box)`.

`snapshots` holds the design for each format checked (`default` for a template with one size), where it's valid: what
to render. `check(element)`, from the same entry, checks a design whose root is a template, in its `format` or, without
one, in every format.

## Designs as data

The same design can be data instead of TSX, for batches and tools: a values file, the template's reference and
version, the values, and each asset's hash and provenance beside them.

```ts
import { readValuesFile, toValuesFile } from "@hyper-elements/react/template";

const file = toValuesFile(launch, values, {
  module: "../templates/launch-graphic.tsx",
  formats: ["square", "landscape"],
  assets: { artwork: { sha256, source: { kind: "generated", provider, model, prompt } } },
});
const reopened = readValuesFile(JSON.parse(text), launch); // { values, formats, assets, diagnostics }
```

Defaults are written out, so a later minor release that changes one doesn't change the design. Reading checks the
template's id (`template/id`) and version: a newer minor or patch reads the values again with a `template/upgraded`
note, a newer major runs the template's `migrate[major](values)` for each major between (without one, it's
`template/version`), and a template older than the file's is `template/version`.

`update(values, patch)` changes some fields of checked values: what the patch doesn't name keeps its reference, an
object is merged (JSON Merge Patch: `null` removes a key), and a list is replaced whole. It throws an `ElementsError`
for a field the template doesn't have or a bad value. `design(values, { format })` returns the plain root element for
code that has values in hand.

## Discovering a template

`describe()` returns what whoever fills a template needs before starting, synchronously: its formats, every field (its
kind, whether it's required, its JSON Schema, its image rules and guidance), a JSON Schema of all its values, and for
each image the template shows, its region in each format (the box, and the pixels it needs at the format's scale).
For a `cover` image it adds the smallest size that fills every region without upscaling, and what each crops:

```json
{
  "path": "artwork",
  "kind": "image",
  "fit": "cover",
  "maxCrop": 0.6,
  "regions": { "square": { "box": [952, 400], "pixels": [1904, 800] }, "landscape": { "box": [488, 547], "pixels": [976, 1094] } },
  "suggested": { "width": 1904, "height": 1094, "crop": { "square": "cuts 27% of the height", "landscape": "cuts 49% of the width" } }
}
```

## Helpers

- `fitInside(image, box)`: the size that shows an image whole inside a box, at its own aspect.
- `sniffImage(bytes)`: an image file's `{ width, height, type, alpha }`, read from its header (PNG, JPEG, GIF, SVG), in
  plain JavaScript.
- `formatDate(date, locale, options)`: a date field written for a locale (`"3. Dezember 2026"`), in UTC, so the day is
  the one given and no clock is read.

## Keeping templates trusted

A template guarantees what it checks, not who may edit it: a process that can write the template's file can change
it. Commit templates and review changes to them (with CODEOWNERS, for example), and give the agents that fill them the
designs folder, not the templates folder.
