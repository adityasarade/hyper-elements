import { prop } from "@hyper-elements/react";

export const verifyEmail = {
  group: "Account",
  label: "Verify email",
  roots: ["Email"],
  useWhen: "A link that confirms an email address belongs to the person who signed up with it",
  avoidWhen: "A code to type (use sign-in-code), or a first hello with next steps (use welcome)",
  required: {
    link: prop.link({ label: "Verify link", required: true }),
    email: prop.text({ label: "Email address", required: true, maxLength: 120 }),
  },
  example: { link: "/verify/a41c9e", email: "ada@example.com" },
} as const;
