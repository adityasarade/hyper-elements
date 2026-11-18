import { Button, Column, Heading, Text, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { verifyEmail } from "../../_categories/verify-email";
import { MinimalKicker, minimalEmail, minimalHref, minimalRules } from "../parts";

export default function minimalVerifyEmail(brand: Brand) {
  return template({
    id: "templates.MinimalVerifyEmailEmail",
    version: "1.0.0",
    label: "Verify email",
    description: "One step before the account is ready: confirm the email address it was made with",
    guidance: "Say which address it is. One button.",
    root: "Email",
    fields: { ...verifyEmail.required },
    rules: minimalRules(brand),
    example: { ...verifyEmail.example },
    render(v) {
      return minimalEmail(brand, {
        title: `Confirm your email for ${brand.name}`,
        preview: `One step left: confirm ${v.email} is yours.`,
        band: (
          <>
            <MinimalKicker color="primaryForeground">One step left</MinimalKicker>
            <Heading level={1} style={{ color: token("colors.primaryForeground") }}>
              Confirm your email address
            </Heading>
          </>
        ),
        children: (
          <>
            <Text>Your {brand.name} account is almost ready. Confirm that this address is yours, and you're in.</Text>
            <Column style={{ backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.md")] }}>
              <Text field="email" style={{ fontWeight: 700 }}>{v.email}</Text>
            </Column>
            <Button field="link" href={minimalHref(brand, v.link)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
              Confirm my email address
            </Button>
            <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              Didn't sign up for {brand.name}? You can ignore this email, and no account will be made.
            </Text>
          </>
        ),
      });
    },
  });
}
