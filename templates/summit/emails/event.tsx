import { Button, Column, Email, Heading, Image, Link, Row, Section, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { event } from "../../_categories/event";
import { SummitDateBadge, summitDate, summitHref, summitScreenRules } from "../parts";

export default function summitEventEmail(brand: Brand) {
  return template({
    id: "templates.SummitEventEmail",
    version: "1.0.0",
    label: "Event invitation",
    description: "An invitation: the event's name on a band of the brand's color, when and where, a button to register, and the day's schedule",
    guidance: "Lead with what the day is for. Keep the schedule to the main moments.",
    root: "Email",
    fields: {
      ...event.required,
      tagline: prop.text({ label: "Tagline", required: true, maxLength: 120 }),
      schedule: prop.list(
        prop.object({ time: prop.text({ label: "Time", required: true, maxLength: 12 }), title: prop.text({ label: "What", required: true, maxLength: 70 }) }, { label: "Moment" }),
        { label: "Schedule", min: 0, max: 6 },
      ),
    },
    rules: summitScreenRules(brand),
    example: {
      ...event.example,
      tagline: "A day of talks and workshops for the people who build and ship software.",
      schedule: [
        { time: "9:30 AM", title: "Doors open, coffee and breakfast" },
        { time: "10:00 AM", title: "Opening talk: shipping weekly without breaking anything" },
        { time: "1:00 PM", title: "Workshops, in four rooms" },
        { time: "5:00 PM", title: "Closing panel, then drinks on the roof" },
      ],
    },
    render(v) {
      const day = summitDate(brand, v.starts, { weekday: "long", month: "long", day: "numeric" });
      return (
        <Email
          width={600}
          title={`You're invited to ${v.name}`}
          previewText={`${day}, ${v.place.name}. ${v.tagline}`}
          lang={brand.lang ?? "en"}
          {...(brand.dir ? { dir: brand.dir } : {})}
          theme={brand.theme}
          fonts={brand.fonts}
          style={{ fontSize: token("fontSizes.body"), lineHeight: token("lineHeights.body") }}
        >
          <Section style={{ padding: [token("spacing.lg"), token("spacing.xl")] }}>
            <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 140 }} />
          </Section>
          <Section style={{ backgroundColor: token("colors.primary"), color: token("colors.primaryForeground"), padding: [token("spacing.xl"), token("spacing.xl")] }}>
            <Column style={{ gap: token("spacing.sm") }}>
              <Text style={{ fontSize: token("fontSizes.small"), fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>You're invited</Text>
              <Heading field="name" level={1} style={{ color: token("colors.primaryForeground") }}>{v.name}</Heading>
              <Text field="tagline">{v.tagline}</Text>
            </Column>
          </Section>
          <Section style={{ padding: [token("spacing.xl"), token("spacing.xl"), token("spacing.lg")] }}>
            <Column style={{ gap: token("spacing.lg") }}>
              <Row stackOnMobile={false} style={{ gap: token("spacing.md"), alignItems: "center" }}>
                <Column style={{ width: 76 }}>
                  <SummitDateBadge brand={brand} date={v.starts} />
                </Column>
                <Column style={{ gap: 2 }}>
                  <Text field="starts" style={{ fontWeight: 700 }}>{day}</Text>
                  <Text field="time" style={{ color: token("colors.muted") }}>{v.time}</Text>
                  <Text field="place" style={{ color: token("colors.muted") }}>
                    {v.place.name}, {v.place.address}
                  </Text>
                </Column>
              </Row>
              <Button field="register" href={summitHref(brand, v.register)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
                Register for {v.name}
              </Button>
            </Column>
          </Section>
          {v.schedule.length ? (
            <Section field="schedule" style={{ padding: [0, token("spacing.xl"), token("spacing.xl")] }}>
              <Column style={{ gap: token("spacing.sm"), border: { top: { width: 1, style: "solid", color: token("colors.border") } }, padding: [token("spacing.lg"), 0, 0] }}>
                <Heading level={2}>The day</Heading>
                {v.schedule.map((moment, i) => (
                  <Row key={i} stackOnMobile={false} style={{ gap: token("spacing.md") }}>
                    <Column style={{ width: 96 }}>
                      <Text style={{ fontWeight: 700, color: token("colors.primary") }}>{moment.time}</Text>
                    </Column>
                    <Column>
                      <Text>{moment.title}</Text>
                    </Column>
                  </Row>
                ))}
              </Column>
            </Section>
          ) : null}
          <Section style={{ backgroundColor: token("colors.surface"), padding: [token("spacing.lg"), token("spacing.xl")] }}>
            <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              {brand.name}
              {brand.address ? ` · ${brand.address}` : ""} · <Link href={summitHref(brand, "/unsubscribe")}>Stop event invitations</Link>
            </Text>
          </Section>
        </Email>
      );
    },
  });
}
