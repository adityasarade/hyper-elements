import { prop } from "@hyper-elements/react";

export const receipt = {
  group: "Billing",
  label: "Receipt",
  roots: ["Email", "Document"],
  useWhen: "Proof of a payment already made: what was bought, what it cost, and when it was paid",
  avoidWhen: "A bill still to be paid (use invoice), or an order that hasn't been charged yet (use order-confirmation)",
  required: {
    number: prop.text({ label: "Receipt number", required: true, maxLength: 20 }),
    paid: prop.date({ label: "Paid on", required: true }),
    items: prop.list(
      prop.object(
        {
          description: prop.text({ label: "Description", required: true, maxLength: 80 }),
          quantity: prop.number({ label: "Quantity", required: true, min: 1, integer: true }),
          price: prop.number({ label: "Unit price", required: true, min: 0 }),
        },
        { label: "Item" },
      ),
      { label: "Items", required: true, min: 1, max: 30 },
    ),
    currency: prop.choice(["USD", "EUR", "GBP"], { label: "Currency", default: "USD" }),
  },
  example: {
    number: "R-20418",
    paid: "2026-03-04",
    items: [
      { description: "Pro plan, monthly", quantity: 1, price: 24 },
      { description: "Extra seats", quantity: 3, price: 8 },
    ],
  },
} as const;
