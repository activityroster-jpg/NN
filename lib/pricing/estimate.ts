// Weekly price estimates for the yacht models we offer. Pure: no DB, no I/O.
//
// A week's estimate is the admin's own price for that model, destination and
// week if there is one; otherwise:
//   model peak (gross list, 2023+ hull) × destination factor (by hull type)
//   × the destination's season ratio for that week (1.00 = peak week)
//   × (1 + markup), rounded to the nearest 50.
// Each destination has its own week-by-week season curve because operators'
// calendars differ by country (docs/research/charter-prices-2027.md):
// Greece steps coarsely and holds September high, Croatia steps almost
// weekly, Italy and Spain are steep with a mid-August top, Turkey peaks in
// September and October. Prices are EUR per week before early-booking
// discounts; bareboat models are the boat only, crewed models include the crew
// but not the APA.

export type Season = "closed" | "low" | "shoulder" | "peak";
export type Product = "bareboat" | "skippered" | "crewed";

export interface MarketModel {
  /** Most expensive week, gross published list, EUR. */
  peak: number;
  /** Cheapest Saturday week April–October in the research, for reference. */
  low?: number;
  product?: Product;
  confidence?: "Certain" | "Likely" | "Guessing";
  /** What the price is based on (a successor model, a single source, …). */
  basis?: string;
  /** Set when the research priced a current-production successor instead. */
  successor?: string;
}

export interface MarketDestination {
  catFactor: number;
  monoFactor: number;
  /**
   * Season curve as steps: [MM-DD, ratio] — from that date (by the Saturday a
   * week starts) the ratio applies until the next step; 0 means no charters.
   * Sorted by date; the first step should be 01-01.
   */
  curve: [string, number][];
  note?: string;
}

export interface MarketData {
  researchedAt: string;
  source?: string;
  models: Record<string, MarketModel>;
  destinations: Record<string, MarketDestination>;
}

export interface PricedModel {
  id: string;
  kind: "catamaran" | "monohull";
}

/** "<destinationId>|<weekStart>" → EUR. */
export type Overrides = Map<string, number>;
export const overrideKey = (destinationId: string, weekStart: string) => `${destinationId}|${weekStart}`;

const round50 = (n: number) => Math.round(n / 50) * 50;

/** The season ratio (share of the peak week) for a week starting on `weekStart`; 0 when closed. */
export function seasonRatio(market: MarketData, destinationId: string, weekStart: string): number {
  const d = market.destinations[destinationId];
  if (!d) return 0;
  const md = weekStart.slice(5, 10);
  let r = 0;
  for (const [from, ratio] of d.curve) {
    if (from <= md) r = ratio;
    else break;
  }
  return r;
}

/** A plain-language band for a ratio: peak from 0.95, shoulder from 0.65. */
export function seasonOf(market: MarketData, destinationId: string, weekStart: string): Season {
  const r = seasonRatio(market, destinationId, weekStart);
  return r <= 0 ? "closed" : r >= 0.95 ? "peak" : r >= 0.65 ? "shoulder" : "low";
}

/** Peak-week price in a destination with the markup, or null without data. */
export function peakPrice(market: MarketData, model: PricedModel, destinationId: string, markupPct: number): number | null {
  const m = market.models[model.id];
  const d = market.destinations[destinationId];
  if (!m || !d) return null;
  return m.peak * (model.kind === "catamaran" ? d.catFactor : d.monoFactor) * (1 + markupPct / 100);
}

/** The default (market + markup) for a week, or null out of season or without data. */
export function defaultWeekPrice(market: MarketData, model: PricedModel, destinationId: string, weekStart: string, markupPct: number): number | null {
  const r = seasonRatio(market, destinationId, weekStart);
  const peak = peakPrice(market, model, destinationId, markupPct);
  return r > 0 && peak != null ? round50(peak * r) : null;
}

/** Cheapest and dearest default week in a destination over a year (ignores the admin's own prices). */
export function defaultRange(market: MarketData, model: PricedModel, destinationId: string, markupPct: number): { low: number; peak: number } | null {
  const peak = peakPrice(market, model, destinationId, markupPct);
  const d = market.destinations[destinationId];
  if (peak == null || !d) return null;
  const open = d.curve.map(([, r]) => r).filter((r) => r > 0);
  if (!open.length) return null;
  return { low: round50(peak * Math.min(...open)), peak: round50(peak * Math.max(...open)) };
}

/** The estimate shown to customers: the admin's override, else the default. */
export function weekEstimate(
  market: MarketData,
  model: PricedModel,
  destinationId: string,
  weekStart: string,
  markupPct: number,
  overrides: Overrides | undefined,
): number | null {
  const o = overrides?.get(overrideKey(destinationId, weekStart));
  if (o != null) return o;
  return defaultWeekPrice(market, model, destinationId, weekStart, markupPct);
}

/** Saturdays from the first on or after `fromIso`, for `weeks` weeks. */
export function saturdays(fromIso: string, weeks: number): string[] {
  const d = new Date(`${fromIso}T00:00:00Z`);
  while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1);
  const out: string[] = [];
  for (let i = 0; i < weeks; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

export function isSaturday(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && new Date(`${iso}T00:00:00Z`).getUTCDay() === 6;
}

/** Lowest and highest estimate over the given weeks (in-season only), or null. */
export function estimateRange(
  market: MarketData,
  model: PricedModel,
  destinationIds: string[],
  weeks: string[],
  markupPct: number,
  overrides: Overrides | undefined,
): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const d of destinationIds) {
    for (const w of weeks) {
      const p = weekEstimate(market, model, d, w, markupPct, overrides);
      if (p == null) continue;
      if (p < min) min = p;
      if (p > max) max = p;
    }
  }
  return Number.isFinite(min) ? { min, max } : null;
}
