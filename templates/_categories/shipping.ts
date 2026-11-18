import { prop } from "@hyper-elements/react";

export const shipping = {
  group: "Orders",
  label: "Shipping",
  roots: ["Email"],
  useWhen: "Telling someone their order is on its way: who's carrying it, when it should arrive, and how to track it",
  avoidWhen: "Confirming an order was placed (use order-confirmation), or one that has arrived (use delivered)",
  required: {
    number: prop.text({ label: "Order number", required: true, maxLength: 20 }),
    carrier: prop.text({ label: "Carrier", required: true, maxLength: 40 }),
    tracking: prop.link({ label: "Tracking link", required: true }),
    arrives: prop.date({ label: "Arrives by", required: true }),
    items: prop.list(
      prop.object(
        {
          description: prop.text({ label: "Description", required: true, maxLength: 80 }),
          quantity: prop.number({ label: "Quantity", required: true, min: 1, integer: true }),
        },
        { label: "Item" },
      ),
      { label: "Items", required: true, min: 1, max: 30 },
    ),
  },
  example: {
    number: "10482",
    carrier: "Parcel Post",
    tracking: "/orders/10482/track",
    arrives: "2026-03-13",
    items: [
      { description: "Field notebook, dot grid", quantity: 2 },
      { description: "Brass pen", quantity: 1 },
    ],
  },
} as const;
