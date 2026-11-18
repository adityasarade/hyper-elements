/** What carries across a category: its required fields' values, not a values file. */
import { invoice } from "../_categories/invoice";
import { brand as orbit } from "../_brands/orbit";
import { templates } from "./discover";

it("gives both Ledger invoices from one object of the invoice's fields", async () => {
  const all = await templates();
  const ledger = all.filter((t) => t.kit === "ledger" && t.category === "invoice");
  expect(ledger.map((t) => t.root).sort()).toEqual(["Document", "Email"]);
  for (const t of ledger) {
    const tpl = t.make(orbit);
    const format = tpl.formats ? Object.keys(tpl.formats)[0] : undefined;
    expect(tpl.check(invoice.example, format ? { format } : {}).valid, t.id).toBe(true);
  }
});

it("refuses a field the template doesn't have", async () => {
  const welcome = (await templates()).find((t) => t.id === "templates.MinimalWelcomeEmail")!.make(orbit);
  const checked = welcome.check({ ...welcome.example, headlineFont: "Comic Sans" });
  expect(checked.diagnostics.map((d) => d.code)).toContain("template/unknown-field");
});
