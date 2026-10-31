import { and, eq, gte } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageTitle, when } from "@/components/admin/ui";
import { saveYachtWeeks } from "@/lib/admin/yacht-price-actions";
import { getDb } from "@/lib/db";
import { yachtWeekPrice } from "@/lib/db/schema";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { modelById, modelPath } from "@/lib/fleet";
import { defaultWeekPrice, destName, getYachtPricing, HORIZON_WEEKS, MARKET, saturdays, seasonOf } from "@/lib/pricing";
import { todayIso } from "@/lib/request";

export const metadata = { title: "Weekly prices" };

const SEASON_TONE = { low: "bg-sea/10 text-sea", shoulder: "bg-warn/10 text-warn", peak: "bg-brand-soft text-brand", closed: "bg-ink/5 text-muted" } as const;

export default async function YachtWeeks({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ d?: string; saved?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const model = modelById(id);
  if (!model) notFound();
  const dest = DESTINATIONS.find((d) => d.id === sp.d) ?? DESTINATIONS[0]!;
  const today = todayIso();
  const db = await getDb();
  const [{ markupPct }, rows] = await Promise.all([
    getYachtPricing(db),
    db.select().from(yachtWeekPrice).where(and(eq(yachtWeekPrice.modelId, id), eq(yachtWeekPrice.destinationId, dest.id), gte(yachtWeekPrice.weekStart, today))).all(),
  ]);
  const own = new Map(rows.map((r) => [r.weekStart, r.priceEur]));
  const weeks = saturdays(today, HORIZON_WEEKS).filter((w) => seasonOf(MARKET, dest.id, w) !== "closed" || own.has(w));
  const p = { id, kind: model.kind };

  return (
    <div className="space-y-6">
      <PageTitle
        title={`${model.name}: weekly prices`}
        sub="Leave a week empty to use the market price plus markup (shown in grey). Type a price to fix that week. Euros, boat only, per week."
        actions={<Link href={`/admin/yacht-prices?d=${dest.id}`} className="btn-ghost text-sm">← All yachts</Link>}
      />
      {sp.saved && <p className="rounded-lg bg-ok/10 p-3 text-sm text-ok">{sp.saved === "0" ? "Nothing changed." : `Saved ${sp.saved} week${sp.saved === "1" ? "" : "s"}.`}</p>}
      {sp.error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">A price was out of range (100 to 500,000). Nothing was saved.</p>}
      <div className="flex flex-wrap gap-1.5">
        {DESTINATIONS.map((d) => (
          <Link key={d.id} href={`/admin/yacht-prices/${id}?d=${d.id}`} className={`chip ${d.id === dest.id ? "chip-on" : ""}`}>{destName(d.id)}</Link>
        ))}
      </div>
      <Card title={`${destName(dest.id)} · next ${HORIZON_WEEKS} weeks`} actions={<a href={modelPath(id)} target="_blank" rel="noreferrer" className="text-sm text-brand underline">View page ↗</a>}>
        {weeks.length === 0 ? (
          <p className="text-sm text-muted">No charter weeks in {destName(dest.id)} in this period.</p>
        ) : (
          <form action={saveYachtWeeks}>
            <input type="hidden" name="modelId" value={id} />
            <input type="hidden" name="destinationId" value={dest.id} />
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
              {weeks.map((w) => {
                const season = seasonOf(MARKET, dest.id, w);
                const def = defaultWeekPrice(MARKET, p, dest.id, w, markupPct);
                return (
                  <label key={w} className="flex items-center gap-2 text-sm">
                    <span className="w-28 shrink-0 tabular-nums">{when(w)}</span>
                    <span className={`badge w-20 shrink-0 justify-center ${SEASON_TONE[season]}`}>{season}</span>
                    <input
                      name={`w_${w}`}
                      defaultValue={own.get(w) ?? ""}
                      placeholder={def == null ? "–" : String(def)}
                      inputMode="numeric"
                      aria-label={`Price for the week of ${w}`}
                      className={`field min-w-0 flex-1 py-1.5 tabular-nums ${own.has(w) ? "font-semibold" : ""}`}
                    />
                  </label>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="btn-primary px-5 py-2 text-sm">Save prices</button>
              <span className="text-xs text-muted">
                Grey figures: market price ({MARKET.researchedAt}) plus {markupPct}% markup.
              </span>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
