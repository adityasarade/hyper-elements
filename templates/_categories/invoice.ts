import { prop } from "@hyper-elements/react";

export const invoice = {
  group: "Billing",
  label: "Invoice",
  roots: ["Email", "Document"],
  useWhen: "A bill the reader has to pay: what it's for, how much, and when it's due",
  avoidWhen: "A payment already made (use receipt), or an estimate before work starts (use quote)",
  required: {
    number: prop.text({ label: "Invoice number", required: true, maxLength: 20 }),
    issued: prop.date({ label: "Issued", required: true }),
    due: prop.date({ label: "Due", required: true }),
    customer: prop.object(
      {
        name: prop.text({ label: "Name", required: true, maxLength: 60 }),
        address: prop.list(prop.text({ label: "Address line", maxLength: 60 }), { label: "Address", required: true, min: 1, max: 4 }),
      },
      { label: "Billed to", required: true },
    ),
    lines: prop.list(
      prop.object(
        {
          description: prop.text({ label: "Description", required: true, maxLength: 80 }),
          quantity: prop.number({ label: "Quantity", required: true, min: 1, integer: true }),
          price: prop.number({ label: "Unit price", required: true, min: 0 }),
        },
        { label: "Line" },
      ),
      { label: "Lines", required: true, min: 1, max: 40 },
    ),
    currency: prop.choice(["USD", "EUR", "GBP"], { label: "Currency", default: "USD" }),
    pay: prop.link({ label: "Pay online link", required: true }),
  },
  example: {
    number: "INV-0417",
    issued: "2026-03-01",
    due: "2026-03-31",
    customer: { name: "Northwind Traders", address: ["48 Harbor Road", "Portland, OR 97209"] },
    lines: [
      { description: "Team plan, March", quantity: 12, price: 29 },
      { description: "Extra workspaces", quantity: 2, price: 15 },
    ],
    pay: "/billing/INV-0417",
  },
} as const;
