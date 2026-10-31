import { and, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/lib/db";
import { setting, yachtWeekPrice } from "@/lib/db/schema";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { MODELS, modelById } from "@/lib/fleet";
import { getDictionary } from "@/lib/i18n";
import { convert, type FxRates } from "@/lib/domain/money";
import type { Currency } from "@/lib/domain/types";
import marketFile from "./market.json";
import { estimateRange, overrideKey, saturdays, seasonOf, weekEstimate, type MarketData, type Overrides, type Season } from "./estimate";

export const MARKET = marketFile as MarketData;

/** Weeks the site looks ahead when it shows "from" prices. */
export const HORIZON_WEEKS = 60;

// Settings for estimates live in one setting row, validated on read.
const PRICING_KEY = "yacht_pricing";
export const YachtPricingSchema = z.object({
  /** Added on top of the market price for every default week. */
  markupPct: z.number().min(-50).max(200).default(10),
});
export type YachtPricing = z.infer<typeof YachtPricingSchema>;

export async function getYachtPricing(db: Db): Promise<YachtPricing> {
  const row = await db.select().from(setting).where(eq(setting.key, PRICING_KEY)).get().catch(() => undefined);
  const parsed = YachtPricingSchema.safeParse(row?.value ?? {});
  return parsed.success ? parsed.data : YachtPricingSchema.parse({});
}

export async function saveYachtPricing(db: Db, v: YachtPricing): Promise<void> {
  const at = new Date().toISOString();
  await db.insert(setting).values({ key: PRICING_KEY, value: v, updatedAt: at }).onConflictDoUpdate({ target: setting.key, set: { value: v, updatedAt: at } });
}

/** Overrides for the given models from `fromIso` on, per model. */
export async function loadOverrides(db: Db, modelIds: string[], fromIso: string): Promise<Map<string, Overrides>> {
  const out = new Map<string, Overrides>();
  if (!modelIds.length) return out;
  const rows = await db
    .select()
    .from(yachtWeekPrice)
    .where(and(inArray(yachtWeekPrice.modelId, modelIds), gte(yachtWeekPrice.weekStart, fromIso)))
    .all()
    .catch(() => []);
  for (const r of rows) {
    const m = out.get(r.modelId) ?? new Map<string, number>();
    m.set(overrideKey(r.destinationId, r.weekStart), r.priceEur);
    out.set(r.modelId, m);
  }
  return out;
}

const priced = (id: string) => {
  const m = modelById(id);
  return m ? { id: m.id, kind: m.kind } : undefined;
};

/** Estimates (EUR) for every model for one destination and week; null where we have none. */
export async function estimatesForWeek(db: Db, destinationId: string, weekStart: string): Promise<Record<string, number | null>> {
  const [{ markupPct }, overrides] = await Promise.all([getYachtPricing(db), loadOverrides(db, MODELS.map((m) => m.id), weekStart)]);
  return Object.fromEntries(MODELS.map((m) => [m.id, weekEstimate(MARKET, { id: m.id, kind: m.kind }, destinationId, weekStart, markupPct, overrides.get(m.id))]));
}

/** Lowest and highest estimate per model over the coming weeks, in all (or the given) destinations. */
export async function estimateRanges(
  db: Db,
  todayIso: string,
  destinationIds: string[] = DESTINATIONS.map((d) => d.id),
  modelIds: string[] = MODELS.map((m) => m.id),
): Promise<Record<string, { min: number; max: number } | null>> {
  const weeks = saturdays(todayIso, HORIZON_WEEKS);
  const [{ markupPct }, overrides] = await Promise.all([getYachtPricing(db), loadOverrides(db, modelIds, todayIso)]);
  return Object.fromEntries(
    modelIds.map((id) => {
      const p = priced(id);
      return [id, p ? estimateRange(MARKET, p, destinationIds, weeks, markupPct, overrides.get(id)) : null];
    }),
  );
}

/** Per destination: the lowest and highest estimate for one model over the coming weeks. */
export async function modelRangesByDestination(db: Db, modelId: string, todayIso: string): Promise<{ destinationId: string; range: { min: number; max: number } }[]> {
  const p = priced(modelId);
  if (!p) return [];
  const weeks = saturdays(todayIso, HORIZON_WEEKS);
  const [{ markupPct }, overrides] = await Promise.all([getYachtPricing(db), loadOverrides(db, [modelId], todayIso)]);
  return DESTINATIONS.flatMap((d) => {
    const range = estimateRange(MARKET, p, [d.id], weeks, markupPct, overrides.get(modelId));
    return range ? [{ destinationId: d.id, range }] : [];
  });
}

export { seasonOf, defaultWeekPrice, seasonPrice, weekEstimate, saturdays, isSaturday, PRICED_SEASONS, overrideKey } from "./estimate";
export type { Season, PricedSeason } from "./estimate";

/** Wording that goes with every estimate. */
export const ESTIMATE_NOTE =
  "Estimates are for the boat only, per week, based on typical prices for this model. Skipper, extras, security deposit and local taxes are not included. Your official quote confirms the price for a specific yacht.";

const EN = getDictionary("en");
/** English destination name, for admin screens and the office email. */
export const destName = (id: string) => EN.destinations[id as keyof typeof EN.destinations]?.name ?? id;

/** An EUR estimate in the visitor's currency: euros as set, others rounded to the nearest 10. */
export function estimateIn(eur: number, currency: Currency, rates: FxRates): number {
  if (currency === "EUR") return eur;
  return Math.round(convert(eur, "EUR", currency, rates) / 10) * 10;
}

/** Every coming week's estimate (EUR) for one model, per destination; weeks without a price left out. */
export async function modelWeekGrid(
  db: Db,
  modelId: string,
  todayIso: string,
  destinationIds: string[],
): Promise<{ destinationId: string; weeks: { w: string; season: Season; eur: number }[] }[]> {
  const p = priced(modelId);
  if (!p) return [];
  const weeks = saturdays(todayIso, HORIZON_WEEKS);
  const [{ markupPct }, overrides] = await Promise.all([getYachtPricing(db), loadOverrides(db, [modelId], todayIso)]);
  const o = overrides.get(modelId);
  return destinationIds.map((d) => ({
    destinationId: d,
    weeks: weeks.flatMap((w) => {
      const eur = weekEstimate(MARKET, p, d, w, markupPct, o);
      return eur == null ? [] : [{ w, season: seasonOf(MARKET, d, w), eur }];
    }),
  }));
}
