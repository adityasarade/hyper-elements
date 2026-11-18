import { Button, Column, Divider, Heading, Text, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { magicLink } from "../../_categories/magic-link";
import { MinimalKicker, minimalEmail, minimalHref, minimalRules } from "../parts";

export default function minimalMagicLink(brand: Brand) {
  return template({
    id: "templates.MinimalMagicLinkEmail",
    version: "1.0.0",
    label: "Magic link",
    description: "A one-time link that signs the reader in, how long it works, and a note for when they didn't ask",
    guidance: "One button that signs in. Say how long it works.",
    root: "Email",
    fields: { ...magicLink.required },
    rules: minimalRules(brand),
    example: { ...magicLink.example },
    render(v) {
      return minimalEmail(brand, {
        title: `Sign in to ${brand.name}`,
        preview: `Your sign-in link works for ${v.expires}.`,
        children: (
          <Column style={{ gap: token("spacing.md"), alignItems: "center", textAlign: "center" }}>
            <MinimalKicker color="primary">Sign in</MinimalKicker>
            <Heading level={1}>Sign in to {brand.name}</Heading>
            <Text>Use this link on the device where you asked for it. No password needed.</Text>
            <Button field="link" href={minimalHref(brand, v.link)} style={{ borderRadius: token("radii.sm"), padding: [token("spacing.sm"), token("spacing.xl")] }}>
              Sign in to {brand.name}
            </Button>
            <Text field="expires" style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              It works once, for the next {v.expires}.
            </Text>
            <Divider />
            <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              Didn't ask to sign in? Someone may have typed your address by mistake. Nobody can get in without this link.
            </Text>
          </Column>
        ),
      });
    },
  });
}
