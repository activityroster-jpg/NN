import { describe, expect, it } from "vitest";
import { categoryWeekPrice } from "@/lib/domain/category-pricing";
import { makeOffer, makeYacht } from "./helpers";

const premiumCat = (key: string, price: number, commissionPct = 20) =>
  makeOffer({ yacht: makeYacht({ key, kind: "catamaran", lengthFt: 45, airCon: true }), price, commissionPct });

describe("categoryWeekPrice", () => {
  const policy = { marginPct: 12, basisRank: 3, minSupply: 3, roundTo: 10, defaultCommissionPct: 15 };

  it("prices off the third-cheapest cost so three yachts can fill it at a margin", () => {
    const offers = [premiumCat("a", 8000), premiumCat("b", 9000), premiumCat("c", 10000), premiumCat("d", 15000)];
    const p = categoryWeekPrice(offers, "premium-cat", "2027-07-03", "EUR", policy)!;
    expect(p.supply).toBe(4);
    expect(p.basisYachtKey).toBe("c");
    expect(p.basisCost).toBe(8000); // 10000 less 20% commission
    expect(p.price).toBe(8960); // 8000 * 1.12, rounded up to 10
  });

  it("publishes nothing when supply is too thin", () => {
    const offers = [premiumCat("a", 8000), premiumCat("b", 9000)];
    expect(categoryWeekPrice(offers, "premium-cat", "2027-07-03", "EUR", policy)).toBeNull();
  });

  it("ignores other categories, weeks and currencies", () => {
    const offers = [
      premiumCat("a", 8000),
      premiumCat("b", 9000),
      makeOffer({ yacht: makeYacht({ key: "mono", kind: "monohull", lengthFt: 45, airCon: true }), price: 5000 }),
      { ...premiumCat("c", 7000), weekStart: "2027-07-10" },
      { ...premiumCat("d", 7000), currency: "USD" as const },
    ];
    expect(categoryWeekPrice(offers, "premium-cat", "2027-07-03", "EUR", policy)).toBeNull();
  });
});
