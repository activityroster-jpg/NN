import { describe, expect, it } from "vitest";
import { MODELS } from "@/lib/fleet";
import { DESTINATIONS } from "@/lib/domain/destinations";
import marketFile from "@/lib/pricing/market.json";
import {
  defaultRange,
  defaultWeekPrice,
  estimateRange,
  isSaturday,
  overrideKey,
  saturdays,
  seasonOf,
  seasonRatio,
  weekEstimate,
  type MarketData,
} from "@/lib/pricing/estimate";

const MARKET = marketFile as unknown as MarketData;

const market: MarketData = {
  researchedAt: "test",
  models: { cat: { peak: 10_000 } },
  destinations: {
    here: { catFactor: 1.2, monoFactor: 1, curve: [["01-01", 0], ["04-01", 0.5], ["06-26", 1], ["08-14", 0.8], ["11-01", 0]] },
  },
};
const cat = { id: "cat", kind: "catamaran" as const };

describe("yacht estimates", () => {
  it("prices a week as peak × destination factor × season ratio × markup, to the nearest 50", () => {
    expect(defaultWeekPrice(market, cat, "here", "2027-07-03", 10)).toBe(13_200); // 10000 × 1.2 × 1 × 1.1
    expect(defaultWeekPrice(market, cat, "here", "2027-05-01", 0)).toBe(6_000); // × 0.5
    expect(defaultWeekPrice(market, cat, "here", "2027-08-14", 0)).toBe(9_600); // the step applies from its date
    expect(defaultWeekPrice(market, cat, "here", "2027-08-07", 0)).toBe(12_000);
  });

  it("has no price when closed or without data", () => {
    expect(seasonOf(market, "here", "2027-11-06")).toBe("closed");
    expect(defaultWeekPrice(market, cat, "here", "2027-11-06", 10)).toBeNull();
    expect(defaultWeekPrice(market, { id: "nope", kind: "monohull" }, "here", "2027-07-03", 10)).toBeNull();
    expect(defaultWeekPrice(market, cat, "elsewhere", "2027-07-03", 10)).toBeNull();
  });

  it("names the bands from the ratio", () => {
    expect(seasonOf(market, "here", "2027-07-03")).toBe("peak");
    expect(seasonOf(market, "here", "2027-08-21")).toBe("shoulder");
    expect(seasonOf(market, "here", "2027-04-10")).toBe("low");
  });

  it("uses the admin's own week price over the default, even when closed", () => {
    const o = new Map([[overrideKey("here", "2027-07-03"), 8_000], [overrideKey("here", "2027-11-06"), 3_000]]);
    expect(weekEstimate(market, cat, "here", "2027-07-03", 10, o)).toBe(8_000);
    expect(weekEstimate(market, cat, "here", "2027-07-10", 10, o)).toBe(13_200);
    expect(weekEstimate(market, cat, "here", "2027-11-06", 10, o)).toBe(3_000);
  });

  it("finds ranges", () => {
    expect(estimateRange(market, cat, ["here"], saturdays("2027-06-01", 9), 0, undefined)).toEqual({ min: 6_000, max: 12_000 });
    expect(estimateRange(market, cat, ["here"], ["2027-11-06"], 0, undefined)).toBeNull();
    expect(defaultRange(market, cat, "here", 0)).toEqual({ low: 6_000, peak: 12_000 });
  });

  it("lists Saturdays", () => {
    expect(saturdays("2027-06-01", 2)).toEqual(["2027-06-05", "2027-06-12"]);
    expect(isSaturday("2027-06-05")).toBe(true);
    expect(isSaturday("2027-06-06")).toBe(false);
    expect(isSaturday("nope")).toBe(false);
  });
});

describe("market data (docs/research/charter-prices-2027.md)", () => {
  it("prices every model we offer", () => {
    for (const m of MODELS) {
      const p = MARKET.models[m.id];
      expect(p, m.id).toBeDefined();
      expect(p!.peak, m.id).toBeGreaterThan(3_000);
      if (p!.low != null) expect(p!.low, m.id).toBeLessThan(p!.peak);
      expect(["bareboat", "skippered", "crewed"], m.id).toContain(p!.product);
    }
  });

  it("has a valid season curve for every destination, open in every month the planner offers", () => {
    for (const d of DESTINATIONS) {
      const x = MARKET.destinations[d.id];
      expect(x, d.id).toBeDefined();
      expect(x!.curve[0]![0], d.id).toBe("01-01");
      for (let i = 1; i < x!.curve.length; i++) expect(x!.curve[i]![0] > x!.curve[i - 1]![0], `${d.id} sorted`).toBe(true);
      for (const [, r] of x!.curve) expect(r >= 0 && r <= 1.2, d.id).toBe(true);
      for (const mo of d.seasonMonths) {
        const first = `2027-${String(mo).padStart(2, "0")}-15`;
        expect(seasonRatio(MARKET, d.id, first), `${d.id} month ${mo}`).toBeGreaterThan(0);
      }
    }
  });

  it("matches the report's shapes", () => {
    // Greece holds 0.56 at the floor; Balearics drop to 0.30; Turkey peaks in September.
    expect(seasonRatio(MARKET, "greece-ionian", "2027-04-03")).toBe(0.56);
    expect(seasonRatio(MARKET, "balearics", "2027-04-10")).toBe(0.3);
    expect(seasonOf(MARKET, "turkey", "2027-09-11")).toBe("peak");
    expect(seasonOf(MARKET, "turkey", "2027-07-10")).toBe("shoulder");
    // Lagoon 51 in Croatia at peak, no markup: the report's €20,895.
    expect(defaultWeekPrice(MARKET, { id: "lagoon-51", kind: "catamaran" }, "croatia", "2027-07-10", 0)).toBe(20_900);
  });
});
