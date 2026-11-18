import { prop } from "@hyper-elements/react";

export const passwordReset = {
  group: "Account",
  label: "Password reset",
  roots: ["Email"],
  useWhen: "A link to choose a new password, after someone asked to reset theirs",
  avoidWhen: "A code to type instead of a link (use sign-in-code), or telling someone their password was changed (use security-alert)",
  required: {
    link: prop.link({ label: "Reset link", required: true }),
    expires: prop.text({ label: "Expires in", required: true, maxLength: 40 }),
  },
  example: { link: "/reset/7d9f2c", expires: "1 hour" },
} as const;
