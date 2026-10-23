import { describe, expect, it } from "vitest";
import { guestCapacity, markupFor, paymentSchedule, quote, sellingCharterPrice, type QuoteInput } from "@/lib/domain/pricing";
import { makeOffer, makeYacht } from "./helpers";

const policy = { depositPct: 30, balanceDaysBefore: 42, bufferDays: 7 };

function input(over: Partial<QuoteInput> = {}): QuoteInput {
  return {
    offer: makeOffer(),
    selections: { guests: 6, skipper: false, chef: false, hostess: false, provisioning: false, damageWaiver: false },
    markupPct: 10,
    parityEnforced: false,
    defaultCommissionPct: 15,
    crewPool: {},
    crewPreference: "operator",
    bankDiscountPct: 2,
    policy,
    today: "2027-01-10",
    ...over,
  };
}

describe("markupFor", () => {
  const rules = [
    { operatorId: null, destinationId: null, categoryId: null, markupPct: 9 },
    { operatorId: null, destinationId: "croatia", categoryId: null, markupPct: 11 },
    { operatorId: null, destinationId: null, categoryId: "premium-cat" as const, markupPct: 12 },
    { operatorId: null, destinationId: "croatia", categoryId: "premium-cat" as const, markupPct: 13 },
    { operatorId: "op9", destinationId: null, categoryId: null, markupPct: 5 },
  ];
  it("picks the most specific matching rule", () => {
    expect(markupFor(rules, { operatorId: "op1", destinationId: "croatia", categoryId: "premium-cat" }, 10)).toBe(13);
    expect(markupFor(rules, { operatorId: "op1", destinationId: "croatia", categoryId: "standard-cat" }, 10)).toBe(11);
    expect(markupFor(rules, { operatorId: "op1", destinationId: "bvi", categoryId: "premium-cat" }, 10)).toBe(12);
    expect(markupFor(rules, { operatorId: "op1", destinationId: "bvi", categoryId: null }, 10)).toBe(9);
    expect(markupFor(rules, { operatorId: "op9", destinationId: "croatia", categoryId: "premium-cat" }, 10)).toBe(5);
  });
  it("falls back to the default without rules", () => {
    expect(markupFor([], { operatorId: "x", destinationId: "y", categoryId: null }, 10)).toBe(10);
  });
});

describe("sellingCharterPrice", () => {
  it("adds the markup and rounds up", () => {
    expect(sellingCharterPrice(10000, 10, false)).toBe(11000);
    expect(sellingCharterPrice(3333, 10, false)).toBe(3667);
  });
  it("never sells above the operator price when parity is enforced", () => {
    expect(sellingCharterPrice(10000, 10, true)).toBe(10000);
  });
});

describe("paymentSchedule", () => {
  it("takes a deposit now and the balance before departure", () => {
    const s = paymentSchedule(10000, "2027-07-03", "2027-01-10", policy, { depositPct: null, balanceDaysBefore: null });
    expect(s).toEqual([
      { kind: "deposit", amount: 3000, due: "2027-01-10" },
      { kind: "balance", amount: 7000, due: "2027-05-22" },
    ]);
  });
  it("uses the operator's plan when it is stricter, keeping a buffer", () => {
    const s = paymentSchedule(10000, "2027-07-03", "2027-01-10", policy, { depositPct: 50, balanceDaysBefore: 60 });
    expect(s[0]).toEqual({ kind: "deposit", amount: 5000, due: "2027-01-10" });
    expect(s[1]!.due).toBe("2027-04-27"); // 67 days before check-in
  });
  it("collects in full inside the balance window", () => {
    const s = paymentSchedule(10000, "2027-07-03", "2027-06-01", policy, { depositPct: null, balanceDaysBefore: null });
    expect(s).toEqual([{ kind: "full", amount: 10000, due: "2027-06-01" }]);
  });
});

describe("quote", () => {
  it("prices a bareboat charter with markup, bank discount and margin", () => {
    const q = quote(input());
    expect(q.charter).toBe(11000);
    expect(q.total).toBe(11000);
    expect(q.bankTotal).toBe(10780);
    expect(q.payout).toBe(8500);
    expect(q.margin).toBe(2500);
    expect(q.perPerson).toBe(1834);
  });

  it("adds operator crew, keeps payable-at-base items separate, includes mandatory extras", () => {
    const offer = makeOffer({}, [
      { code: "skipper", name: "Skipper", price: 1300, unit: "week", mandatory: false, payableAtBase: false },
      { code: "cleaning", name: "Cleaning", price: 200, unit: "booking", mandatory: true, payableAtBase: true },
      { code: "other", name: "Tourist tax", price: 2, unit: "person_day", mandatory: true, payableAtBase: false },
    ]);
    const q = quote(input({ offer, selections: { guests: 6, skipper: true, chef: false, hostess: false, provisioning: false, damageWaiver: false } }));
    expect(q.lines.map((l) => [l.code, l.amount])).toEqual([
      ["charter", 11000],
      ["skipper", 1300],
      ["other", 84],
    ]);
    expect(q.payAtBase.map((l) => l.amount)).toEqual([200]);
    expect(q.total).toBe(12384);
    expect(q.payout).toBe(8500 + 1300 + 84);
  });

  it("uses our crew pool when preferred or when the operator has none", () => {
    const offer = makeOffer({}, [{ code: "skipper", name: "Skipper", price: 1300, unit: "week", mandatory: false, payableAtBase: false }]);
    const sel = { guests: 4, skipper: true, chef: true, hostess: false, provisioning: false, damageWaiver: false };
    const q = quote(input({ offer, selections: sel, crewPool: { skipper: 1400, chef: 1500 }, crewPreference: "operator" }));
    expect(q.lines.find((l) => l.code === "skipper")!.source).toBe("operator");
    expect(q.lines.find((l) => l.code === "chef")!.source).toBe("pool");
    expect(q.poolCrew).toBe(1500);
    const q2 = quote(input({ offer, selections: sel, crewPool: { skipper: 1400, chef: 1500 }, crewPreference: "pool" }));
    expect(q2.lines.find((l) => l.code === "skipper")!.source).toBe("pool");
  });

  it("reports crew nobody can supply", () => {
    const q = quote(input({ selections: { guests: 4, skipper: false, chef: true, hostess: false, provisioning: false, damageWaiver: false } }));
    expect(q.unavailable).toEqual(["chef"]);
  });

  it("offers the damage waiver only when the operator does", () => {
    const sel = { guests: 4, skipper: false, chef: false, hostess: false, provisioning: false, damageWaiver: true };
    expect(quote(input({ selections: sel })).lines).toHaveLength(1);
    const offer = makeOffer({}, [{ code: "damage_waiver", name: "Waiver", price: 450, unit: "booking", mandatory: false, payableAtBase: false }]);
    expect(quote(input({ offer, selections: sel })).total).toBe(11450);
  });

  it("charges the operator price under parity", () => {
    const q = quote(input({ parityEnforced: true }));
    expect(q.charter).toBe(10000);
    expect(q.markupPct).toBe(0);
    expect(q.margin).toBe(1500);
  });
});

describe("guestCapacity", () => {
  it("crew in a dedicated crew cabin do not take guest berths", () => {
    expect(guestCapacity(makeYacht({ berths: 10, crewCabins: 1 }), 1)).toBe(10);
    expect(guestCapacity(makeYacht({ berths: 10, crewCabins: 1 }), 2)).toBe(9);
    expect(guestCapacity(makeYacht({ berths: 8, crewCabins: 0 }), 1)).toBe(7);
  });
});
