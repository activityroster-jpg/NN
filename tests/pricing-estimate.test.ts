import { describe, expect, it } from "vitest";
import { MODELS } from "@/lib/fleet";
import { DESTINATIONS } from "@/lib/domain/destinations";
import marketFile from "@/lib/pricing/market.json";
import { defaultWeekPrice, estimateRange, isSaturday, overrideKey, saturdays, seasonOf, seasonPrice, weekEstimate, type MarketData } from "@/lib/pricing/estimate";

const MARKET = marketFile as MarketData;
const market: MarketData = {
  researchedAt: "test",
  models: { cat: { low: 4000, shoulder: 6000, peak: 9000 } },
  destinations: { here: { catMultiplier: 1.2, monoMultiplier: 1, months: { "6": "shoulder", "7": "peak", "11": "closed" } } },
};
const cat = { id: "cat", kind: "catamaran" as const };

describe("yacht estimates", () => {
  it("applies the destination multiplier and markup, rounded to 50", () => {
    expect(seasonPrice(market, cat, "here", "peak", 10)).toBe(11_900); // 9000 × 1.2 × 1.1 = 11,880
    expect(defaultWeekPrice(market, cat, "here", "2027-07-03", 10)).toBe(11_900);
    expect(defaultWeekPrice(market, cat, "here", "2027-06-05", 0)).toBe(7_200);
  });

  it("has no price out of season or without data", () => {
    expect(seasonOf(market, "here", "2027-11-06")).toBe("closed");
    expect(defaultWeekPrice(market, cat, "here", "2027-11-06", 10)).toBeNull();
    expect(defaultWeekPrice(market, { id: "nope", kind: "monohull" }, "here", "2027-07-03", 10)).toBeNull();
    expect(defaultWeekPrice(market, cat, "elsewhere", "2027-07-03", 10)).toBeNull();
  });

  it("uses the admin's own week price over the default, even out of season", () => {
    const o = new Map([[overrideKey("here", "2027-07-03"), 8_000], [overrideKey("here", "2027-11-06"), 3_000]]);
    expect(weekEstimate(market, cat, "here", "2027-07-03", 10, o)).toBe(8_000);
    expect(weekEstimate(market, cat, "here", "2027-07-10", 10, o)).toBe(11_900);
    expect(weekEstimate(market, cat, "here", "2027-11-06", 10, o)).toBe(3_000);
  });

  it("finds the range over in-season weeks", () => {
    const weeks = saturdays("2027-06-01", 9); // June and July
    expect(estimateRange(market, cat, ["here"], weeks, 0, undefined)).toEqual({ min: 7_200, max: 10_800 });
    expect(estimateRange(market, cat, ["here"], ["2027-11-06"], 0, undefined)).toBeNull();
  });

  it("lists Saturdays", () => {
    expect(saturdays("2027-06-01", 2)).toEqual(["2027-06-05", "2027-06-12"]);
    expect(isSaturday("2027-06-05")).toBe(true);
    expect(isSaturday("2027-06-06")).toBe(false);
    expect(isSaturday("nope")).toBe(false);
  });

  it("has market data for every model and destination we offer", () => {
    for (const m of MODELS) {
      const p = MARKET.models[m.id];
      expect(p, m.id).toBeDefined();
      expect(p!.low, m.id).toBeLessThanOrEqual(p!.shoulder);
      expect(p!.shoulder, m.id).toBeLessThanOrEqual(p!.peak);
      expect(p!.low, m.id).toBeGreaterThan(500);
    }
    for (const d of DESTINATIONS) {
      const x = MARKET.destinations[d.id];
      expect(x, d.id).toBeDefined();
      for (let i = 1; i <= 12; i++) expect(["closed", "low", "shoulder", "peak"], `${d.id} ${i}`).toContain(x!.months[String(i)]);
      // Every month the planner offers must be priced.
      for (const mo of d.seasonMonths) expect(x!.months[String(mo)], `${d.id} ${mo}`).not.toBe("closed");
    }
  });
});
