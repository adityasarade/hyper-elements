# Contributing templates

This folder holds templates anyone can copy: emails, web pages, PDFs and images written with Hyper Elements, each with
its guardrails already set. You're welcome to add yours.

Every template here works in any brand. It sets the layout and the rules, and takes its colors, fonts, logo and
company details from a brand it's given. The website shows each template in the sample brands, and people copy it
with their own.

## What you can contribute

- **A kit:** one or more templates with one look. Most contributions are kits.
- **A template to an existing kit:** with the kit's author's approval in the pull request (or a maintainer's, if the
  author doesn't answer).
- **A category:** a job the list doesn't have yet.
- **A sample brand:** an invented one that covers a look the others don't.
- **A recreation:** a faithful rebuild of something a real company actually sent, as a kit.

To ask for a template rather than write one, open a [template request](https://github.com/hyper-elements/hyper-elements/issues/new?template=template-request.yml).

## How the folder works

```text
templates/
  _brand.ts          the Brand type, the tokens a template may use, and checkBrand()
  _brands/           the sample brands
  _categories/       the jobs: one file each
  _assets/           fonts, and the brands' and kits' images
  ledger/            a kit
    kit.ts           its name, description, author and tags
    parts.tsx        what its templates share (optional)
    emails/invoice.tsx
    documents/invoice.tsx
```

- **Every folder in `templates/` is a kit,** except the shared ones starting with `_`, and `.preview/`, `.single/` and
  `node_modules/`, which aren't committed. A kit can hold one template or many.
- **A template's path says what it is:** `<kit>/<emails|pages|documents|images>/<category>.tsx`. So
  `ledger/documents/invoice.tsx` is the Ledger kit's invoice, as a PDF.
- **A kit's name** is lowercase words joined by hyphens: `ledger`, `quiet-hours`.

## Before you start

1. Read [Templates](https://hyperelements.dev/docs/templates) in the docs: fields, rules and formats.
2. Pick the categories your kit covers from `_categories/`, or from the list in [README.md](./README.md) and below.
3. Look at the other kits' versions of those categories on [hyperelements.dev/templates](https://hyperelements.dev/templates).
   Yours should look clearly different, not only in color, since the brand sets the colors.

## Write a template

A template is a function that takes a brand and returns a `template()`:

```tsx
import { Column, Document, Heading, Table, TableCell, TableRow, Text, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { invoice } from "../../_categories/invoice";
import { LedgerLetterhead } from "../parts";

export default function ledgerInvoiceDocument(brand: Brand) {
  return template({
    id: "templates.LedgerInvoiceDocument",
    version: "1.0.0",
    label: "Invoice",
    description: "An invoice as a PDF",
    root: "Document",
    fields: { ...invoice.required /* , and your own fields */ },
    example: { ...invoice.example /* , and your own fields' values */ },
    rules: {
      require: { core: ["layout/overflow", "document/overflow"] },
      links: { domains: brand.links.domains },
    },
    render: (values) => (
      <Document theme={brand.theme} fonts={brand.fonts} lang={brand.lang ?? "en"}>
        <LedgerLetterhead brand={brand} />
        {/* … */}
      </Document>
    ),
  });
}
```

The rules every template follows:

- **No colors or fonts of its own.** Use the brand's tokens: `token("colors.primary")`, `token("fontSizes.small")`.
  `_brand.ts` lists the ones you can use (`CONTRACT`). Heading sizes and weights come from the brand too.
- **Take your category's required fields,** of the same kinds. Add any others you need.
- **Set the required rules for your root:**
  - an Email or a Page requires lint's `contrast`, `text-size`, `link-text` and `alt-text` (with
    `plugins: { lint: lint() }` from `@hyper-elements/lint`)
  - a Document requires `layout/overflow` and `document/overflow`
  - an image requires `canvas/overflow`, and `image/fit`, `image/glyph` and `image/overflow` where it fits text

  Add others where they help. Lint doesn't run on Documents and images; the folder's tests check their contrast
  instead, so draw text only in the brand's pairs: `foreground`, `muted` or `primary` on `background` or `surface`,
  and `primaryForeground` on `primary`. Text inside a Layer needs a background color set on its own box, and text
  that's fitted to its box always needs a 4.5:1 contrast, whatever its largest size.
- **Pass the brand's fonts, language and direction to your root,** and its link domains and parameters to your link
  rules. Write links as paths (`/billing`) and resolve them against `brand.links.site`, so they're on the brand's
  domain in every brand.
- **Its id comes from its path:** `templates.<Kit><Category><Root>`, each hyphenated name in Pascal case.
- **Import only** React, Elements' packages, `_brand.ts` (for its types), your category's file and your own kit's
  `parts.tsx`. Export only your template's function as the default (and a `meta`, if you need one). Don't rename
  imports, and don't reuse a name your category or your kit's parts already use. That's what lets the website turn
  your template into one file anyone can copy.
- **Make it work everywhere it's shown:** on phones, as plain text, with a screen reader, and in a dark brand as well
  as a light one.
- **Use invented sample values,** never real people's names or details.
- **No `Html` blocks.** Raw markup can't be checked for brand colors, contrast or alternate text.
- **A slot's example is JSX in your template file,** not a separate module.
- **Images** you add must be yours to share, or under a license that lets anyone use them. They go under
  `_assets/kits/<kit>/` and are named by their URL under `https://hyperelements.dev/generated/kits/assets/kits/<kit>/`;
  no other image addresses are allowed. Use PNG or JPEG files: some email clients don't show WebP or SVG, and a PDF
  can't draw an SVG. A recreation's images are the exception: see "A recreation".

## A kit

`kit.ts`:

```ts
export const kit = {
  name: "Ledger",
  description: "Quiet, tabular billing: the invoice as an email and a PDF",
  author: "Your Name",
  tags: ["serif", "dense"],
};
```

Put what the kit's templates share in `parts.tsx`: a header and footer, a button style, a link helper. A template may
use only its own kit's parts. If someone else adds a template to your kit, its file says so with
`export const meta = { author: "Their Name" }`.

## A new category

Copy an existing file in `_categories/` and fill it in. Its export is the category's name in camel case
(`signInCode` for `sign-in-code.ts`):

- `group`: one of Account, Billing, Orders, Launches, Content, Events, Social, People, Records, Marketing
- `label`
- `roots`: which outputs the job makes sense for
- `useWhen` and `avoidWhen`: one sentence each, for people and agents choosing
- `required`: only the fields the job can't do without
- `example`

Name it for what the reader gets or does (`sign-in-code`, not `otp`), never for its output (`invoice`, not
`invoice-pdf`). Different sizes of the same thing are formats, not new categories.

These names are agreed, so a pull request that adds one of them needs only its fields: welcome, verify-email,
sign-in-code, magic-link, password-reset, security-alert, invoice, receipt, quote, statement, payment-failed,
trial-ending, subscription-changed, order-confirmation, shipping, delivered, refund, packing-slip, shipping-label,
announcement, changelog, waitlist, landing, pricing, newsletter, digest, article, og-card, thumbnail, event, ticket,
speaker, social-post, quote-card, testimonial, stat-card, job-post, invitation, mention, comment, feedback-request,
certificate, report, letter, contract, proposal, resume, promotion, ad, re-engagement. Any other name, or a new root
for an existing category, needs a maintainer's approval in the pull request, with a reason no category does that job.

## A recreation

A recreation rebuilds something a real company actually sent or published (an email, a page, a document, an image)
as a kit. Its templates are functions of a brand like any other, so anyone can use the layout with their own brand,
and the company's brand is used only for its own kit. It adds:

- `recreates: { company }` in `kit.ts`, and the company's brand in the kit's `brand.ts`, one declaration like a sample
  brand's
- `meta.recreates` in each template: what it rebuilds and where the original can be seen, either a public archive of
  it or your screenshot under `_assets/recreations/<kit>/`

  ```ts
  export const meta = { recreates: { what: "Login code email", original: "https://…" } };
  ```

The rules:

- **Only what the company sent.** No invented emails or documents in a real company's brand, and no lookalike
  companies.
- **Each template in a category,** like any template, or bring the category.
- **Logos and images only as they appear in the original,** saved under `_assets/recreations/<kit>/`.
- **No names or details of real people.** Sample values are invented.
- **Every check still passes,** in the company's brand and in every sample brand. There are no exceptions: if the
  original fails one, such as low contrast, adjust the company brand's color until it passes, and say so in
  `meta.recreates`.
- **The company's brand may hold extra tokens** where the original needs a color the contract doesn't have. A template
  reads one with a fallback to a contract token (`brand.theme.colors.highlight ?? brand.theme.colors.accent`), so the
  sample brands still work.

A recreation is taken down if its company asks, with no discussion: the
[removal form](https://github.com/hyper-elements/hyper-elements/issues/new?template=recreation-removal.yml) is how.

## A sample brand

Sample brands are invented: no real companies, and nothing that looks like one. A new brand should cover a look the
others don't (`_test/range.test.ts` prints how they differ). It's one declaration of literals,
`export const brand: Brand = { … }`, importing only `defineTheme` and the `Brand` type, with every token in
`CONTRACT`, text pairs of at least 4.5:1, and its fonts as TTF or OTF files under `_assets/fonts/` (with their
licenses). Draw its logo with `pnpm --filter ./templates logos`.

## Check your work

```bash
pnpm install
pnpm build
pnpm --filter ./templates typecheck
pnpm --filter ./templates test
pnpm --filter ./templates preview ledger
```

`pnpm build` builds the packages the templates import; run it again after you change one.

- `test` checks every template in every sample brand and format, as CI does: it renders it, checks its colors and
  fonts come from the brand, its text is readable, and its copyable file works on its own.
- `preview` writes your kit in every brand to `templates/.preview/ledger/`; open its `index.html`.

Then record what your kit adds, and commit all of it with your pull request:

```bash
UPDATE_TEMPLATES=1 pnpm --filter ./templates test
pnpm --filter ./templates readme
pnpm --filter @hyper-elements/website generate:kits
```

The first records your templates' output, the second updates this folder's `README.md`, and the last writes the
website's previews and copyable files for your kit. CI checks that each is up to date.

## Open a pull request

Tick each item:

- [ ] The kit is one folder, laid out as above, with `kit.ts` filled in.
- [ ] Each template takes its category's required fields, sets its root's required rules, and its id matches its path.
- [ ] No colors or fonts of its own; only the brand's tokens.
- [ ] `pnpm --filter ./templates typecheck` and `test` pass, and the output, `README.md` and the website's files are
  regenerated and committed.
- [ ] I looked at every template in the preview, in light and dark brands.
- [ ] Sample values are invented. Images are mine to share or openly licensed, or, for a recreation, as in the
  original.
- [ ] A new category, or a new root for one, has a maintainer's approval; a listed category doesn't need it.
- [ ] A template added to someone else's kit has its author's approval.
- [ ] For a recreation: only what the company sent, with where each original can be seen, and its images as in the
  original.

A maintainer reviews it for a look that's clearly different from the other kits' versions of the same categories, and
for correct guardrails.

By contributing, you agree your contribution is released under this repository's MIT license. Images, and a
recreation's brand, belong to their owners.
