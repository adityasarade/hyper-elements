import { prop } from "@hyper-elements/react";

export const certificate = {
  group: "Records",
  label: "Certificate",
  roots: ["Document", "Canvas"],
  useWhen: "Recognizing someone for finishing or achieving something: who, what, when, and who signs it",
  avoidWhen: "A ticket or a pass (use ticket), or a letter with paragraphs of text (use letter)",
  required: {
    recipient: prop.text({ label: "Recipient", required: true, maxLength: 60 }),
    achievement: prop.text({ label: "Achievement", required: true, maxLength: 120 }),
    awarded: prop.date({ label: "Awarded on", required: true }),
    signer: prop.object(
      {
        name: prop.text({ label: "Name", required: true, maxLength: 60 }),
        role: prop.text({ label: "Role", required: true, maxLength: 60 }),
      },
      { label: "Signed by", required: true },
    ),
  },
  example: {
    recipient: "Ada Park",
    achievement: "Completed the Foundations of Accessible Design course, with distinction",
    awarded: "2026-06-20",
    signer: { name: "Morgan Ellis", role: "Head of learning" },
  },
} as const;
