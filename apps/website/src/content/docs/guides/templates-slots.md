---
title: "Slots, blocks and rules"
description: "A template's slots (JSX someone writes, inside limits), blocks (approved section types as data), the rules it checks on the finished design, and annotated templates."
---

Fields hold values. This page covers the other ways a template opens up, and the rules it checks on the finished
design. The [templates guide](/docs/guides/templates) introduces them.

| A template opens | For | Whoever fills it gives |
|------------------|-----|------------------------|
| A [field](/docs/guides/templates-fields) | One typed value | Text, a date, a list, an image |
| A [slot](#slots) | Content someone writes | JSX, with only the elements and styles the template allows |
| [Blocks](#blocks) | Sections picked and ordered | Data: each block's type and its fields |

## Slots

A slot is JSX the filler writes, inside limits the template sets. This newsletter's header, title and footer are
fixed; its body is a slot.

<div class="output-gallery single">
<figure><a href="/generated/templates-guide/newsletter.png" title="Open the newsletter at full size"><img src="/generated/templates-guide/newsletter.png" width="680" height="476" loading="lazy" alt="The June newsletter: Orbit's dark header, the title, two short sections with headings, a button, and a footer with an unsubscribe link"></a><figcaption>designs/june.tsx, rendered and drawn in Chromium</figcaption></figure>
</div>

The template places the slot in a built-in element bound to it, its host (`<Section field="body">`), and everything
under the host is the slot's:

```tsx
// templates/newsletter.tsx
import { Button, Column, Email, Heading, Link, Section, Text, defineTheme, prop } from "@hyper-elements/react";
import { field, template } from "@hyper-elements/react/template";
import { lint } from "@hyper-elements/lint";

// The brand's look for what an issue is written with: the content sets no styles of its own.
const brand = defineTheme({
  elements: {
    Heading: { color: "#0b1020", by: { level: { 1: { fontSize: 30, lineHeight: 1.2 }, 2: { fontSize: 20, lineHeight: 1.3 } } } },
    Text: { color: "#3b4254", fontSize: 16, lineHeight: 1.6 },
    Button: { backgroundColor: "#4f46e5", color: "#ffffff", borderRadius: 8, padding: [12, 20], fontWeight: 700 },
    Column: { gap: 12 },
  },
});

export default template({
  id: "acme.Newsletter",
  version: "1.0.0",
  label: "Orbit newsletter",
  guidance: "Orbit's monthly newsletter. Friendly and plain: sentence case, no exclamation marks, no emoji.",
  root: "Email",
  fields: {
    subject: prop.text({ label: "Subject", required: true, maxLength: 70 }),
    preview: prop.text({ label: "Preview text", required: true, maxLength: 120 }),
    // What the issue's writer writes: these elements only, in the brand's look, with one or two buttons.
    body: field.slot({
      label: "Body",
      required: true,
      allow: [Column, Heading, Text, Button, Link],
      styles: "none",
      count: { Button: { min: 1, max: 2 } },
      guidance: "One to three short sections, each a Heading and a Text.",
    }),
  },
  rules: {
    plugins: { lint: lint({ kind: "marketing" }) },
    // An unsubscribe link, link text that says where it goes, a language, and nothing wider than the email.
    require: { lint: ["unsubscribe", "link-text", "lang"], core: ["layout/overflow"] },
    // Links go to Orbit's own domains.
    links: { domains: ["orbit.example", "*.orbit.example"] },
    root: { lang: true, previewText: true },
  },
  example: {
    subject: "What's new in Orbit this month",
    preview: "Faster exports, release notes in your voice, and an invitation to our open house",
    body: (
      <Column>
        <Heading level={2}>Faster exports</Heading>
        <Text>Exports now finish in half the time, with no settings to change.</Text>
        <Button href="https://orbit.example/changelog">Read the changelog</Button>
      </Column>
    ),
  },
  render(v) {
    return (
      <Email lang="en" previewText={v.preview} theme={brand} style={{ backgroundColor: "#eef0f6" }}>
        <Section style={{ backgroundColor: "#0b1020", padding: [20, 32] }}>
          <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: 700 }}>Orbit</Text>
        </Section>
        <Section style={{ backgroundColor: "#ffffff", padding: [32, 32, 8] }}>
          <Heading field="subject" level={1}>{v.subject}</Heading>
        </Section>
        <Section field="body" style={{ backgroundColor: "#ffffff", padding: [16, 32, 32] }}>
          {v.body}
        </Section>
        <Section style={{ padding: [20, 32] }}>
          <Text style={{ fontSize: 14, color: "#5b6478" }}>
            Orbit, 1 Main Street. <Link href="https://orbit.example/unsubscribe">Unsubscribe from these emails</Link>
          </Text>
        </Section>
      </Email>
    );
  },
});
```

An issue is the template with its values. What's inside `body` is the writer's:

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

```tsx
// designs/off-brand.tsx
import { Button, Column, Heading, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import Newsletter from "../templates/newsletter";

export default () => (
  <Newsletter
    subject="Huge summer sale"
    preview="Everything is on sale this week, for a short time only, across the whole store"
    body={
      <Column>
        <Heading level={2} style={{ color: "#ff0066" }}>Everything must go</Heading>
        <Table><TableRow><TableCell><Text>Pro plan</Text></TableCell><TableCell><Text>50% off</Text></TableCell></TableRow></Table>
        <Button href="https://orbit.example/sale">Shop the sale</Button>
      </Column>
    }
  />
);
```

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

### What a slot allows

| Option | What it sets | Refused as |
|--------|--------------|------------|
| `allow: [Column, Heading, …]` | The elements the content may use, given as the elements themselves | `template/slot-component` |
| `allow: "all"` | Every built-in the template's root may hold, but the roots and `Html`. `deny: [Table, Video]` takes some out; `["all", ProductCard]` adds your own | `template/slot-component` |
| `styles: "theme"` (the default) | Every brand value is a `token()` | `template/slot-style` |
| `styles: "none"` | Only the theme's named styles (`apply`) and variants | `template/slot-style` |
| `styles: "free"` | Any style | |
| `count: { Button: { min: 1, max: 2 } }` | How many of a type, counting what's shown at some width | `template/slot-count` |

- **A built-in is allowed by its type, a custom element by its definition.** Content that defines its own
  `acme.ProductCard` is refused ("not the template's"), and its render never runs. A root and `Html` are never allowed.
- **`allow: "all"` widens with Elements:** a later release that adds a built-in adds it to the slot. A template that
  wants a fixed set across upgrades writes a list.
- **A brand value**, under `"theme"`, is each style and prop whose kind is a color, a font, insets or a radius, a
  border's color, and `fontSize`, `lineHeight`, `letterSpacing`, `gap` and `rowGap`, in `style`, `mobile` and `hover`.
- **Content never sets** `attrs` (`template/slot-attrs`), or, under `"none"` and `"theme"`, `tokens` or `theme`
  (`template/slot-tokens`). A `field` inside it is its own (`template/slot-field`): the template reads no binding there.
- **The content must be what its host may hold**, as any children are: a Section's slot content starts with a Column, a
  Row or blocks, not another Section.

### The template never sees the content

A template's render runs with a mark in the slot's place, so its fixed parts can't depend on what's written there.
The content is collected on its own (it sees none of the template's React context) and spliced in at the mark. The
mark goes in exactly one node bound to the slot (`template/slot-host`).

### A slot stored as data

In a values file, a slot is stored one of two ways:

| Stored as | It is | `check()` |
|-----------|-------|-----------|
| `{ "module": "./june.body.tsx" }` | The module whose default export renders the content | Takes its capture in `fragments` (`template/slot-unloaded` without it). The [command line](/docs/guides/templates-cli#slots-stored-as-modules) captures it |
| `{ "fragment": … }` | The content captured with `captureFragment()` | Reads it itself |

`toValuesFile()` stores a slot's JSX as its fragment.

## Blocks

`prop.blocks(types, { min, max })` is a list of approved section types, each a `prop.object()`. The filler picks
which, in what order, and fills them; the look is the template's:

```tsx
fields: {
  body: prop.blocks(
    {
      hero: prop.object({ title: prop.text({ label: "Title", required: true }), image: field.image({ label: "Image", fit: "contain" }) }, { label: "Hero" }),
      quote: prop.object({ text: prop.text({ label: "Quote", required: true, maxLength: 120 }) }, { label: "Quote" }),
    },
    { label: "Body", required: true, min: 1, max: 6 }
  ),
},
// values: { body: [{ type: "hero", title: "Orbit is live" }, { type: "quote", text: "Ship small." }] }
```

- `type` names each block's type, so a block type can't have a field named `type` (`template/block-type`).
- An unknown or missing type is `template/value`, naming the types.
- Rules and bindings inside a block work as anywhere: `body[0].image`.

## Rules over the result

Rules are checked on the finished design, whatever filled it:

```tsx
import { lint } from "@hyper-elements/lint";

rules: {
  plugins: { lint: lint({ kind: "marketing" }) },
  require: {
    lint: ["unsubscribe", "preview-text", "contrast", "link-text", "lang"],
    core: ["layout/overflow"],
  },
  links: { domains: ["acme.com", "*.acme.com"], params: { utm_source: "newsletter" }, schemes: ["mailto"] },
  root: { lang: true },
},
```

| Rule | It requires | Where it fails |
|------|-------------|----------------|
| `require.lint` | Lint's rules, by id: a finding of one is an error, with "(required by …)" | The lint rule's own code |
| `require.core` | `layout/overflow`, `layout/shrunk`, `document/overflow`, `canvas/overflow`, and a Canvas's `image/overflow`, `image/glyph`, `image/fit` | That code |
| `links.domains` | Every http(s) link's host: `acme.com` itself, `*.acme.com` its subdomains | `template/link-domain` |
| `links.params` | A query parameter on every link | `template/link-param` |
| `links.schemes` | The other schemes a link may use (`mailto`) | `template/link-scheme` |
| | A relative link is refused | `template/link-relative` |
| `root` | Root props that must be set | `template/root-prop` |

Each required rule ends `passed`, `failed` or `not-run`, in `check()`'s `rules`. One that didn't run never counts as
passed.

- **Lint rules are checked when the template is defined.** A rule lint doesn't have, one that's off as lint is
  configured (`unsubscribe` needs `kind: "marketing"`), or one that doesn't run on the template's root (lint checks
  Emails and Pages) is `template/rule-unavailable`. If lint fails, its rules are `not-run`, an error
  (`template/rule-not-run`).
- **A Canvas's `image/…` rules are decided when the image is measured.** `check()` leaves them `not-run`, and a writer
  given the snapshot refuses it until then. See [measured rules](/docs/guides/templates-checks#measured-rules-and-checklayout).
- **Links are checked everywhere:** in fixed parts and a Menu's too. A URL with a sending service's tag (`{{…}}`) is
  listed for review, or refused with `tags: "deny"` (`template/link-tag`).
- **`plugins.other`** runs other plugins (email-clients'), whose findings are reported but can't be required.

## Annotated templates

A template with one size and fields of text, links, images and slots can be written as the design itself, with what's
open marked where it is:

```tsx
import { field, open, template } from "@hyper-elements/react/template";

const title = open(prop.text({ label: "Title", required: true, maxLength: 70 }));
const body = open(field.slot({ label: "Body", required: true, allow: "all", styles: "theme" }));

export default template({
  id: "acme.Newsletter",
  version: "1.0.0",
  rules: { plugins: { lint: lint({ kind: "marketing" }) }, require: { lint: ["unsubscribe"] } },
  open: { title, body },
  design: (
    <Email width={600} theme={brand}>
      <BrandHeader />
      <Heading field={title}>What's new at Acme</Heading>
      <Section field={body}>
        <Text>Three things shipped this week.</Text>
      </Section>
      <BrandFooter />
    </Email>
  ),
});
```

A marker goes on a built-in written in `design` itself, and what the marked node holds is the example:

| A marker for | Goes on |
|--------------|---------|
| A text field | A Heading, Text, ListItem, Button or Link holding its example text |
| A link | A Link's or Button's `href` |
| An image (`field.image()`) | An Image's `src` |
| A slot | The node that holds its content |

A template with formats, lists, blocks or computed values uses `fields` and `render`.
