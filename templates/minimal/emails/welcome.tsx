import { Button, Column, Heading, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { welcome } from "../../_categories/welcome";
import { minimalEmail, minimalHref, minimalRules } from "../parts";

export default function minimalWelcome(brand: Brand) {
  return template({
    id: "templates.MinimalWelcomeEmail",
    version: "1.0.0",
    label: "Welcome",
    description: "A greeting, three next steps and one button, in a single card",
    guidance: "Warm and short. Each step is one sentence that starts with a verb.",
    root: "Email",
    fields: {
      ...welcome.required,
      steps: prop.list(prop.text({ label: "Step", maxLength: 90 }), { label: "Next steps", required: true, min: 1, max: 3 }),
    },
    rules: minimalRules(brand),
    example: {
      ...welcome.example,
      steps: ["Invite your team so everyone sees the same work.", "Connect your calendar to plan the week.", "Pick a template for your first project."],
    },
    render(v) {
      return minimalEmail(brand, {
        title: `Welcome to ${brand.name}`,
        preview: `Three ways to get started, ${v.name}`,
        children: (
          <>
            <Heading field="name" level={1}>Welcome, {v.name}</Heading>
            <Text>Thanks for joining {brand.name}. Here's how to get the most from your first week.</Text>
            <Column field="steps" style={{ gap: token("spacing.sm"), padding: [token("spacing.sm"), 0] }}>
              {v.steps.map((step, i) => (
                <Text key={i}>
                  {i + 1}. {step}
                </Text>
              ))}
            </Column>
            <Button field="action" href={minimalHref(brand, v.action)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
              Get started
            </Button>
          </>
        ),
      });
    },
  });
}
