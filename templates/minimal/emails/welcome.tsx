import { Button, Column, Heading, Row, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { welcome } from "../../_categories/welcome";
import { MinimalKicker, minimalEmail, minimalHref, minimalRules } from "../parts";

export default function minimalWelcome(brand: Brand) {
  return template({
    id: "templates.MinimalWelcomeEmail",
    version: "1.0.0",
    label: "Welcome",
    description: "A greeting on a band of the brand's color, three numbered next steps, and one button",
    guidance: "Warm and short. Each step's title starts with a verb; its line says why it's worth doing.",
    root: "Email",
    fields: {
      ...welcome.required,
      steps: prop.list(
        prop.object(
          {
            title: prop.text({ label: "Title", required: true, maxLength: 40 }),
            text: prop.text({ label: "Line", required: true, maxLength: 100 }),
          },
          { label: "Step" },
        ),
        { label: "Next steps", required: true, min: 1, max: 3 },
      ),
    },
    rules: minimalRules(brand),
    example: {
      ...welcome.example,
      steps: [
        { title: "Invite your team", text: "Everyone sees the same work, and nothing gets lost in email." },
        { title: "Connect your calendar", text: "Plan the week around the time you actually have." },
        { title: "Start your first project", text: "Pick a template, or begin with a blank page." },
      ],
    },
    render(v) {
      return minimalEmail(brand, {
        title: `Welcome to ${brand.name}`,
        preview: `Three ways to get started, ${v.name}`,
        band: (
          <>
            <MinimalKicker color="primaryForeground">Welcome to {brand.name}</MinimalKicker>
            <Heading field="name" level={1} style={{ color: token("colors.primaryForeground") }}>
              Glad you're here, {v.name}
            </Heading>
          </>
        ),
        children: (
          <>
            <Text>Here's how to get the most from your first week. It takes about ten minutes.</Text>
            <Column field="steps" style={{ gap: token("spacing.md"), padding: [token("spacing.sm"), 0] }}>
              {v.steps.map((step, i) => (
                <Row key={i} stackOnMobile={false} style={{ gap: token("spacing.md"), alignItems: "start" }}>
                  <Column style={{ width: 36 }}>
                    <Column style={{ backgroundColor: token("colors.surface"), borderRadius: 18, padding: [6, 0] }}>
                      <Text style={{ fontWeight: 700, textAlign: "center", lineHeight: 1.5 }}>{String(i + 1)}</Text>
                    </Column>
                  </Column>
                  <Column style={{ gap: 2 }}>
                    <Text style={{ fontWeight: 700 }}>{step.title}</Text>
                    <Text style={{ color: token("colors.muted") }}>{step.text}</Text>
                  </Column>
                </Row>
              ))}
            </Column>
            <Button field="action" href={minimalHref(brand, v.action)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
              Start your first week
            </Button>
            <Text style={{ color: token("colors.muted") }}>The {brand.name} team</Text>
          </>
        ),
      });
    },
  });
}
