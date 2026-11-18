import { Column, Heading, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import type { Brand } from "../../_brand";
import { signInCode } from "../../_categories/sign-in-code";
import { minimalEmail, minimalRules } from "../parts";

export default function minimalSignInCode(brand: Brand) {
  return template({
    id: "templates.MinimalSignInCodeEmail",
    version: "1.0.0",
    label: "Sign-in code",
    description: "A one-time code, large and easy to copy, with when it expires",
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
          <>
            <Heading level={1}>Your code to {v.purpose}</Heading>
            <Text>Enter this code in the window where you asked for it.</Text>
            <Column style={{ backgroundColor: token("colors.surface"), borderRadius: token("radii.sm"), padding: [token("spacing.md"), token("spacing.lg")] }}>
              <Text field="code" style={{ fontSize: 32, fontWeight: 700, letterSpacing: 4, textAlign: "center" }}>
                {v.code}
              </Text>
            </Column>
            <Text field="expires" style={{ color: token("colors.muted") }}>
              It expires in {v.expires}. If you didn't ask for it, you can ignore this email.
            </Text>
          </>
        ),
      });
    },
  });
}
