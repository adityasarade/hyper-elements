import { prop } from "@hyper-elements/react";

export const announcement = {
  group: "Launches",
  label: "Announcement",
  roots: ["Email", "Page", "Canvas"],
  useWhen: "One launch or piece of news: a headline, a date, and what's new",
  avoidWhen: "Several pieces of news at once (use newsletter), or a link preview for an article (use og-card)",
  required: {
    headline: prop.text({ label: "Headline", required: true, maxLength: 90 }),
    date: prop.date({ label: "Date", required: true }),
  },
  example: { headline: "Release notes that write themselves", date: "2026-03-12" },
} as const;
