import { prop } from "@hyper-elements/react";

export const magicLink = {
  group: "Account",
  label: "Magic link",
  roots: ["Email"],
  useWhen: "A one-time link that signs the reader in without a password",
  avoidWhen: "A code to type (use sign-in-code), or resetting a password (use password-reset)",
  required: {
    link: prop.link({ label: "Sign-in link", required: true }),
    expires: prop.text({ label: "Expires in", required: true, maxLength: 40 }),
  },
  example: { link: "/login/3be8f1", expires: "15 minutes" },
} as const;
