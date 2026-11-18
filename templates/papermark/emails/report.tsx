import { Button, Column, Divider, Email, Heading, Image, LineBreak, Link, Row, Section, Text, token } from "@hyper-elements/react";
import type { Brand } from "../../_brand";

export const meta = {
  label: "Year in review",
  description: "A year's numbers told as a story: big figures in rounded panels, the reader's activity side by side, where readers were, and a button to share it",
  recreates: { what: "Year in review email", original: "https://www.papermark.com" },
};

const locations = ["United States", "United Kingdom", "Germany", "Japan"];

export default function PapermarkReport({ brand }: { brand: Brand }) {
  const site = brand.links.site;
  const panel = { padding: token("spacing.xl"), backgroundColor: token("colors.surface"), borderRadius: token("radii.md"), mobile: { padding: [token("spacing.xl"), token("spacing.md")] } } as const;
  const note = { fontSize: token("fontSizes.small"), lineHeight: "20px" } as const;
  const label = { fontSize: token("fontSizes.small"), textTransform: "uppercase", letterSpacing: 0.7 } as const;
  const rule = { borderTop: { width: 1, style: "solid", color: token("colors.accent") }, padding: [token("spacing.lg"), 0, 0] } as const;
  const huge = { fontSize: 72, fontWeight: 700, lineHeight: 1, padding: [token("spacing.md"), 0], mobile: { fontSize: 56 } } as const;
  const button = {
    alignSelf: "center",
    backgroundColor: token("colors.primary"),
    color: token("colors.primaryForeground"),
    fontSize: token("fontSizes.small"),
    fontWeight: 700,
    lineHeight: "20px",
    padding: [token("spacing.md"), 48],
    borderRadius: token("radii.sm"),
  } as const;
  const stat = (what: string, count: number, unit: string) => (
    <Column style={{ width: "33.33%" }}>
      <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>{what}</Text>
      <Text style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1, padding: [token("spacing.xs"), 0] }}>{count}</Text>
      <Text style={{ fontSize: 24, lineHeight: 1.3, mobile: { fontSize: 18 } }}>{unit}</Text>
    </Column>
  );
  return (
    <Email
      width={600}
      title={`Your Year with ${brand.name}`}
      previewText="See your stats from 2024"
      lang={brand.lang ?? "en"}
      dir={brand.dir}
      theme={brand.theme}
      fonts={brand.fonts}
      style={{
        backgroundColor: token("colors.background"),
        color: token("colors.foreground"),
        fontSize: token("fontSizes.body"),
        lineHeight: token("lineHeights.body"),
        textAlign: "center",
        gap: token("spacing.lg"),
      }}
    >
      <Section>
        <Column style={{ padding: [48, token("spacing.xl"), token("spacing.xl")], alignItems: "center", mobile: { padding: [token("spacing.xl"), token("spacing.md")] } }}>
          <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 122, alignSelf: "center" }} />
          <Text style={{ ...label, padding: [token("spacing.xl"), 0, 0] }}>2024 in review</Text>
          <Heading level={1} style={{ padding: [token("spacing.md"), 0] }}>
            Your Year with {brand.name}
          </Heading>
          <Text style={{ fontSize: 18, lineHeight: "32px", padding: [0, 0, token("spacing.xl")] }}>
            What a year it's been! Let's take a look at how you've used {brand.name} to share your important documents.
          </Text>
          <Button href={`${site}/year-in-review`} style={button}>
            Share your stats
          </Button>
        </Column>
      </Section>

      <Section>
        <Column style={panel}>
          <Heading level={2} style={{ color: token("colors.muted") }}>
            Viewers spent
          </Heading>
          <Text style={huge}>1234</Text>
          <Text style={{ fontSize: 30, lineHeight: 1.2, padding: [0, 0, token("spacing.md")] }}>minutes on your documents</Text>
          <Text style={note}>That's a lot of engagement! Your documents are resonating with your visitors.</Text>
          <Divider style={rule} />
          <Heading level={3} style={{ ...label, padding: [20, 0, 0] }}>
            Your activity
          </Heading>
          <Row stackOnMobile={false} style={{ padding: [20, 0, 0] }}>
            {stat("You uploaded", 25, "documents")}
            {stat("You shared", 50, "links")}
            {stat("You received", 500, "views")}
          </Row>
        </Column>
      </Section>

      <Section>
        <Column style={panel}>
          <Heading level={2}>Your top document</Heading>
          <Text style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, padding: [token("spacing.md"), 0] }}>"Q4 Financial Report"</Text>
          <Text style={{ fontSize: 48, lineHeight: 1, padding: [0, 0, token("spacing.md")], mobile: { fontSize: 40 } }}>150 views</Text>
          <Text style={note}>This document really caught your visitor's attention!</Text>
        </Column>
      </Section>

      <Section>
        <Column style={panel}>
          <Heading level={2} style={{ color: token("colors.muted") }}>
            Your most active month
          </Heading>
          <Text style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, padding: [token("spacing.md"), 0], mobile: { fontSize: 40 } }}>September</Text>
          <Text style={{ fontSize: 30, lineHeight: 1.2, padding: [0, 0, token("spacing.md")] }}>with 200 views</Text>
          <Text style={note}>September was your busiest month. What did you share that got so much attention?</Text>
          <Divider style={rule} />
          <Heading level={3} style={{ ...label, padding: [20, 0, 0] }}>
            You're in the top
          </Heading>
          <Text style={huge}>95%</Text>
          <Text style={{ fontSize: 20, lineHeight: 1.4, padding: [0, 0, token("spacing.md")] }}>of sharers on {brand.name}</Text>
          <Text style={note}>You're one of our most active users. Thank you for sharing with {brand.name}!</Text>
        </Column>
      </Section>

      <Section>
        <Column style={panel}>
          <Heading level={2} style={{ color: token("colors.muted") }}>
            Your documents were viewed from
          </Heading>
          <Row stackOnMobile={false} style={{ flexWrap: "wrap", justifyContent: "center", padding: [token("spacing.sm"), 0] }}>
            {locations.map((location) => (
              <Column key={location} style={{ flex: "none", padding: token("spacing.xs") }}>
                <Text
                  style={{
                    fontSize: token("fontSizes.small"),
                    lineHeight: "20px",
                    padding: [token("spacing.xs"), 12],
                    backgroundColor: token("colors.primary"),
                    color: token("colors.primaryForeground"),
                    borderRadius: token("radii.sm"),
                  }}
                >
                  {location}
                </Text>
              </Column>
            ))}
          </Row>
          <Text style={{ ...note, color: token("colors.muted") }}>Your documents get attention from all over the world!</Text>
        </Column>
      </Section>

      <Section>
        <Column style={{ padding: [token("spacing.md"), token("spacing.xl"), token("spacing.lg")], gap: token("spacing.md"), alignItems: "center", mobile: { padding: [token("spacing.md"), token("spacing.md"), token("spacing.lg")] } }}>
          <Text style={{ fontSize: 20, lineHeight: "32px" }}>
            We're excited to support you next year! <LineBreak />
            Happy Holidays from the {brand.name} team :)
          </Text>
          <Button href={`${site}/year-in-review`} style={button}>
            Share your stats
          </Button>
          <Text style={{ fontSize: token("fontSizes.small"), lineHeight: "24px" }}>
            <Link href={`${site}/dashboard`} style={{ color: token("colors.primary"), fontWeight: 700, textDecoration: "none" }}>
              Go to your dashboard
            </Link>
          </Text>
        </Column>
      </Section>
    </Email>
  );
}
