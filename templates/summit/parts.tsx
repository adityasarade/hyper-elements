import { Column, Text, token } from "@hyper-elements/react";
import { formatDate } from "@hyper-elements/react/template";
import { lint } from "@hyper-elements/lint";
import type { Brand } from "../_brand";

/** A link's address: a path on the brand's site, or a full URL, with the brand's required parameters. */
export function summitHref(brand: Brand, to: string | { href: string }): string {
  const url = new URL(typeof to === "string" ? to : to.href, brand.links.site);
  for (const [key, value] of Object.entries(brand.links.params ?? {})) url.searchParams.set(key, value);
  return url.toString();
}

/** The brand's link rules. */
export const summitLinks = (brand: Brand) => ({ domains: brand.links.domains, ...(brand.links.params ? { params: brand.links.params } : {}) });

/** The rules a Summit email or page holds to. */
export function summitScreenRules(brand: Brand) {
  return {
    plugins: { lint: lint() },
    require: { lint: ["contrast", "text-size", "link-text", "alt-text"], core: ["layout/overflow"] },
    links: summitLinks(brand),
    root: { lang: true as const },
  };
}

/** A date in the brand's language. */
export const summitDate = (brand: Brand, date: string, options: Intl.DateTimeFormatOptions) => formatDate(date, brand.lang ?? "en", options);

/** A date as a badge: the month small and the day large, on the brand's surface. */
export function SummitDateBadge({ brand, date, size = 1 }: { brand: Brand; date: string; size?: number }) {
  return (
    <Column style={{ width: 76 * size, backgroundColor: token("colors.surface"), borderRadius: token("radii.md"), padding: [10 * size, 0] }}>
      <Text style={{ fontSize: token("fontSizes.small"), fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: token("colors.primary"), textAlign: "center" }}>
        {summitDate(brand, date, { month: "short" })}
      </Text>
      <Text style={{ fontSize: 30 * size, fontWeight: 700, lineHeight: 1.1, textAlign: "center" }}>{summitDate(brand, date, { day: "numeric" })}</Text>
    </Column>
  );
}
