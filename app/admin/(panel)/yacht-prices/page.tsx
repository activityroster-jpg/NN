import Link from "next/link";
import { Card, m, PageTitle, Table } from "@/components/admin/ui";
import { saveYachtMarkup } from "@/lib/admin/yacht-price-actions";
import { getDb } from "@/lib/db";
import { yachtWeekPrice } from "@/lib/db/schema";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { FLEET_CLASSES, modelById } from "@/lib/fleet";
import { defaultRange, destName, getYachtPricing, MARKET } from "@/lib/pricing";
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
        sub="Weekly estimates shown on the website (per week, in euros; boat only unless marked crewed). Every week starts at the market price for that destination and week plus your markup; set any week&apos;s own price on the yacht&apos;s page."
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
            Applies to every week that has no price of its own; weeks you price yourself are never changed by it. Market prices are operators&apos; published 2027 lists (researched {MARKET.researchedAt}), which already include VAT and the agency&apos;s 15–20% commission: 0% shows the same list price as every other agency, before early-booking discounts of 10–20%.
          </p>
        </form>
      </Card>
      <Card title={`Defaults in ${destName(dest.id)}`}>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {DESTINATIONS.map((d) => (
            <Link key={d.id} href={`/admin/yacht-prices?d=${d.id}`} className={`chip ${d.id === dest.id ? "chip-on" : ""}`}>{destName(d.id)}</Link>
          ))}
        </div>
        <Table head={["Yacht", "Cheapest week", "Peak week", "Own prices", ""]}>
          {ids.map((id) => {
            const model = modelById(id);
            if (!model) return null;
            const n = count.get(id) ?? 0;
            const mk = MARKET.models[id];
            const range = defaultRange(MARKET, { id, kind: model.kind }, dest.id, markupPct);
            return (
              <tr key={id}>
                <td>
                  <span className="font-medium">{model.name}</span>
                  <span className="block text-xs text-muted">
                    {model.kind === "catamaran" ? "Catamaran" : "Monohull"}
                    {mk?.product === "crewed" ? " · crewed, APA extra" : mk?.product === "skippered" ? " · skippered" : ""}
                    {mk?.successor ? ` · priced as the ${mk.successor}` : ""}
                    {mk?.confidence === "Guessing" ? " · thin data, check" : ""}
                  </span>
                </td>
                <td className="tabular-nums">{range ? m(range.low, "EUR") : "–"}</td>
                <td className="tabular-nums">{range ? m(range.peak, "EUR") : "–"}</td>
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
