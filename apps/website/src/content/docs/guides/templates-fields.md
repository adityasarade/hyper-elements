---
title: "Fields, images and formats"
description: "Every kind of field a template opens, the rules an image field checks, formats, bindings, values as data and what describe() tells whoever fills a template."
---

The reference for a template's open values. The [templates guide](/docs/guides/templates) shows them at work; this
page lists each one.

```tsx
import { prop } from "@hyper-elements/react";
import { field, template } from "@hyper-elements/react/template";
```

## Fields

A field is one typed value. It's made with the main entry's `prop` helpers, or with `field.image()` and `field.slot()`
from the template entry.

| Field | Its value | Its own options |
|-------|-----------|-----------------|
| `prop.text()` | Text | `maxLength`; `pattern`, a regular expression's source, matched with the `u` flag |
| `prop.date()` | A date, `YYYY-MM-DD` | |
| `prop.number()` | A number | `min`, `max` |
| `prop.choice(options)` | One of the options | |
| `prop.link()` | A URL | |
| `prop.list(item, { min, max })` | A list of one kind of item | Not given, it's `[]`, and its `min` applies to that too |
| `prop.object(fields)` | An object of named fields | Optional and not given, it's `undefined` |
| `prop.blocks(types, { min, max })` | A list of blocks, each one of the types | See [blocks](/docs/guides/templates-slots#blocks) |
| `field.image(rules)` | An image, `{ src, width, height }` | See [image rules](#image-rules) |
| `field.slot(options)` | JSX someone writes | See [slots](/docs/guides/templates-slots#slots) |

The main entry's other `prop` helpers (a color, a boolean and the rest) are fields too.

Every field takes these:

| Option | What it does |
|--------|--------------|
| `label` | Its name, for people: in messages and in `describe()` |
| `required` | A field is required only with `required: true` |
| `default` | Filled in where the value isn't given |
| `guidance` | Plain English for whoever fills it. Never enforced: listed by `describe()`, and returned by `check()` as `review` items for a person to judge |

Lists and objects compose. A `field.image()` inside a list of objects keeps its rules, at `stories[1].image`.

A field can't be named `format`, `key`, `ref` or `children` (`template/field-name`): they're props of the template's
component.

## Image rules

An image field's value is `{ src, width, height }`, the file's size in px. Each rule is checked against what can
decide it: the size given, the file, or where the template draws it.

| Rule | It asks | Checked against | Where it fails |
|------|---------|-----------------|----------------|
| `aspect: { min, max }` | Its width over its height | The size given | `template/asset-aspect` |
| `minWidth`, `minHeight` | Its smallest size in px | The size given | `template/asset-pixels` |
| `accepts` | Its type: `png`, `jpeg`, `gif`, `svg`, `webp` | Its name's extension, then its file | `template/asset-type` |
| `transparent` | `"required"` or `"forbidden"` | Its file | `template/asset-alpha` |
| `fit: "contain"` | Shown whole, at its own aspect | Where it's drawn | `template/asset-distorted`, `template/asset-cropped` |
| `fit: "cover"` | Cropped from the center to fill its region | Where it's drawn | |
| `maxCrop` | The most a `cover` image loses from either side, as a share (`0.6` is 60%) | Where it's drawn | `template/asset-cropped` |

What only the file says (whether it's transparent, its type where its name gives none) is never taken as passed. It's
a note, `template/asset-unread`, until the file is read: by [`checkLayout()`](/docs/guides/templates-checks#measured-rules-and-checklayout)
given the file, or by the [command line](/docs/guides/templates-cli), which reads a file beside the design.

Size a `contain` image with `fitInside(image, box)`, so it's shown at its own aspect whatever the image is.

## Bindings

`field="…"` on a built-in element says which field it shows:

```tsx
<Heading field="headline">{v.headline}</Heading>
<ListItem field={`features[${i}]`}>{feature}</ListItem>
<Image field="stories[1].image" src={story.image} alt="" />
```

- It's how the template's checks find each image where it's drawn.
- A diagnostic on a bound node names its `field`, so a tool or an agent knows which value to change.
- A `field` that names no field with a value is `template/unknown-binding`. An image field with rules that no node
  shows is `template/unbound`, a warning.
- A binding inside a custom element's own render is left out (`field/dropped`).

## Formats and the example

- **`formats`** are a template's named sizes: a Canvas's `{ width, height, scale }`, a Document's `{ size,
  orientation }`. `render` gets the format's name and arranges the design for it. A template with no formats has one
  size.
- **`example`** is required: a full set of values. `describe()` lays it out, `check` of the template module checks it
  in every format, and tests render it.
- **`id`** is a namespace, a dot and a capitalized name (`acme.LaunchGraphic`). **`version`** is semver: a values file
  records it.

## Values as data

The same design can be data instead of TSX, for batches and tools: a values file. It holds the template's reference
and version, the values, and each asset's hash and where it came from.

```ts
import { readValuesFile, toValuesFile } from "@hyper-elements/react/template";

const file = toValuesFile(launch, values, {
  module: "../templates/launch-graphic.tsx",
  formats: ["square", "landscape"],
  assets: { artwork: { sha256, source: { kind: "generated", provider, model, prompt } } },
});
const reopened = readValuesFile(JSON.parse(text), launch); // { values, migrated, formats, assets, diagnostics }
```

Defaults are written out, so a later minor release that changes one doesn't change the design.

Reading a file checks its template's id and version:

| The file was made with | Reading it |
|------------------------|------------|
| The same version | Reads its values |
| An older minor or patch | Reads its values again, with a note (`template/upgraded`) |
| An older major | Runs the template's `migrate[major](values)` for each major between; without one, `template/version` |
| A newer version than the template | `template/version` |
| Another template | `template/id` |

`migrated` is the file's values after its migrations and before they're read: what a tool changes in a file whose
values aren't valid yet.

Three more functions work with values in code:

- `update(values, patch)` changes some fields of checked values. What the patch doesn't name keeps its reference, an
  object is merged (JSON Merge Patch: `null` removes a key), and a list is replaced whole. It throws an `ElementsError`
  for a field the template doesn't have or a bad value.
- `design(values, { format })` returns the plain root element, for code that has values in hand. It doesn't check
  them: `check()`'s snapshots are what's checked.
- `templateRequest(design)` gives a tool what a design's root asked for: the template, its props and its format.

## What describe() tells a filler

`describe()` returns what whoever fills a template needs before starting: its formats, every field (its kind, whether
it's required, its JSON Schema, its image rules and guidance), a JSON Schema of all its values, and each image's region
in each format (its box, and the pixels it needs at the format's scale). For a `cover` image it adds the smallest size
that fills every region without upscaling, and what each format crops:

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

From the shell it's `npx hyper-elements describe templates/launch-graphic.tsx --json`.

## Helpers

| Helper | What it gives |
|--------|---------------|
| `fitInside(image, box)` | The size that shows an image whole inside a box, at its own aspect |
| `sniffImage(bytes)` | An image file's `{ width, height, type, alpha }`, read from its header (PNG, JPEG, GIF, SVG), in plain JavaScript |
| `formatDate(date, locale, options)` | A date field written for a locale (`"3. Dezember 2026"`), in UTC, so the day is the one given and no clock is read |
