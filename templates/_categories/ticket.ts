import { prop } from "@hyper-elements/react";

export const ticket = {
  group: "Events",
  label: "Ticket",
  roots: ["Email", "Document"],
  useWhen: "A ticket someone holds for an event: who it's for, when and where, and the code to show at the door",
  avoidWhen: "Inviting people to an event (use event), or a receipt for the ticket's price (use receipt)",
  required: {
    event: prop.text({ label: "Event", required: true, maxLength: 60 }),
    starts: prop.date({ label: "Date", required: true }),
    time: prop.text({ label: "Doors open", required: true, maxLength: 40 }),
    place: prop.text({ label: "Venue and address", required: true, maxLength: 120 }),
    holder: prop.text({ label: "Ticket holder", required: true, maxLength: 60 }),
    code: prop.text({ label: "Ticket code", required: true, pattern: "^[A-Z0-9-]{4,20}$" }),
  },
  example: {
    event: "Build Day",
    starts: "2026-05-14",
    time: "9:00 AM",
    place: "The Foundry, 120 Mill Street, Pittsburgh",
    holder: "Ada Park",
    code: "BD-4821-K7",
  },
} as const;
