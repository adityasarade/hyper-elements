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

/** The email around a Minimal message: the logo, one card holding the message, and the brand's address under it. */
export function minimalEmail(brand: Brand, email: { title: string; preview: string; children: ReactNode }) {
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
      <Column style={{ padding: [token("spacing.xl"), token("spacing.lg"), token("spacing.lg")], gap: token("spacing.lg") }}>
        <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 160 }} />
        <Column
          style={{
            backgroundColor: token("colors.background"),
            padding: token("spacing.xl"),
            gap: token("spacing.md"),
            borderRadius: token("radii.md"),
            border: { width: 1, style: "solid", color: token("colors.border") },
          }}
        >
          {email.children}
        </Column>
        <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
          {brand.name}
          {brand.address ? `, ${brand.address}` : ""}. <Link href={minimalHref(brand, "/")}>Visit {brand.name}</Link>
        </Text>
      </Column>
    </Email>
  );
}
