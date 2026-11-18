import { Column, Image, PageFooter, PageNumber, Row, Table, TableCell, TableRow, Text, token } from "@hyper-elements/react";
import { lint } from "@hyper-elements/lint";
import type { Brand } from "../_brand";

/** A link's address: a path on the brand's site, or a full URL, with the brand's required parameters. */
export function ledgerHref(brand: Brand, to: string | { href: string }): string {
  const url = new URL(typeof to === "string" ? to : to.href, brand.links.site);
  for (const [key, value] of Object.entries(brand.links.params ?? {})) url.searchParams.set(key, value);
  return url.toString();
}

/** The brand's link rules, for every Ledger template. */
export function ledgerLinks(brand: Brand) {
  return { domains: brand.links.domains, ...(brand.links.params ? { params: brand.links.params } : {}) };
}

/** The rules a Ledger email holds to. */
export function ledgerEmailRules(brand: Brand) {
  return {
    plugins: { lint: lint() },
    require: { lint: ["contrast", "text-size", "link-text", "alt-text"], core: ["layout/overflow"] },
    links: ledgerLinks(brand),
    root: { lang: true as const, previewText: true as const },
  };
}

/** Money in the brand's language. */
export const ledgerMoney = (brand: Brand, currency: string) => new Intl.NumberFormat(brand.lang ?? "en", { style: "currency", currency });

/** A label over a value. */
export function LedgerFact({ label, value, field, align }: { label: string; value: string; field?: string; align?: "left" | "right" }) {
  return (
    <Column style={{ gap: 2 }}>
      <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), ...(align ? { textAlign: align } : {}) }}>{label}</Text>
      <Text {...(field ? { field } : {})} style={{ fontWeight: 700, ...(align ? { textAlign: align } : {}) }}>
        {value}
      </Text>
    </Column>
  );
}

/** The letterhead: the logo, and the brand's address beside it. */
export function LedgerLetterhead({ brand }: { brand: Brand }) {
  return (
    <Row stackOnMobile={false} style={{ alignItems: "center", gap: token("spacing.md") }}>
      <Column>
        <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 150 }} />
      </Column>
      <Column>
        <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), textAlign: "right" }}>
          {brand.name}
          {brand.address ? ` · ${brand.address}` : ""}
        </Text>
      </Column>
    </Row>
  );
}

/** Lines of a bill as a table: description, quantity, unit price and amount, with a rule under each. */
export function LedgerLines({ brand, currency, lines, field }: { brand: Brand; currency: string; lines: ReadonlyArray<{ description: string; quantity: number; price: number }>; field: string }) {
  const money = ledgerMoney(brand, currency);
  const cell = { padding: [token("spacing.sm"), 0], border: { bottom: { width: 1, style: "solid", color: token("colors.border") } } } as const;
  const right = { ...cell, textAlign: "right" } as const;
  const quiet = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;
  return (
    <Table field={field}>
      <TableRow header>
        <TableCell style={{ ...cell, ...quiet }}>Description</TableCell>
        <TableCell style={{ ...right, ...quiet, width: 60 }}>Qty</TableCell>
        <TableCell style={{ ...right, ...quiet, width: 100 }}>Unit price</TableCell>
        <TableCell style={{ ...right, ...quiet, width: 110 }}>Amount</TableCell>
      </TableRow>
      {lines.map((line, i) => (
        <TableRow key={i}>
          <TableCell style={cell}>{line.description}</TableCell>
          <TableCell style={right}>{String(line.quantity)}</TableCell>
          <TableCell style={right}>{money.format(line.price)}</TableCell>
          <TableCell style={right}>{money.format(line.quantity * line.price)}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}

/** A Ledger document's footer, on every page: the brand, and the page number. */
export function LedgerFooter({ brand }: { brand: Brand }) {
  return (
    <PageFooter>
      <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), padding: [token("spacing.sm"), 0, 0], border: { top: { width: 1, style: "solid", color: token("colors.border") } } }}>
        {brand.name}
        {brand.address ? `, ${brand.address}` : ""}. Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  );
}
