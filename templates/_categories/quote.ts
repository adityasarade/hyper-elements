import { prop } from "@hyper-elements/react";

export const quote = {
  group: "Billing",
  label: "Quote",
  roots: ["Email", "Document"],
  useWhen: "An estimate before work starts: what's included, what it costs, and how long the price holds",
  avoidWhen: "A bill to be paid (use invoice), or a full proposal with its approach and terms (use proposal)",
  required: {
    number: prop.text({ label: "Quote number", required: true, maxLength: 20 }),
    issued: prop.date({ label: "Issued", required: true }),
    validUntil: prop.date({ label: "Valid until", required: true }),
    customer: prop.object(
      {
        name: prop.text({ label: "Name", required: true, maxLength: 60 }),
        address: prop.list(prop.text({ label: "Address line", maxLength: 60 }), { label: "Address", required: true, min: 1, max: 4 }),
      },
      { label: "Prepared for", required: true },
    ),
    lines: prop.list(
      prop.object(
        {
          description: prop.text({ label: "Description", required: true, maxLength: 80 }),
          quantity: prop.number({ label: "Quantity", required: true, min: 1 }),
          price: prop.number({ label: "Unit price", required: true, min: 0 }),
        },
        { label: "Line" },
      ),
      { label: "Lines", required: true, min: 1, max: 40 },
    ),
    currency: prop.choice(["USD", "EUR", "GBP"], { label: "Currency", default: "USD" }),
  },
  example: {
    number: "Q-0213",
    issued: "2026-04-02",
    validUntil: "2026-05-02",
    customer: { name: "Northwind Traders", address: ["48 Harbor Road", "Portland, OR 97209"] },
    lines: [
      { description: "Design system audit", quantity: 1, price: 4800 },
      { description: "Workshop day, on site", quantity: 2, price: 1600 },
      { description: "Component library setup", quantity: 1, price: 6200 },
    ],
  },
} as const;
