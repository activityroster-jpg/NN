import { describe, expect, it } from "vitest";
import { dedupeOffers, filterOffers, sortOffers } from "@/lib/domain/offers";
import { makeOffer, makeYacht } from "./helpers";

describe("dedupeOffers", () => {
  it("keeps the cheapest listing of the same yacht across providers", () => {
    const a = makeOffer({ yacht: makeYacht({ key: "mmk:1", provider: "mmk", operatorName: "Sail Croatia d.o.o." }), price: 9000 });
    const b = makeOffer({ yacht: makeYacht({ key: "nausys:7", provider: "nausys", operatorName: "Sail Croatia" }), price: 8800 });
    const c = makeOffer({ yacht: makeYacht({ key: "mmk:2", provider: "mmk", name: "Other" }), price: 9500 });
    const out = dedupeOffers([a, b, c]);
    expect(out.map((o) => o.yacht.key).sort()).toEqual(["mmk:2", "nausys:7"]);
  });
  it("breaks price ties in favour of MMK", () => {
    const a = makeOffer({ yacht: makeYacht({ key: "nausys:7", provider: "nausys" }), price: 9000 });
    const b = makeOffer({ yacht: makeYacht({ key: "mmk:1", provider: "mmk" }), price: 9000 });
    expect(dedupeOffers([a, b])[0]!.yacht.key).toBe("mmk:1");
  });
});

describe("filterOffers and sortOffers", () => {
  const offers = [
    makeOffer({ yacht: makeYacht({ key: "a", kind: "monohull", lengthFt: 46, airCon: false, year: 2018, berths: 8, crewCabins: 0 }), price: 4000 }),
    makeOffer({ yacht: makeYacht({ key: "b", kind: "catamaran", lengthFt: 45, airCon: true, year: 2023 }), price: 9000 }),
    makeOffer({ yacht: makeYacht({ key: "c", kind: "catamaran", lengthFt: 40, airCon: false, year: 2020 }), price: 6000 }),
  ];
  const price = (o: (typeof offers)[number]) => o.price;

  it("filters by AC, type and guests with crew aboard", () => {
    expect(filterOffers(offers, { airCon: true }, price).map((o) => o.yacht.key)).toEqual(["b"]);
    expect(filterOffers(offers, { kind: "catamaran" }, price).map((o) => o.yacht.key)).toEqual(["b", "c"]);
    expect(filterOffers(offers, { guests: 8, crewCount: 1 }, price).map((o) => o.yacht.key)).toEqual(["b", "c"]);
    expect(filterOffers(offers, { maxPrice: 6500 }, price).map((o) => o.yacht.key)).toEqual(["a", "c"]);
  });

  it("sorts by price and by age", () => {
    expect(sortOffers(offers, "price", price, 2027).map((o) => o.yacht.key)).toEqual(["a", "c", "b"]);
    expect(sortOffers(offers, "newest", price, 2027).map((o) => o.yacht.key)).toEqual(["b", "c", "a"]);
  });
});
