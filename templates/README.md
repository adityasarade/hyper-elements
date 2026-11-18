# Templates

Ready-made [Hyper Elements](https://hyperelements.dev) templates: emails, web pages, PDFs and images with their guardrails
already set (required checks, link rules, image limits, text that fits). None of them carries a brand: each takes its
colors, fonts, logo and company details from a brand it's given.

**To use one,** open it on [hyperelements.dev/templates](https://hyperelements.dev/templates), pick a sample brand,
and copy its file. It imports only Elements' own packages. Replace the brand block at its top with your own brand.

**To add one,** see [CONTRIBUTING.md](./CONTRIBUTING.md).

This file is written by `pnpm --filter ./templates readme`. Don't edit it by hand.

## By category

### Account

- **Sign-in code** (`sign-in-code`): A one-time code the reader types to sign in or to confirm an action.
  - [Minimal](./minimal/emails/sign-in-code.tsx), as an email
- **Welcome** (`welcome`): The first email after someone signs up: a greeting, a few next steps and one button.
  - [Minimal](./minimal/emails/welcome.tsx), as an email

### Billing

- **Invoice** (`invoice`): A bill the reader has to pay: what it's for, how much, and when it's due.
  - [Ledger](./ledger/emails/invoice.tsx), as an email
  - [Ledger](./ledger/documents/invoice.tsx), as a PDF
- **Receipt** (`receipt`): Proof of a payment already made: what was bought, what it cost, and when it was paid.
  - [Minimal](./minimal/emails/receipt.tsx), as an email

### Launches

- **Announcement** (`announcement`): One launch or piece of news: a headline, a date, and what's new.
  - [Signal](./signal/images/announcement.tsx), as an image

### Content

- **Newsletter** (`newsletter`): A regular issue of written news: a subject, a lead, and sections the writer fills in.
  - [Editorial](./editorial/emails/newsletter.tsx), as an email

## Kits

| Kit | What it is | Templates | By |
|---|---|---|---|
| [Editorial](./editorial) | A newsletter with a masthead and room to read: the writer fills one slot with headings, text and up to two buttons | `emails/newsletter` | Hyper Elements |
| [Ledger](./ledger) | Quiet, tabular billing: an invoice as the email that sends it and as the PDF itself, from one set of values | `emails/invoice`, `documents/invoice` | Hyper Elements |
| [Minimal](./minimal) | Quiet transactional email: one card on a tinted page, the logo above it and the address below | `emails/receipt`, `emails/sign-in-code`, `emails/welcome` | Hyper Elements |
| [Signal](./signal) | A launch graphic for social posts: a fitted headline, three features and the product in a window, square or landscape | `images/announcement` | Hyper Elements |

## Sample brands

Every template is tested in each of these invented brands. None is a real company.

- **Casa Albero** ([`_brands/casa-albero.ts`](./_brands/casa-albero.ts))
- **Ember** ([`_brands/ember.ts`](./_brands/ember.ts))
- **Keel** ([`_brands/keel.ts`](./_brands/keel.ts))
- **Orbit** ([`_brands/orbit.ts`](./_brands/orbit.ts))
- **Oyen** ([`_brands/oyen.ts`](./_brands/oyen.ts))
- **Pell & Ashby** ([`_brands/pell-ashby.ts`](./_brands/pell-ashby.ts))
- **Pith** ([`_brands/pith.ts`](./_brands/pith.ts))
- **Quarry** ([`_brands/quarry.ts`](./_brands/quarry.ts))
- **Slow Signals** ([`_brands/slow-signals.ts`](./_brands/slow-signals.ts))
