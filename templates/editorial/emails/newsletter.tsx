import { Button, Column, Divider, Email, Heading, Image, Link, Row, Section, Text, prop, token } from "@hyper-elements/react";
import { field, formatDate, template } from "@hyper-elements/react/template";
import { lint } from "@hyper-elements/lint";
import type { Brand } from "../../_brand";
import { newsletter } from "../../_categories/newsletter";

const EDITORIAL_WIDTH = 600;
const EDITORIAL_ASSETS = "https://hyperelements.dev/generated/kits/assets/kits/editorial/";

export default function editorialNewsletter(brand: Brand) {
  const href = (to: string | { href: string }) => {
    const url = new URL(typeof to === "string" ? to : to.href, brand.links.site);
    for (const [key, value] of Object.entries(brand.links.params ?? {})) url.searchParams.set(key, value);
    return url.toString();
  };
  // The card's inner width, for the lead image: the email's width less the page's side padding and the card's border.
  const gutter = Number((brand.theme.spacing as Record<string, number>).md);
  const cardWidth = EDITORIAL_WIDTH - 2 * gutter - 2;
  const kicker = { fontSize: token("fontSizes.small"), fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" } as const;
  return template({
    id: "templates.EditorialNewsletterEmail",
    version: "1.0.0",
    label: "Newsletter",
    description: "A regular issue: a masthead with the issue and date, a lead story with its image, more stories with thumbnails, a closing note, and an unsubscribe footer",
    guidance: "Friendly and plain: sentence case, no exclamation marks. The lead is the issue's one big story; each other story is a title and two sentences at most.",
    root: "Email",
    fields: {
      ...newsletter.required,
      issue: prop.text({ label: "Issue", required: true, maxLength: 20 }),
      date: prop.date({ label: "Sent on", required: true }),
      lead: prop.object(
        {
          kicker: prop.text({ label: "Kicker", maxLength: 30 }),
          title: prop.text({ label: "Title", required: true, maxLength: 80 }),
          summary: prop.text({ label: "Summary", required: true, maxLength: 300 }),
          image: field.image({ label: "Image", required: true, aspect: { min: 1.5, max: 2.1 }, minWidth: 1000, accepts: ["png", "jpeg"], guidance: "A wide picture for the story, with no words in it." }),
          href: prop.link({ label: "Link", required: true }),
          cta: prop.text({ label: "Button", maxLength: 30, default: "Read the story" }),
        },
        { label: "Lead story", required: true },
      ),
      stories: prop.list(
        prop.object(
          {
            title: prop.text({ label: "Title", required: true, maxLength: 80 }),
            summary: prop.text({ label: "Summary", required: true, maxLength: 200 }),
            image: field.image({ label: "Thumbnail", aspect: { min: 0.9, max: 1.5 }, minWidth: 280, accepts: ["png", "jpeg"] }),
            href: prop.link({ label: "Link", required: true }),
          },
          { label: "Story" },
        ),
        { label: "More stories", min: 0, max: 4 },
      ),
      note: prop.object(
        {
          title: prop.text({ label: "Title", required: true, maxLength: 60 }),
          text: prop.text({ label: "Text", required: true, maxLength: 240 }),
          label: prop.text({ label: "Button", required: true, maxLength: 30 }),
          href: prop.link({ label: "Link", required: true }),
        },
        { label: "Closing note" },
      ),
    },
    rules: {
      plugins: { lint: lint({ kind: "marketing" }) },
      require: { lint: ["contrast", "text-size", "link-text", "alt-text", "unsubscribe", "lang"], core: ["layout/overflow"] },
      links: { domains: brand.links.domains, ...(brand.links.params ? { params: brand.links.params } : {}) },
      root: { lang: true, previewText: true },
    },
    example: {
      ...newsletter.example,
      issue: "No. 14",
      date: "2026-03-05",
      lead: {
        kicker: "This month",
        title: "Exports that finish before your coffee does",
        summary: "We rebuilt the export pipeline from the ground up. Big projects that took minutes now take seconds, and there's nothing to change in your settings to get it.",
        image: { src: `${EDITORIAL_ASSETS}lead.png`, width: 1200, height: 680 },
        href: "/blog/faster-exports",
        cta: "Read about faster exports",
      },
      stories: [
        {
          title: "Notes that sound like you",
          summary: "Release notes now start from what you've written before, so a first draft already has your voice.",
          image: { src: `${EDITORIAL_ASSETS}recorder.png`, width: 1020, height: 900 },
          href: "/blog/your-voice",
        },
        {
          title: "A new look for shared boards",
          summary: "Boards you share outside your team get cleaner cards and a calmer layout.",
          image: { src: `${EDITORIAL_ASSETS}shapes.png`, width: 1600, height: 1200 },
          href: "/blog/shared-boards",
        },
        {
          title: "Office hours, every other Thursday",
          summary: "Bring a question, or just listen in. We answer what you ask, live.",
          href: "/events/office-hours",
        },
      ],
      note: {
        title: "Come to the open house",
        text: "We're opening the studio for an afternoon of demos and coffee. Bring a friend.",
        label: "Save a seat at the open house",
        href: "/events/open-house",
      },
    },
    render(v) {
      const date = formatDate(v.date, brand.lang ?? "en", { month: "long", day: "numeric" });
      return (
        <Email
          width={EDITORIAL_WIDTH}
          title={v.subject}
          previewText={v.preview}
          lang={brand.lang ?? "en"}
          {...(brand.dir ? { dir: brand.dir } : {})}
          theme={brand.theme}
          fonts={brand.fonts}
          style={{ backgroundColor: token("colors.surface"), fontSize: token("fontSizes.body"), lineHeight: token("lineHeights.body") }}
        >
          <Column style={{ padding: [token("spacing.lg"), token("spacing.md")], gap: token("spacing.lg") }}>
            {/* The masthead: the logo, and which issue this is. */}
            <Row stackOnMobile={false} style={{ alignItems: "center", gap: token("spacing.md"), padding: [0, token("spacing.sm")] }}>
              <Column>
                <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 140 }} />
              </Column>
              <Column>
                <Text field="issue" style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), textAlign: "right" }}>
                  {v.issue} · {date}
                </Text>
              </Column>
            </Row>

            <Column style={{ backgroundColor: token("colors.background"), borderRadius: token("radii.md"), border: { width: 1, style: "solid", color: token("colors.border") } }}>
              {/* The lead story: its picture across the card, then its words. */}
              <Image field="lead.image" src={v.lead.image} alt="" style={{ width: cardWidth, borderRadius: { topLeft: token("radii.md"), topRight: token("radii.md") } }} />
              <Column field="lead" style={{ padding: token("spacing.xl"), gap: token("spacing.md") }}>
                {v.lead.kicker ? <Text style={{ ...kicker, color: token("colors.primary") }}>{v.lead.kicker}</Text> : null}
                <Heading level={1}>{v.lead.title}</Heading>
                <Text>{v.lead.summary}</Text>
                <Button href={href(v.lead.href)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
                  {v.lead.cta}
                </Button>
              </Column>

              {v.stories.length ? (
                <Column field="stories" style={{ padding: [0, token("spacing.xl"), token("spacing.xl")], gap: token("spacing.lg") }}>
                  <Divider />
                  <Heading level={2}>Also in this issue</Heading>
                  {v.stories.map((story, i) => (
                    <Row key={i} style={{ gap: token("spacing.md"), alignItems: "start" }}>
                      {story.image ? (
                        <Column style={{ width: 140 }}>
                          <Image field={`stories[${i}].image`} src={story.image} alt="" style={{ width: 140, borderRadius: token("radii.sm") }} />
                        </Column>
                      ) : null}
                      <Column style={{ gap: token("spacing.xs") }}>
                        <Heading level={3}>
                          <Link href={href(story.href)} style={{ textDecoration: "none" }}>{story.title}</Link>
                        </Heading>
                        <Text style={{ color: token("colors.muted") }}>{story.summary}</Text>
                      </Column>
                    </Row>
                  ))}
                </Column>
              ) : null}

              {v.note ? (
                <Column field="note" style={{ padding: [0, token("spacing.xl"), token("spacing.xl")] }}>
                  <Column style={{ backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: token("spacing.lg"), gap: token("spacing.sm") }}>
                    <Heading level={3}>{v.note.title}</Heading>
                    <Text>{v.note.text}</Text>
                    <Button href={href(v.note.href)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
                      {v.note.label}
                    </Button>
                  </Column>
                </Column>
              ) : null}
            </Column>

            {/* Why it came, who sent it, and how to stop it. */}
            <Column style={{ padding: [0, token("spacing.sm")], gap: token("spacing.xs") }}>
              <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), textAlign: "center" }}>
                You're getting {brand.name}'s newsletter because you signed up for it.
              </Text>
              <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), textAlign: "center" }}>
                {brand.name}
                {brand.address ? `, ${brand.address}` : ""}
              </Text>
              <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), textAlign: "center" }}>
                <Link href={href("/unsubscribe")}>Unsubscribe from these emails</Link> · <Link href={href("/account/emails")}>Choose which emails you get</Link>
              </Text>
            </Column>
          </Column>
        </Email>
      );
    },
  });
}
