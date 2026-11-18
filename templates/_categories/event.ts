import { prop } from "@hyper-elements/react";

export const event = {
  group: "Events",
  label: "Event",
  roots: ["Email", "Page", "Canvas"],
  useWhen: "An event people can come to: what it is, when and where, and how to register",
  avoidWhen: "A ticket someone already has (use ticket), or one speaker's announcement (use speaker)",
  required: {
    name: prop.text({ label: "Event name", required: true, maxLength: 60 }),
    starts: prop.date({ label: "Date", required: true }),
    time: prop.text({ label: "Time", required: true, maxLength: 40 }),
    place: prop.object(
      {
        name: prop.text({ label: "Venue", required: true, maxLength: 60 }),
        address: prop.text({ label: "Address", required: true, maxLength: 100 }),
      },
      { label: "Where", required: true },
    ),
    register: prop.link({ label: "Registration link", required: true }),
  },
  example: {
    name: "Build Day",
    starts: "2026-05-14",
    time: "9:30 AM to 6:00 PM",
    place: { name: "The Foundry", address: "120 Mill Street, Pittsburgh" },
    register: "/events/build-day",
  },
} as const;
