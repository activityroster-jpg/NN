import type { Offer, OfferExtra, Yacht } from "@/lib/domain/types";

export function makeYacht(over: Partial<Yacht> = {}): Yacht {
  return {
    key: "mock:y1",
    provider: "mock",
    providerYachtId: "y1",
    operatorId: "op1",
    operatorName: "Op One",
    name: "Aurelia",
    model: "Lagoon 42",
    builder: "Lagoon",
    kind: "catamaran",
    lengthFt: 42,
    year: 2022,
    cabins: 4,
    berths: 10,
    heads: 4,
    crewCabins: 1,
    airCon: true,
    watermaker: true,
    generator: true,
    mainsail: "furling",
    base: { id: "b1", name: "Split", destinationId: "croatia" },
    images: [],
    equipment: [],
    securityDeposit: 4000,
    ...over,
  };
}

export function makeOffer(over: Partial<Offer> = {}, extras: OfferExtra[] = []): Offer {
  return {
    yacht: makeYacht(),
    weekStart: "2027-07-03",
    weekEnd: "2027-07-10",
    currency: "EUR",
    listPrice: 10000,
    price: 10000,
    commissionPct: 15,
    extras,
    depositPct: null,
    balanceDaysBefore: null,
    ref: "r1",
    ...over,
  };
}
