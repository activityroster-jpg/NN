import { describe, expect, it } from "vitest";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { mockProvider } from "@/lib/providers/mock/provider";
import { DEMO_FLEET } from "@/lib/providers/mock/fleet";
import { categorise } from "@/lib/domain/categories";

describe("demo fleet", () => {
  it("covers every destination, featured ones generously", () => {
    for (const d of DESTINATIONS) {
      const n = DEMO_FLEET.filter((y) => y.yacht.base.destinationId === d.id).length;
      expect(n).toBeGreaterThanOrEqual(d.featured ? 30 : 10);
    }
  });

  it("includes every category in each featured destination", () => {
    for (const d of DESTINATIONS.filter((x) => x.featured)) {
      const cats = new Set(DEMO_FLEET.filter((y) => y.yacht.base.destinationId === d.id).map((y) => categorise(y.yacht)));
      expect(cats.size).toBeGreaterThanOrEqual(5);
    }
  });

  it("is deterministic and season-aware", async () => {
    const a = await mockProvider.search({ destinationId: "croatia", weekStart: "2027-07-03", nights: 7, baseIds: [] });
    const b = await mockProvider.search({ destinationId: "croatia", weekStart: "2027-07-03", nights: 7, baseIds: [] });
    expect(a.map((o) => [o.yacht.key, o.price])).toEqual(b.map((o) => [o.yacht.key, o.price]));
    expect(a.length).toBeGreaterThan(10);
    const winter = await mockProvider.search({ destinationId: "croatia", weekStart: "2027-01-09", nights: 7, baseIds: [] });
    expect(winter).toHaveLength(0);
    const bviWinter = await mockProvider.search({ destinationId: "bvi", weekStart: "2027-01-09", nights: 7, baseIds: [] });
    expect(bviWinter.length).toBeGreaterThan(10);
    expect(bviWinter[0]!.currency).toBe("USD");
  });

  it("returns the same offer from getOffer as from search", async () => {
    const [first] = await mockProvider.search({ destinationId: "sardinia", weekStart: "2027-06-05", nights: 7, baseIds: [] });
    const again = await mockProvider.getOffer(first!.yacht.providerYachtId, "2027-06-05", 7);
    expect(again?.price).toBe(first!.price);
  });
});
