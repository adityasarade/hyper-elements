import type { ReactNode } from "react";
import { Column, Email, Image, Link, Text, token } from "@hyper-elements/react";
import { lint } from "@hyper-elements/lint";
import type { Brand } from "../_brand";

/** A link's address: a path on the brand's site, or a full URL, with the brand's required parameters. */
export function minimalHref(brand: Brand, to: string | { href: string }): string {
  const url = new URL(typeof to === "string" ? to : to.href, brand.links.site);
  for (const [key, value] of Object.entries(brand.links.params ?? {})) url.searchParams.set(key, value);
  return url.toString();
}

/** The rules every Minimal email holds to. */
export function minimalRules(brand: Brand) {
  return {
    plugins: { lint: lint() },
    require: { lint: ["contrast", "text-size", "link-text", "alt-text"], core: ["layout/overflow"] },
    links: { domains: brand.links.domains, ...(brand.links.params ? { params: brand.links.params } : {}) },
    root: { lang: true as const, previewText: true as const },
  };
}

/** The email around a Minimal message: the logo, one card holding the message (with a band of the brand's color
 * across its top, where it has one), and the brand's address and site under it. */
export function minimalEmail(brand: Brand, email: { title: string; preview: string; band?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <Email
      width={560}
      title={email.title}
      previewText={email.preview}
      lang={brand.lang ?? "en"}
      {...(brand.dir ? { dir: brand.dir } : {})}
      theme={brand.theme}
      fonts={brand.fonts}
      style={{ backgroundColor: token("colors.surface"), fontSize: token("fontSizes.body"), lineHeight: token("lineHeights.body") }}
    >
      <Column style={{ padding: [token("spacing.xl"), token("spacing.md"), token("spacing.lg")], gap: token("spacing.lg") }}>
        <Column style={{ alignItems: "center" }}>
          <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 150 }} />
        </Column>
        <Column style={{ backgroundColor: token("colors.background"), borderRadius: token("radii.md"), border: { width: 1, style: "solid", color: token("colors.border") } }}>
          {email.band ? (
            <Column
              style={{
                backgroundColor: token("colors.primary"),
                color: token("colors.primaryForeground"),
                padding: [token("spacing.xl"), token("spacing.xl"), token("spacing.lg")],
                gap: token("spacing.sm"),
                borderRadius: { topLeft: token("radii.md"), topRight: token("radii.md") },
              }}
            >
              {email.band}
            </Column>
          ) : null}
          <Column style={{ padding: token("spacing.xl"), gap: token("spacing.md") }}>{email.children}</Column>
        </Column>
        <Column style={{ gap: token("spacing.xs") }}>
          {email.footer ?? null}
          <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), textAlign: "center" }}>
            {brand.name}
            {brand.address ? ` · ${brand.address}` : ""}
          </Text>
          <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), textAlign: "center" }}>
            <Link href={minimalHref(brand, "/")}>Visit {brand.name}</Link> · <Link href={minimalHref(brand, "/help")}>Get help from {brand.name}</Link>
          </Text>
        </Column>
      </Column>
    </Email>
  );
}

/** A small label in capitals, over what it names. */
export function MinimalKicker({ children, color }: { children: ReactNode; color?: "primary" | "primaryForeground" | "muted" }) {
  return (
    <Text style={{ fontSize: token("fontSizes.small"), fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: token(`colors.${color ?? "muted"}`) }}>
      {children}
    </Text>
  );
}
