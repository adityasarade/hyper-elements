import { Button, Column, Email, Heading, Image, Link, Section, Text, token } from "@hyper-elements/react";
import { field, template } from "@hyper-elements/react/template";
import { lint } from "@hyper-elements/lint";
import type { Brand } from "../../_brand";
import { newsletter } from "../../_categories/newsletter";

export default function editorialNewsletter(brand: Brand) {
  const href = (to: string) => {
    const url = new URL(to, brand.links.site);
    for (const [key, value] of Object.entries(brand.links.params ?? {})) url.searchParams.set(key, value);
    return url.toString();
  };
  return template({
    id: "templates.EditorialNewsletterEmail",
    version: "1.0.0",
    label: "Newsletter",
    description: "A regular issue: the masthead, the subject as its headline, sections the writer fills in, and an unsubscribe footer",
    guidance: "Friendly and plain: sentence case, no exclamation marks. One to three short sections, each a Heading and a Text.",
    root: "Email",
    fields: {
      ...newsletter.required,
      // What the issue's writer writes: these elements only, in the brand's look, with one or two buttons.
      body: field.slot({
        label: "Body",
        required: true,
        allow: [Column, Heading, Text, Button, Link],
        styles: "none",
        count: { Button: { min: 1, max: 2 } },
        guidance: "One to three short sections, each a Heading and a Text, and one or two buttons.",
      }),
    },
    rules: {
      plugins: { lint: lint({ kind: "marketing" }) },
      require: { lint: ["contrast", "text-size", "link-text", "alt-text", "unsubscribe", "lang"], core: ["layout/overflow"] },
      links: { domains: brand.links.domains, ...(brand.links.params ? { params: brand.links.params } : {}) },
      root: { lang: true, previewText: true },
    },
    example: {
      ...newsletter.example,
      body: (
        <Column>
          <Heading level={2}>Faster exports</Heading>
          <Text>Exports now finish in half the time, with no settings to change.</Text>
          <Heading level={2}>Notes in your own voice</Heading>
          <Text>Release notes now start from what you've written before, so they sound like you.</Text>
          <Button href={href("/changelog")}>Read the changelog</Button>
        </Column>
      ),
    },
    render(v) {
      return (
        <Email
          width={600}
          title={v.subject}
          previewText={v.preview}
          lang={brand.lang ?? "en"}
          {...(brand.dir ? { dir: brand.dir } : {})}
          theme={brand.theme}
          fonts={brand.fonts}
          style={{ backgroundColor: token("colors.surface"), fontSize: token("fontSizes.body"), lineHeight: token("lineHeights.body") }}
        >
          <Section style={{ padding: [token("spacing.lg"), token("spacing.xl")] }}>
            <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 150 }} />
          </Section>
          <Section style={{ backgroundColor: token("colors.background"), padding: [token("spacing.xl"), token("spacing.xl"), token("spacing.sm")] }}>
            <Heading field="subject" level={1}>{v.subject}</Heading>
          </Section>
          <Section field="body" style={{ backgroundColor: token("colors.background"), padding: [token("spacing.md"), token("spacing.xl"), token("spacing.xl")] }}>
            {v.body}
          </Section>
          <Section style={{ padding: [token("spacing.lg"), token("spacing.xl")] }}>
            <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              {brand.name}
              {brand.address ? `, ${brand.address}` : ""}. <Link href={href("/unsubscribe")}>Unsubscribe from these emails</Link>
            </Text>
          </Section>
        </Email>
      );
    },
  });
}
