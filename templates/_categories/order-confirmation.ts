import { prop } from "@hyper-elements/react";

export const orderConfirmation = {
  group: "Orders",
  label: "Order confirmation",
  roots: ["Email"],
  useWhen: "Confirming an order was placed: what's in it, what it costs, and where it's going",
  avoidWhen: "Proof of a payment for a subscription (use receipt), or an order on its way (use shipping)",
  required: {
    number: prop.text({ label: "Order number", required: true, maxLength: 20 }),
    placed: prop.date({ label: "Placed on", required: true }),
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
    shipTo: prop.object(
      {
        name: prop.text({ label: "Name", required: true, maxLength: 60 }),
        address: prop.list(prop.text({ label: "Address line", maxLength: 60 }), { label: "Address", required: true, min: 1, max: 4 }),
      },
      { label: "Shipping to", required: true },
    ),
  },
  example: {
    number: "10482",
    placed: "2026-03-09",
    items: [
      { description: "Field notebook, dot grid", quantity: 2, price: 14 },
      { description: "Brass pen", quantity: 1, price: 38 },
    ],
    shipTo: { name: "Ada Park", address: ["48 Harbor Road", "Portland, OR 97209"] },
  },
} as const;
