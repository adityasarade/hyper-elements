import { Button, Column, Grid, Heading, Image, Link, Page, Row, Section, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { event } from "../../_categories/event";
import { SummitDateBadge, summitDate, summitHref, summitScreenRules } from "../parts";

/** The two letters a speaker's initials take. */
const summitInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

export default function summitEventPage(brand: Brand) {
  return template({
    id: "templates.SummitEventPage",
    version: "1.0.0",
    label: "Event page",
    description: "An event's web page: its name and tagline on a band of the brand's color, when and where, the schedule, and the speakers",
    guidance: "Lead with what the day is for. Each speaker is a name, a role, and their talk's title.",
    root: "Page",
    fields: {
      ...event.required,
      tagline: prop.text({ label: "Tagline", required: true, maxLength: 120 }),
      price: prop.text({ label: "Price", required: true, maxLength: 40 }),
      schedule: prop.list(
        prop.object({ time: prop.text({ label: "Time", required: true, maxLength: 12 }), title: prop.text({ label: "What", required: true, maxLength: 70 }) }, { label: "Moment" }),
        { label: "Schedule", min: 1, max: 10 },
      ),
      speakers: prop.list(
        prop.object(
          {
            name: prop.text({ label: "Name", required: true, maxLength: 40 }),
            role: prop.text({ label: "Role", required: true, maxLength: 60 }),
            talk: prop.text({ label: "Talk", required: true, maxLength: 80 }),
          },
          { label: "Speaker" },
        ),
        { label: "Speakers", min: 0, max: 9 },
      ),
    },
    rules: summitScreenRules(brand),
    example: {
      ...event.example,
      tagline: "A day of talks and workshops for the people who build and ship software.",
      price: "Free, with lunch",
      schedule: [
        { time: "9:30 AM", title: "Doors open, coffee and breakfast" },
        { time: "10:00 AM", title: "Opening talk: shipping weekly without breaking anything" },
        { time: "11:30 AM", title: "Lightning talks" },
        { time: "1:00 PM", title: "Workshops, in four rooms" },
        { time: "5:00 PM", title: "Closing panel, then drinks on the roof" },
      ],
      speakers: [
        { name: "Rosa Lindqvist", role: "Staff engineer, Northwind", talk: "Shipping weekly without breaking anything" },
        { name: "Dev Okafor", role: "Design lead, Fieldnote", talk: "Design systems people actually use" },
        { name: "Mei Tanaka", role: "Founder, Lattice", talk: "What we learned from a year of open source" },
      ],
    },
    render(v) {
      const day = summitDate(brand, v.starts, { weekday: "long", month: "long", day: "numeric" });
      const label = { fontSize: token("fontSizes.small"), fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: token("colors.muted") } as const;
      return (
        <Page
          width={1040}
          title={`${v.name} · ${brand.name}`}
          description={`${v.tagline} ${day}, ${v.place.name}.`}
          lang={brand.lang ?? "en"}
          {...(brand.dir ? { dir: brand.dir } : {})}
          theme={brand.theme}
          fonts={brand.fonts}
          style={{ fontSize: token("fontSizes.body"), lineHeight: token("lineHeights.body") }}
        >
          <Section style={{ padding: [token("spacing.lg"), token("spacing.xl")] }}>
            <Row stackOnMobile={false} style={{ alignItems: "center", gap: token("spacing.md") }}>
              <Column>
                <Image src={{ src: brand.logo.src, width: brand.logo.width, height: brand.logo.height }} alt={brand.logo.alt} style={{ width: 150 }} />
              </Column>
              <Column style={{ alignItems: "end" }}>
                <Link href={summitHref(brand, v.register)}>Register for {v.name}</Link>
              </Column>
            </Row>
          </Section>
          <Section style={{ backgroundColor: token("colors.primary"), color: token("colors.primaryForeground"), padding: [56, token("spacing.xl"), 64] }}>
            <Column style={{ gap: token("spacing.md"), maxWidth: 720 }}>
              <Text style={{ fontSize: token("fontSizes.small"), fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {day} · {v.place.name}
              </Text>
              <Heading field="name" level={1} style={{ color: token("colors.primaryForeground") }}>{v.name}</Heading>
              <Text field="tagline" style={{ fontSize: 20 }}>{v.tagline}</Text>
              <Button field="register" href={summitHref(brand, v.register)} style={{ backgroundColor: token("colors.background"), color: token("colors.foreground"), borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
                Register for {v.name}
              </Button>
            </Column>
          </Section>
          <Section style={{ padding: [token("spacing.xl"), token("spacing.xl")] }}>
            <Grid columns={3} style={{ gap: token("spacing.md") }}>
              <Row stackOnMobile={false} style={{ gap: token("spacing.md"), alignItems: "center" }}>
                <Column style={{ width: 76 }}>
                  <SummitDateBadge brand={brand} date={v.starts} />
                </Column>
                <Column style={{ gap: 2 }}>
                  <Text style={label}>When</Text>
                  <Text field="time">{v.time}</Text>
                </Column>
              </Row>
              <Column field="place" style={{ gap: 2 }}>
                <Text style={label}>Where</Text>
                <Text style={{ fontWeight: 700 }}>{v.place.name}</Text>
                <Text style={{ color: token("colors.muted") }}>{v.place.address}</Text>
              </Column>
              <Column field="price" style={{ gap: 2 }}>
                <Text style={label}>Tickets</Text>
                <Text style={{ fontWeight: 700 }}>{v.price}</Text>
                <Link href={summitHref(brand, v.register)}>Save your seat</Link>
              </Column>
            </Grid>
          </Section>
          <Section style={{ padding: [token("spacing.lg"), token("spacing.xl"), token("spacing.xl")] }}>
            <Row style={{ gap: token("spacing.xl"), alignItems: "start" }}>
              <Column field="schedule" style={{ gap: token("spacing.md") }}>
                <Heading level={2}>Schedule</Heading>
                {v.schedule.map((moment, i) => (
                  <Row key={i} stackOnMobile={false} style={{ gap: token("spacing.md"), padding: [token("spacing.sm"), 0], border: { bottom: { width: 1, style: "solid", color: token("colors.border") } } }}>
                    <Column style={{ width: 96 }}>
                      <Text style={{ fontWeight: 700, color: token("colors.primary") }}>{moment.time}</Text>
                    </Column>
                    <Column>
                      <Text>{moment.title}</Text>
                    </Column>
                  </Row>
                ))}
              </Column>
              {v.speakers.length ? (
                <Column field="speakers" style={{ gap: token("spacing.md") }}>
                  <Heading level={2}>Speakers</Heading>
                  {v.speakers.map((speaker, i) => (
                    <Row key={i} stackOnMobile={false} style={{ gap: token("spacing.md"), alignItems: "center", backgroundColor: token("colors.surface"), borderRadius: token("radii.md"), padding: token("spacing.md") }}>
                      <Column style={{ width: 56 }}>
                        <Column style={{ backgroundColor: token("colors.primary"), borderRadius: 28, padding: [14, 0] }}>
                          <Text style={{ color: token("colors.primaryForeground"), fontWeight: 700, textAlign: "center", lineHeight: 1.75 }}>{summitInitials(speaker.name)}</Text>
                        </Column>
                      </Column>
                      <Column style={{ gap: 2 }}>
                        <Text style={{ fontWeight: 700 }}>{speaker.name}</Text>
                        <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>{speaker.role}</Text>
                        <Text>{speaker.talk}</Text>
                      </Column>
                    </Row>
                  ))}
                </Column>
              ) : null}
            </Row>
          </Section>
          <Section style={{ backgroundColor: token("colors.surface"), padding: [token("spacing.lg"), token("spacing.xl")] }}>
            <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              {v.name} is run by {brand.name}
              {brand.address ? `, ${brand.address}` : ""}. <Link href={summitHref(brand, "/contact")}>Ask {brand.name} about the event</Link>
            </Text>
          </Section>
        </Page>
      );
    },
  });
}
