# Templates

Ready-made [Hyper Elements](https://hyperelements.dev) designs: emails, web pages, PDFs and images, each one plain JSX
of Elements' own elements. None of them carries a brand: each takes its colors, fonts, logo and company details
from a brand it's given, and is tested in every sample brand for readable text and a layout that fits.

**To use one,** open it on [hyperelements.dev/templates](https://hyperelements.dev/templates), pick a sample brand,
and copy it with its `brand.ts` (or as one file). It imports only Elements' own packages. Put your own brand in
`brand.ts`, and change anything else you like.

**To add one,** see [CONTRIBUTING.md](./CONTRIBUTING.md).

This file is written by `pnpm --filter ./templates readme`. Don't edit it by hand.

## By category

### Account

- **Magic link** (`magic-link`): A one-time link that signs the reader in without a password.
  - [Minimal](./minimal/emails/magic-link.tsx), as an email
- **Password reset** (`password-reset`): A link to choose a new password, after someone asked to reset theirs.
  - [Minimal](./minimal/emails/password-reset.tsx), as an email
- **Sign-in code** (`sign-in-code`): A one-time code the reader types to sign in or to confirm an action.
  - [Minimal](./minimal/emails/sign-in-code.tsx), as an email
- **Verify email** (`verify-email`): A link that confirms an email address belongs to the person who signed up with it.
  - [Minimal](./minimal/emails/verify-email.tsx), as an email
- **Welcome** (`welcome`): The first email after someone signs up: a greeting, a few next steps and one button.
  - [Minimal](./minimal/emails/welcome.tsx), as an email

### Billing

- **Invoice** (`invoice`): A bill the reader has to pay: what it's for, how much, and when it's due.
  - [Ledger](./ledger/emails/invoice.tsx), as an email
  - [Ledger](./ledger/documents/invoice.tsx), as a PDF
- **Quote** (`quote`): An estimate before work starts: what's included, what it costs, and how long the price holds.
  - [Ledger](./ledger/documents/quote.tsx), as a PDF
- **Receipt** (`receipt`): Proof of a payment already made: what was bought, what it cost, and when it was paid.
  - [Ledger](./ledger/documents/receipt.tsx), as a PDF
  - [Minimal](./minimal/emails/receipt.tsx), as an email

### Orders

- **Order confirmation** (`order-confirmation`): Confirming an order was placed: what's in it, what it costs, and where it's going.
  - [Minimal](./minimal/emails/order-confirmation.tsx), as an email
- **Shipping** (`shipping`): Telling someone their order is on its way: who's carrying it, when it should arrive, and how to track it.
  - [Minimal](./minimal/emails/shipping.tsx), as an email

### Launches

- **Announcement** (`announcement`): One launch or piece of news: a headline, a date, and what's new.
  - [Signal](./signal/images/announcement.tsx), as an image

### Content

- **Newsletter** (`newsletter`): A regular issue of written news: a subject, a lead, and sections the writer fills in.
  - [Editorial](./editorial/emails/newsletter.tsx), as an email
- **Open Graph card** (`og-card`): The picture a link shows when it's shared: an article's or a page's title, with the brand.
  - [Signal](./signal/images/og-card.tsx), as an image

### Events

- **Event** (`event`): An event people can come to: what it is, when and where, and how to register.
  - [Summit](./summit/emails/event.tsx), as an email
  - [Summit](./summit/pages/event.tsx), as a page
- **Speaker** (`speaker`): Announcing one speaker for an event: who they are, what they'll talk about, and when.
  - [Summit](./summit/images/speaker.tsx), as an image
- **Ticket** (`ticket`): A ticket someone holds for an event: who it's for, when and where, and the code to show at the door.
  - [Summit](./summit/documents/ticket.tsx), as a PDF

### Records

- **Certificate** (`certificate`): Recognizing someone for finishing or achieving something: who, what, when, and who signs it.
  - [Laurel](./laurel/documents/certificate.tsx), as a PDF

## Kits

| Kit | What it is | Designs | By |
|---|---|---|---|
| [Editorial](./editorial) | A newsletter with room to read: a masthead, a lead story, more stories with thumbnails, and a closing note | `emails/newsletter` | Hyper Elements |
| [Laurel](./laurel) | A formal certificate on a landscape page: a framed border, the recipient's name large, and lines for who signs it | `documents/certificate` | Hyper Elements |
| [Ledger](./ledger) | Quiet, tabular billing: an invoice as the email that sends it and as the PDF itself, from one set of values | `emails/invoice`, `documents/invoice`, `documents/quote`, `documents/receipt` | Hyper Elements |
| [Minimal](./minimal) | Quiet transactional email: one card on a tinted page, the logo above it and the address below | `emails/magic-link`, `emails/order-confirmation`, `emails/password-reset`, `emails/receipt`, `emails/shipping`, `emails/sign-in-code`, `emails/verify-email`, `emails/welcome` | Hyper Elements |
| [Signal](./signal) | A launch graphic for social posts: a fitted headline, three features and the product in a window, square or landscape | `images/announcement`, `images/og-card` | Hyper Elements |
| [Summit](./summit) | Everything for an event, in one look: the invitation, the event's page, the ticket, and a card for each speaker | `emails/event`, `pages/event`, `documents/ticket`, `images/speaker` | Hyper Elements |

## Sample brands

Every design is tested in each of these invented brands. None is a real company.

- **Casa Albero** ([`_brands/casa-albero.ts`](./_brands/casa-albero.ts))
- **Ember** ([`_brands/ember.ts`](./_brands/ember.ts))
- **Keel** ([`_brands/keel.ts`](./_brands/keel.ts))
- **Orbit** ([`_brands/orbit.ts`](./_brands/orbit.ts))
- **Oyen** ([`_brands/oyen.ts`](./_brands/oyen.ts))
- **Pell & Ashby** ([`_brands/pell-ashby.ts`](./_brands/pell-ashby.ts))
- **Pith** ([`_brands/pith.ts`](./_brands/pith.ts))
- **Quarry** ([`_brands/quarry.ts`](./_brands/quarry.ts))
- **Slow Signals** ([`_brands/slow-signals.ts`](./_brands/slow-signals.ts))
