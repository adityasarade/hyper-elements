/** Papermark, as its year in review email draws it, with these changes: its four tinted panels (orange, gray, tan and
 * green) share one surface, the orange tint (#fb7a00 at 10% on white), since a brand has one; its orange label and
 * heading color (#a63b00) is the muted text, and its gray-900 (#101828) the primary, so its buttons stay near-black;
 * its green location pills (white on #10b981, 2.5:1) are drawn in the primary, which passes; its medium (500) weights
 * are drawn at 400, since Inter ships at 400 and 700 here; and Inter leads its system font stack, since a brand ships
 * the font files it's drawn in. Its text smaller than 14px (the 12px section labels) is drawn at 14px. Its site lists
 * no postal address, so the brand has none. */
import { defineTheme } from "@hyper-elements/react";
import type { Brand } from "../_brand";

export const brand: Brand = {
  name: "Papermark",
  theme: defineTheme({
    colors: {
      background: "#ffffff",
      foreground: "#101828",
      primary: "#101828",
      primaryForeground: "#ffffff",
      border: "#e5e7eb",
      muted: "#a63b00",
      surface: "#fff2e6",
      accent: "#fb7a00",
    },
    fonts: {
      body: "Inter, ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      heading: "Inter, ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    },
    fontSizes: { body: 16, small: 14 },
    lineHeights: { body: 1.5, heading: 1.2 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    radii: { sm: 9999, md: 16 },
    elements: {
      Heading: {
        fontWeight: 400,
        by: {
          level: {
            1: { fontSize: 36, lineHeight: 1.25 },
            2: { fontSize: 30, lineHeight: 1.2 },
            3: { fontSize: 20, lineHeight: 1.4 },
          },
        },
      },
    },
  }),
  logo: { src: "https://hyperelements.dev/generated/kits/assets/recreations/papermark/logo.png", width: 244, height: 64, alt: "Papermark" },
  links: { site: "https://www.papermark.com", domains: ["papermark.com", "*.papermark.com"] },
  lang: "en",
  fonts: [
    { family: "Inter", src: "https://hyperelements.dev/generated/kits/assets/fonts/Inter-400.ttf", weight: 400, style: "normal" },
    { family: "Inter", src: "https://hyperelements.dev/generated/kits/assets/fonts/Inter-700.ttf", weight: 700, style: "normal" },
  ],
};
