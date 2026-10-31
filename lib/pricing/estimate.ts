// Weekly price estimates for the yacht models we offer. Pure: no DB, no I/O.
//
// A week's estimate is the admin's override for that model, destination and
// week if there is one; otherwise the market price for the model in the
// destination's season for that week, times the destination's multiplier,
// plus our markup, rounded to the nearest 50. Prices are EUR, boat only, per
// week: skipper, extras, deposit and local taxes are not included.

export type Season = "closed" | "low" | "shoulder" | "peak";
export type PricedSeason = Exclude<Season, "closed">;
export const PRICED_SEASONS: PricedSeason[] = ["low", "shoulder", "peak"];

export interface MarketModel {
  low: number;
  shoulder: number;
  peak: number;
  estimated?: boolean;
  basis?: string;
}

export interface MarketDestination {
  catMultiplier: number;
  monoMultiplier: number;
  /** Month number "1".."12" → season. */
  months: Record<string, Season>;
  /**
   * Flatter seasons (the tropics): each season's price as a share of the
   * model's peak price, instead of the model's own low/shoulder figures.
   */
  seasonFactors?: Record<PricedSeason, number>;
}

export interface MarketData {
  researchedAt: string;
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

export function seasonOf(market: MarketData, destinationId: string, weekStart: string): Season {
  const month = Number(weekStart.slice(5, 7));
  return market.destinations[destinationId]?.months[String(month)] ?? "closed";
}

/** The market price plus markup for one season, or null when we have no data. */
export function seasonPrice(market: MarketData, model: PricedModel, destinationId: string, season: PricedSeason, markupPct: number): number | null {
  const m = market.models[model.id];
  const d = market.destinations[destinationId];
  if (!m || !d) return null;
  const mult = model.kind === "catamaran" ? d.catMultiplier : d.monoMultiplier;
  const base = d.seasonFactors ? m.peak * d.seasonFactors[season] : m[season];
  return round50(base * mult * (1 + markupPct / 100));
}

/** The default (market + markup) for a week, or null out of season or without data. */
export function defaultWeekPrice(market: MarketData, model: PricedModel, destinationId: string, weekStart: string, markupPct: number): number | null {
  const season = seasonOf(market, destinationId, weekStart);
  if (season === "closed") return null;
  return seasonPrice(market, model, destinationId, season, markupPct);
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
