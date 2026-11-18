import { prop } from "@hyper-elements/react";

export const newsletter = {
  group: "Content",
  label: "Newsletter",
  roots: ["Email", "Page"],
  useWhen: "A regular issue of written news: a subject, a lead, and sections the writer fills in",
  avoidWhen: "One announcement (use announcement), or a summary built from data (use digest)",
  required: {
    subject: prop.text({ label: "Subject", required: true, maxLength: 70 }),
    preview: prop.text({ label: "Preview text", required: true, maxLength: 120 }),
  },
  example: {
    subject: "What's new this month",
    preview: "Faster exports, notes in your own voice, and a date for the open house",
  },
} as const;
