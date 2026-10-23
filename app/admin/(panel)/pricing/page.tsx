import { desc } from "drizzle-orm";
import { Card, PageTitle, Status, Table } from "@/components/admin/ui";
import { addPricingRule, saveBusinessSettings, togglePricingRule } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { operator, pricingRule } from "@/lib/db/schema";
import { CATEGORY_IDS } from "@/lib/domain/categories";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Pricing" };

export default async function Pricing({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const db = await getDb();
  const [s, rules, ops] = await Promise.all([getSettings(db), db.select().from(pricingRule).orderBy(desc(pricingRule.createdAt)).all(), db.select().from(operator).all()]);
  const num = (name: string, label: string, value: number, help?: string) => (
    <label className="block"><span className="field-label">{label}</span><input name={name} defaultValue={value} inputMode="decimal" className="field" />{help && <span className="mt-1 block text-xs text-muted">{help}</span>}</label>
  );
  return (
    <div className="space-y-6">
      <PageTitle title="Pricing and payment terms" sub="Changes apply to new searches and bookings. Existing bookings keep the price they were sold at." />
      {error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">Some values were out of range. Nothing was saved.</p>}
      <Card title="Defaults">
        <form action={saveBusinessSettings} className="grid gap-4 md:grid-cols-3">
          <input type="hidden" name="section" value="pricing" />
          {num("markupPct", "Markup on operator price %", s.markupPct, "Added on top unless the operator enforces price parity.")}
          {num("defaultCommissionPct", "Assumed commission % (if feed is silent)", s.defaultCommissionPct)}
          {num("bankDiscountPct", "Bank transfer discount %", s.bankDiscountPct, "Card prices carry your card costs; bank payers get this discount. Never a card surcharge.")}
          {num("depositPct", "Our minimum deposit %", s.depositPct, "The operator's deposit wins if higher.")}
          {num("balanceDaysBefore", "Balance due (days before departure)", s.balanceDaysBefore)}
          {num("bufferDays", "Buffer before operator deadline (days)", s.bufferDays)}
          {num("holdHours", "Hold length (hours)", s.holdHours)}
          <label className="block"><span className="field-label">Crew source when both exist</span>
            <select name="crewPreference" defaultValue={s.crewPreference} className="field"><option value="operator">Operator&apos;s crew</option><option value="pool">Our crew pool</option></select>
          </label>
          <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" name="cardPaymentsEnabled" defaultChecked={s.cardPaymentsEnabled} />Accept card payments (needs Stripe keys)</label>
          <div className="md:col-span-3"><button className="btn-primary px-5 py-2 text-sm">Save defaults</button></div>
        </form>
      </Card>
      <Card title="Markup rules">
        <p className="mb-3 text-sm text-muted">The most specific active rule wins: operator, then destination + category, then category, then destination, then the default above.</p>
        <form action={addPricingRule} className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_1fr_120px_auto]">
          <select name="destinationId" className="field py-1.5"><option value="">Any destination</option>{DESTINATION_IDS.map((d) => <option key={d}>{d}</option>)}</select>
          <select name="categoryId" className="field py-1.5"><option value="">Any category</option>{CATEGORY_IDS.map((c) => <option key={c}>{c}</option>)}</select>
          <select name="operatorId" className="field py-1.5"><option value="">Any operator</option>{ops.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
          <input name="markupPct" placeholder="Markup %" inputMode="decimal" required className="field py-1.5" />
          <button className="btn-secondary px-3 py-1.5 text-sm">Add rule</button>
        </form>
        <Table head={["Destination", "Category", "Operator", "Markup", "Status", ""]} empty={rules.length === 0}>
          {rules.map((r) => (
            <tr key={r.id}>
              <td>{r.destinationId ?? "any"}</td><td>{r.categoryId ?? "any"}</td><td>{ops.find((o) => o.id === r.operatorId)?.name ?? r.operatorId ?? "any"}</td><td>{r.markupPct}%</td>
              <td><Status value={r.active ? "confirmed" : "void"} /></td>
              <td><form action={togglePricingRule}><input type="hidden" name="id" value={r.id} /><button className="text-sm text-brand underline">{r.active ? "Deactivate" : "Activate"}</button></form></td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
