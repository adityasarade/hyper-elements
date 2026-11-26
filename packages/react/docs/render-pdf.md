# PDF output: `@hyper-elements/react/pdf`

PDF output for [Hyper Elements](https://github.com/hyper-elements/hyper-elements): a `<Document>` from `@hyper-elements/react` written as a PDF on the server, with react-pdf, without a browser or the network. Its pages, header, footer and page numbers are the print HTML's, laid out at the same widths.

## Installation

```bash
npm install @hyper-elements/react @react-pdf/renderer react
```

`/pdf` is an entry of `@hyper-elements/react`. Its engine is an optional peer dependency, so a project that doesn't import `/pdf` installs nothing for it, and the main entry never loads it:

| Package | Version | Why |
|---------|---------|-----|
| `@hyper-elements/react` | `^0.3.0` | The elements, and this entry |
| `@react-pdf/renderer` | `^4.9.0` | Draws the pages (optional: only for `/pdf`) |
| `@react-pdf/textkit` | `^7.0.1` | Measures the pages without drawing them, for `paginate()` and `createPaginator()` (optional: without it, `paginate()` draws the PDF to measure it, and `createPaginator()` rejects) |
| `react` | `>=18` | |

The tree `prepare()` lays out says its format (its layout version), and `renderPdf` reads the one it's built with. Where the `@hyper-elements/react` it loads writes another (a second install beside it), it throws an `ElementsError` (`pdf/version`) rather than drawing the design wrong.

Node.js only: it writes the PDF on the server.

## Quick Start

```tsx
import { readFile, writeFile } from "node:fs/promises";
import { Document, Heading, Image, PageFooter, PageNumber, Text } from "@hyper-elements/react";
import { renderPdf } from "@hyper-elements/react/pdf";

const Invoice = () => (
  <Document size="A4" margin={48} title="Invoice 2705" style={{ fontFamily: "Inter, sans-serif" }}>
    <Image src={{ src: "https://cdn.acme.com/logo.png", width: 240, height: 80 }} alt="Acme" style={{ width: 120 }} />
    <Heading level={1}>Invoice 2705</Heading>
    <Text>Thank you for your order.</Text>
    <PageFooter>
      <Text style={{ fontSize: 10, textAlign: "right" }}>
        Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  </Document>
);

const { pdf, diagnostics } = await renderPdf(<Invoice />, {
  fonts: [
    { family: "Inter", src: await readFile("fonts/Inter-Regular.ttf") },
    { family: "Inter", src: await readFile("fonts/Inter-Bold.ttf"), weight: 700 },
  ],
  images: { "https://cdn.acme.com/logo.png": await readFile("images/logo.png") },
});
await writeFile("invoice.pdf", pdf);
```

`renderPdf(element, options)` returns `{ pdf, diagnostics }`: the file's bytes, and the warnings and notes. Errors reject with an `ElementsError` listing them. The same design writes the same bytes (`date`, a fixed date by default, is when the PDF says it was made).

## Fonts and images are given as bytes

Nothing is fetched. Give each file the design needs:

- **Fonts** in `fonts`: `{ family, src, weight?, style? }`, one entry per file, `src` a TTF, OTF or WOFF file's bytes. `family` is the name the design's `fontFamily` stacks use. The files in a Document's `fonts` prop are its HTML's: `renderPdf` doesn't load them, `data:` URIs included.
- **Images** in `images`, by the URL the design gives them (`{ "https://…/logo.png": bytes }`), or as `data:` URIs in the design. A PDF draws PNG and JPEG. A Video shows its thumbnail where its file is given (its own, or a YouTube video's by the URL `img.youtube.com/vi/<id>/0.jpg`), else its title, linked to the video.

Text whose `fontFamily` has no file given is drawn in a standard PDF font: Helvetica, Times or Courier, whichever is closest.

## Diagnostics

| Code | Severity | When |
|------|----------|------|
| `pdf/root` | error | The design isn't a Document |
| `pdf/version` | error | The `@hyper-elements/react` loaded lays the design out in another layout version than `/pdf` reads |
| `pdf/image` | error | An image isn't given, or its file isn't a PNG or JPEG |
| `pdf/image` | warning | An image is SVG: its alt text is shown in its box |
| `pdf/font` | warning | A font in the Document's `fonts` isn't given; a file given is WOFF2; or text in a standard PDF font has characters it can't draw (it draws Western European ones only) |
| `pdf/font-weight` | warning | Text in a weight or style of a family that isn't given: it's drawn in the nearest file given |
| `pdf/unsupported` | warning | What a PDF can't show that the HTML can: a hover, a Video's player |
| `document/overflow` | warning | A page's content is taller than its room (the page less its margins, header and footer), measured with its fonts. Named at the first block cut off |

`validate()` from `@hyper-elements/react` reports `pdf/unsupported` and `document/overflow` without rendering. Without the fonts its `document/overflow` is an estimate. The font and image checks need the files, so only `renderPdf` makes them, and measures.

## Pages that flow

Content that doesn't fit its page goes on to the next, with the Document's `PageHeader` and `PageFooter` on each page and each `PageNumber` numbered for the pages there are:

- **Text** splits between its lines, leaving two lines at least on each side. Text written right to left (`dir="rtl"`, or `"auto"` and its first letter Hebrew or Arabic) is laid out right to left and splits the same way.
- **A Section, a Column and a List** split between and inside what they hold. A Section that's cut keeps its top padding and border on its first part and its bottom ones on its last. A part that goes on to the next page fills the rest of its page, its background down to the page's foot, as a browser draws a box broken between pages.
- **A Row of Columns** that fits on a page goes on to the next whole. One taller than a page goes on by its columns: each in its own place, split its own way, a column that has ended keeping its room empty.
- **A Table** splits between its rows, and its header rows (`<TableRow header>`) start each page it goes on to.
- **A Heading** isn't left last on a page: it goes on with what follows it.
- **A `Document.Page`** that's too long goes on to pages after it, with its background. A `PageBreak` still starts a new page.

A Document whose pages fit is drawn as it always was; one that doesn't is drawn a second time, flowed, a paragraph split between pages drawn line by line as it was laid out.

The print HTML has the same pages when it's drawn from the PDF's plan:

```tsx
import { render } from "@hyper-elements/react";
import { paginate, renderPdf } from "@hyper-elements/react/pdf";

const { pdf, plan } = await renderPdf(design, { fonts });
const { html } = await render(design, { plan }); // the same pages, the same words on each

// Or the plan alone, without drawing the PDF: const { plan } = await paginate(design, { fonts });
```

`paginate()` measures the pages with react-pdf's own text layout (`@react-pdf/textkit`, the same package react-pdf draws with) and its layout's arithmetic, without drawing them: the plan is the one `renderPdf()` makes from the PDF it draws, line for line. `renderPdf()` draws first: a Document that fits is drawn once, as it always was.

## Pages as a Document is edited

`createPaginator(options)` takes `renderPdf`'s options and makes a paginator for Documents drawn with those fonts and images. It loads and reads the fonts once, and keeps each block of text it lays out, so paginating again after a keystroke lays out only the paragraph that changed. Its `paginate()` answers at once (it isn't a Promise), with `paginate()`'s plan and diagnostics. With `{ diagnostics: false }` it gives the plan alone, without the measuring its diagnostics take: for pages kept up to date as someone types.

```tsx
import { createPaginator } from "@hyper-elements/react/pdf";

const paginator = await createPaginator({ fonts });

// On each edit:
const { plan } = paginator.paginate(design, { diagnostics: false });
```

- **Anywhere:** it runs in Node, in a browser and in a Worker, with react-pdf's browser build (which bundlers pick); it uses nothing of Node's. A Document is paginated to the same plan in each.
- **Fast:** on a laptop, a 28-page report is paginated again in about 7ms after a keystroke (12ms with its diagnostics), where `paginate()` takes about 65ms.
- **Its fonts:** text in a font it wasn't given is drawn in a standard PDF font, as `renderPdf()` draws it. Make another paginator for other fonts.
- `cacheSize` sets how many blocks of text it keeps laid out (10,000 by default).

## Where each line is, and where a caret goes

A paginator's `paginate(design, { layout: true })` gives its `layout` too, without drawing the PDF: `layoutDocument()`'s pages and nodes, each text node with its `text` (as its PDF draws it) and its `lineBoxes`. Each line has:

- its characters in the node's `text`: `start` and `end`, in UTF-16 code units (as a JavaScript string counts them);
- its box, in px from its page's top left: `x` and `width` (from its leftmost character to its rightmost), `y` and `height`, and its `baseline`;
- its `runs`: its characters in runs each written one way (`rtl` where right to left), each with its `carets`, where a caret goes before each character and after its last.

A ListItem's, a TableCell's and a Button's text is their own. Three plain functions of the layout read it, so a page view can paginate in a Worker and find a caret where the pointer is:

```tsx
import { caretAt, caretBox, createPaginator, selectionBoxes } from "@hyper-elements/react/pdf";

const { layout } = paginator.paginate(design, { layout: true });
const caret = caretAt(layout, { page: 1, x: 120, y: 300 }); // { path, offset, page }: the nearest
const box = caretBox(layout, caret); // { page, x, y, height }: where it's drawn
const boxes = selectionBoxes(layout, { path: caret.path, start: 0, end: 20 }); // a box for each stretch on each line
```

- **Where the PDF draws it:** each character is where its glyph is, with the spaces justified or squeezed to fit; a glyph drawn for several characters (a ligature) shares its width between them.
- **Right to left:** text written right to left runs from its right, and words written left to right in it from their left. A selection across them has a box for each stretch drawn apart.
- **Between characters:** a caret never goes inside one (a UTF-16 pair, or a letter and its accent).
- **Two places:** where an offset is in two (the end of a line and the start of the next, or where text written one way meets text written the other), `affinity` says which: `"after"` (by default) or `"before"`. A node in a PageHeader or PageFooter is on every page: give `page` for its caret on one.

A keystroke on a 28-page report is laid out again with its lines in about 12ms. To draw text where its carets are, draw it in the same font files.

## Pages drawn for a page view

A paginator's `paginate(design, { svg: true })` gives each page drawn as an SVG, without drawing the PDF: everything where its PDF draws it. Each box's background and borders, each image and drawing, each word from where its characters are; nothing is laid out again. It's shown in px, its coordinates the PDF's points, so a layout's px (and its carets) are over it:

```tsx
import { createPaginator, fontFaces } from "@hyper-elements/react/pdf";

const paginator = await createPaginator({ fonts });
const { svg, layout } = paginator.paginate(design, { svg: true, layout: true });

style.textContent = fontFaces(fonts); // once: the font files, as @font-face rules
view.innerHTML = svg.join(""); // a page view, each page as its PDF draws it
```

- **The same fonts:** its text is drawn in the families the Document names. `fontFaces(fonts)` gives an @font-face for each file a paginator is given: in a page with them, Chromium draws each glyph where the PDF does (within a twentieth of a point, tested). Text in a standard PDF font is drawn in the browser's nearest (Arial has Helvetica's widths), so it's close, not exact.
- **Text written right to left** is drawn a word at a time from its right, so its letters join as they do in the PDF.
- **Every page each time:** a 28-page report is paginated, laid out and drawn in about 17ms on a laptop. In a page view, do it in a Worker.

## Where everything landed

`layoutDocument(design, options)` takes `renderPdf`'s options and gives the Document as its PDF lays it out, in px:

- `pages`: each page's `width` and `height`, and its `room` (`top` and `bottom`: below its header, above its footer).
- `nodes`: each block of the design on each `page` it's on, with `path`, `id`, `field`, `type`, its box (`x`, `y`, `width`, `height` from the page's top left) and a block of text's `lines`. A block that goes on to the next page has a node on each, numbered by `part` (from 0); a block of text's says which characters of its text it shows (`chars`). `cut` is `"some"` or `"all"` where the page's room ends before it does. A PageHeader's and a PageFooter's blocks are on every page.
- `diagnostics`: `renderPdf`'s.

It draws the PDF to measure it.

## Known limits

- **WOFF2 isn't drawn**: react-pdf would embed its letters blank. Give TTF, OTF or WOFF.
- **SVG images aren't drawn**: give a PNG or JPEG. An `Svg` (the element) is drawn as vectors.
- **The standard PDF fonts draw Western European characters only.** For any other script, give a font file that has it. Whether a file given has every character isn't checked.
- **What stays whole**: an image, an `Svg`, a Button, a block with a set height, and a Row whose columns sit at its middle or end (or wrap) don't split between pages. One taller than a page is cut off where it is, with `document/overflow`.
- **Text that changes direction across a line break** (Arabic quoted in an English paragraph, broken inside the quote) can be drawn up to a space's width from where the whole paragraph would set it, when its paragraph is split between pages. Its words and lines are the same.
- **The print HTML flows only when it's drawn from a plan** (`render(design, { plan })`): plain `render()` has no font files to measure with, so its pages hold what they're given and cut the rest.
- **No hover, no video player**: a Button shows its own colors, a Video its thumbnail or title.

## License

MIT
