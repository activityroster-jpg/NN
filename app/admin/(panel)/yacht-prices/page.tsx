import Link from "next/link";
import { Card, m, PageTitle, Table } from "@/components/admin/ui";
import { saveYachtMarkup } from "@/lib/admin/yacht-price-actions";
import { getDb } from "@/lib/db";
import { yachtWeekPrice } from "@/lib/db/schema";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { FLEET_CLASSES, modelById } from "@/lib/fleet";
import { destName, getYachtPricing, MARKET, PRICED_SEASONS, seasonPrice } from "@/lib/pricing";
import { todayIso } from "@/lib/request";
import { and, eq, gte } from "drizzle-orm";

export const metadata = { title: "Yacht prices" };


export default async function YachtPrices({ searchParams }: { searchParams: Promise<{ d?: string; saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const dest = DESTINATIONS.find((d) => d.id === sp.d) ?? DESTINATIONS[0]!;
  const db = await getDb();
  const [{ markupPct }, overrides] = await Promise.all([
    getYachtPricing(db),
    db.select({ modelId: yachtWeekPrice.modelId }).from(yachtWeekPrice).where(and(eq(yachtWeekPrice.destinationId, dest.id), gte(yachtWeekPrice.weekStart, todayIso()))).all(),
  ]);
  const count = new Map<string, number>();
  for (const o of overrides) count.set(o.modelId, (count.get(o.modelId) ?? 0) + 1);
  const ids = FLEET_CLASSES.flatMap((c) => [...c.models, ...c.alternatives]);
  const back = `/admin/yacht-prices?d=${dest.id}`;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Yacht prices"
        sub="Weekly estimates shown on the website (boat only, per week, in euros). Every week starts at the market price plus your markup; set any week's own price on the yacht's page."
      />
      {sp.saved && <p className="rounded-lg bg-ok/10 p-3 text-sm text-ok">Saved.</p>}
      {sp.error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">That value was out of range. Nothing was saved.</p>}
      <Card title="Markup on market prices">
        <form action={saveYachtMarkup} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="back" value={back} />
          <label className="block">
            <span className="field-label">Markup %</span>
            <input name="markupPct" defaultValue={markupPct} inputMode="decimal" className="field w-28" />
          </label>
          <button className="btn-primary px-5 py-2 text-sm">Save markup</button>
          <p className="basis-full text-xs text-muted">
            Applies to every week that has no price of its own. Market prices researched {MARKET.researchedAt}; weeks you price yourself are never changed by the markup.
          </p>
        </form>
      </Card>
      <Card title={`Defaults in ${destName(dest.id)}`}>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {DESTINATIONS.map((d) => (
            <Link key={d.id} href={`/admin/yacht-prices?d=${d.id}`} className={`chip ${d.id === dest.id ? "chip-on" : ""}`}>{destName(d.id)}</Link>
          ))}
        </div>
        <Table head={["Yacht", "Low season", "Shoulder", "Peak", "Own prices", ""]}>
          {ids.map((id) => {
            const model = modelById(id);
            if (!model) return null;
            const n = count.get(id) ?? 0;
            return (
              <tr key={id}>
                <td>
                  <span className="font-medium">{model.name}</span>
                  <span className="block text-xs text-muted">{model.kind === "catamaran" ? "Catamaran" : "Monohull"}{MARKET.models[id]?.estimated ? " · market price estimated" : ""}</span>
                </td>
                {PRICED_SEASONS.map((s) => {
                  const p = seasonPrice(MARKET, { id, kind: model.kind }, dest.id, s, markupPct);
                  return <td key={s} className="tabular-nums">{p == null ? "–" : m(p, "EUR")}</td>;
                })}
                <td>{n ? `${n} week${n === 1 ? "" : "s"}` : <span className="text-muted">none</span>}</td>
                <td><Link href={`/admin/yacht-prices/${id}?d=${dest.id}`} className="text-sm font-medium text-brand underline">Set weekly prices</Link></td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
