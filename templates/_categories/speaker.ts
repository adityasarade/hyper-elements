import { prop } from "@hyper-elements/react";

export const speaker = {
  group: "Events",
  label: "Speaker",
  roots: ["Canvas"],
  useWhen: "Announcing one speaker for an event: who they are, what they'll talk about, and when",
  avoidWhen: "The whole event (use event), or a quote from someone (use quote-card)",
  required: {
    name: prop.text({ label: "Name", required: true, maxLength: 40 }),
    role: prop.text({ label: "Role", required: true, maxLength: 60 }),
    talk: prop.text({ label: "Talk title", required: true, maxLength: 80 }),
    event: prop.text({ label: "Event", required: true, maxLength: 40 }),
    starts: prop.date({ label: "Date", required: true }),
  },
  example: {
    name: "Rosa Lindqvist",
    role: "Staff engineer, Northwind",
    talk: "Shipping weekly without breaking anything",
    event: "Build Day",
    starts: "2026-05-14",
  },
} as const;
