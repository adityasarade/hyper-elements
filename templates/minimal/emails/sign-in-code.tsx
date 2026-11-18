import { Column, Divider, Heading, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { signInCode } from "../../_categories/sign-in-code";
import { MinimalKicker, minimalEmail, minimalRules } from "../parts";

export default function minimalSignInCode(brand: Brand) {
  return template({
    id: "templates.MinimalSignInCodeEmail",
    version: "1.0.0",
    label: "Sign-in code",
    description: "A one-time code, large and centered in a box of its own, with when it expires and what to do if it wasn't you",
    guidance: "Say what the code is for in the purpose field. The code is the only thing to act on: add no button.",
    root: "Email",
    fields: {
      ...signInCode.required,
      purpose: prop.choice(["sign in", "confirm a change"], { label: "What it's for", default: "sign in" }),
    },
    rules: minimalRules(brand),
    example: { ...signInCode.example },
    render(v) {
      return minimalEmail(brand, {
        title: `Your ${brand.name} code`,
        preview: `Your code is ${v.code}. It expires in ${v.expires}.`,
        children: (
          <Column style={{ gap: token("spacing.md"), alignItems: "center", textAlign: "center" }}>
            <MinimalKicker color="primary">Your {brand.name} code</MinimalKicker>
            <Heading level={1}>Here's your code to {v.purpose}</Heading>
            <Text>Enter it in the window where you asked for it.</Text>
            <Column
              style={{
                width: "100%",
                backgroundColor: token("colors.surface"),
                border: { width: 2, style: "dashed", color: token("colors.border") },
                borderRadius: token("radii.md"),
                padding: [token("spacing.lg"), token("spacing.md")],
                gap: token("spacing.xs"),
              }}
            >
              <Text field="code" style={{ fontSize: 36, fontWeight: 700, letterSpacing: 6, lineHeight: 1.2, textAlign: "center" }}>
                {v.code}
              </Text>
              <Text field="expires" style={{ fontSize: token("fontSizes.small"), color: token("colors.muted"), textAlign: "center" }}>
                Expires in {v.expires}
              </Text>
            </Column>
            <Divider />
            <Text style={{ fontSize: token("fontSizes.small"), color: token("colors.muted") }}>
              Didn't ask for a code? Someone may have typed your email address by mistake. You can ignore this email: nobody can {v.purpose} without the code.
            </Text>
          </Column>
        ),
      });
    },
  });
}
