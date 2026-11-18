import { prop } from "@hyper-elements/react";

export const signInCode = {
  group: "Account",
  label: "Sign-in code",
  roots: ["Email"],
  useWhen: "A one-time code the reader types to sign in or to confirm an action",
  avoidWhen: "A link to click instead of a code (use magic-link), or resetting a password (use password-reset)",
  required: {
    code: prop.text({ label: "Code", required: true, pattern: "^[0-9A-Z]{3,6}(-[0-9A-Z]{3,6})?$" }),
    expires: prop.text({ label: "Expires in", required: true, maxLength: 40 }),
  },
  example: { code: "482-913", expires: "10 minutes" },
} as const;
