import { Card, m, PageTitle, Table } from "@/components/admin/ui";
import { saveBusinessSettings } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { categoryWeekPrice } from "@/lib/domain/category-pricing";
import { CATEGORIES } from "@/lib/domain/categories";
import { saturdays } from "@/lib/domain/dates";
import { DESTINATIONS, destinationById } from "@/lib/domain/destinations";
import { getEnvAsync } from "@/lib/env";
import { todayIso } from "@/lib/request";
import { loadPricingContext, searchOffers } from "@/lib/services/charter";

export const metadata = { title: "Categories (Offering B)" };

export default async function Categories({ searchParams }: { searchParams: Promise<{ d?: string; from?: string }> }) {
  const sp = await searchParams;
  const dest = destinationById(sp.d ?? "") ?? DESTINATIONS[0]!;
  const env = await getEnvAsync();
  const db = await getDb();
  const ctx = await loadPricingContext(db);
  const ob = ctx.settings.offeringB;
  const policy = { marginPct: ob.marginPct, basisRank: ob.basisRank, minSupply: ob.minSupply, roundTo: 10, defaultCommissionPct: ctx.settings.defaultCommissionPct };
  const start = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : todayIso();
  const weeks = saturdays(start, 30).filter((w) => dest.seasonMonths.includes(Number(w.slice(5, 7)))).slice(0, 8);
  const results = await Promise.all(weeks.map(async (w) => ({ w, r: await searchOffers(env, db, ctx, dest.id, w) })));
  return (
    <div className="space-y-6">
      <PageTitle title="Categories (Offering B)" sub="Not on sale yet. This previews the price we could publish per category and week: priced off the Nth-cheapest available yacht's cost, plus your margin, only when enough yachts match." />
      <Card title="Engine settings">
        <form action={saveBusinessSettings} className="grid items-end gap-3 md:grid-cols-4">
          <input type="hidden" name="section" value="offeringB" />
          <label><span className="field-label">Target margin %</span><input name="marginPct" defaultValue={ob.marginPct} className="field" /></label>
          <label><span className="field-label">Price off Nth cheapest</span><input name="basisRank" defaultValue={ob.basisRank} className="field" /></label>
          <label><span className="field-label">Minimum matching yachts</span><input name="minSupply" defaultValue={ob.minSupply} className="field" /></label>
          <button className="btn-primary px-4 py-2 text-sm">Save</button>
        </form>
        <p className="mt-3 text-xs text-muted">Selling categories makes us the principal rather than agent: take legal advice (package travel and insolvency protection) before switching it on for customers.</p>
      </Card>
      <Card title={`Preview: ${dest.id}`} actions={
        <form className="flex gap-2">
          <select name="d" defaultValue={dest.id} className="field py-1.5">{DESTINATIONS.map((d) => <option key={d.id}>{d.id}</option>)}</select>
          <input type="date" name="from" defaultValue={start} className="field py-1.5" />
          <button className="btn-secondary px-3 py-1.5 text-sm">Show</button>
        </form>
      }>
        <Table head={["Week", ...CATEGORIES.map((c) => c.id)]} empty={weeks.length === 0}>
          {results.map(({ w, r }) => (
            <tr key={w}>
              <td className="whitespace-nowrap font-medium">{w}</td>
              {CATEGORIES.map((c) => {
                const cur = r.offers[0]?.currency ?? dest.currency;
                const p = categoryWeekPrice(r.offers, c.id, w, cur, policy);
                return <td key={c.id}>{p ? <><span className="font-semibold">{m(p.price, cur)}</span><div className="text-xs text-muted">{p.supply} yachts · cost {m(p.basisCost, cur)}</div></> : <span className="text-xs text-muted">too few</span>}</td>;
              })}
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
