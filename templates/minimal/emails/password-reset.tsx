import { Button, Column, Divider, Heading, Text, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { passwordReset } from "../../_categories/password-reset";
import { MinimalKicker, minimalEmail, minimalHref, minimalRules } from "../parts";

export default function minimalPasswordReset(brand: Brand) {
  return template({
    id: "templates.MinimalPasswordResetEmail",
    version: "1.0.0",
    label: "Password reset",
    description: "A link to choose a new password, how long it works, and what to do if the reader didn't ask",
    guidance: "Plain and calm. One button, no other links in the message.",
    root: "Email",
    fields: { ...passwordReset.required },
    rules: minimalRules(brand),
    example: { ...passwordReset.example },
    render(v) {
      return minimalEmail(brand, {
        title: `Reset your ${brand.name} password`,
        preview: `Choose a new password. The link expires in ${v.expires}.`,
        children: (
          <Column style={{ gap: token("spacing.md"), alignItems: "center", textAlign: "center" }}>
            <MinimalKicker color="primary">Password reset</MinimalKicker>
            <Heading level={1}>Choose a new password</Heading>
            <Text>Someone asked to reset the password for your {brand.name} account. If it was you, choose a new one here.</Text>
            <Button field="link" href={minimalHref(brand, v.link)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.lg")] }}>
              Choose a new password
            </Button>
            <Text field="expires" style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              The link works once, and expires in {v.expires}.
            </Text>
            <Divider />
            <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              Didn't ask? Your password hasn't changed, and you can ignore this email.
            </Text>
          </Column>
        ),
      });
    },
  });
}
