import type { CategoryId } from "./categories";
import { categorise } from "./categories";
import { addDays, daysBetween } from "./dates";
import { ceilUnit, round2 } from "./money";
import type { Currency, ExtraCode, Offer, OfferExtra } from "./types";

// ── Markup rules ───────────────────────────────────────────────────────────
// Selling price = operator price + our markup, unless the operator enforces
// price parity (we may not sell above its own public price). Revenue is the
// markup plus the agency commission the operator pays us.

export interface MarkupRule {
  operatorId: string | null;
  destinationId: string | null;
  categoryId: CategoryId | null;
  markupPct: number;
}

export interface MarkupContext {
  operatorId: string;
  destinationId: string;
  categoryId: CategoryId | null;
}

/**
 * The most specific matching rule wins: operator, then destination + category,
 * then category, then destination, then the catch-all. Ties keep the first rule.
 */
export function markupFor(rules: readonly MarkupRule[], ctx: MarkupContext, defaultPct: number): number {
  let best: { score: number; pct: number } | null = null;
  for (const r of rules) {
    if (r.operatorId !== null && r.operatorId !== ctx.operatorId) continue;
    if (r.destinationId !== null && r.destinationId !== ctx.destinationId) continue;
    if (r.categoryId !== null && r.categoryId !== ctx.categoryId) continue;
    const score = (r.operatorId ? 8 : 0) + (r.categoryId ? 2 : 0) + (r.destinationId ? 1 : 0) + (r.destinationId && r.categoryId ? 2 : 0);
    if (!best || score > best.score) best = { score, pct: r.markupPct };
  }
  return best ? best.pct : defaultPct;
}

export function sellingCharterPrice(operatorPrice: number, markupPct: number, parityEnforced: boolean): number {
  if (parityEnforced) return ceilUnit(operatorPrice);
  return ceilUnit(operatorPrice * (1 + Math.max(0, markupPct) / 100));
}

// ── Extras ─────────────────────────────────────────────────────────────────

export const CHARTER_DAYS = 7;

export function extraTotal(e: Pick<OfferExtra, "price" | "unit">, guests: number, days = CHARTER_DAYS): number {
  switch (e.unit) {
    case "week":
    case "booking":
      return e.price;
    case "day":
      return e.price * days;
    case "person":
      return e.price * guests;
    case "person_day":
      return e.price * guests * days;
  }
}

/** Weekly prices for our own crew pool, per destination, in the offer currency. */
export interface CrewPoolRates {
  skipper?: number;
  chef?: number;
  hostess?: number;
}

export type CrewRole = "skipper" | "chef" | "hostess";
export type CrewSource = "operator" | "pool";

export interface QuoteSelections {
  guests: number;
  skipper: boolean;
  chef: boolean;
  hostess: boolean;
  provisioning: boolean;
  damageWaiver: boolean;
}

export interface QuoteLine {
  code: ExtraCode | "charter";
  label: string;
  amount: number;
  source: "operator" | "pool" | "charter";
}

export interface PaymentStep {
  kind: "deposit" | "balance" | "full";
  amount: number;
  /** ISO date. */
  due: string;
}

export interface Quote {
  currency: Currency;
  categoryId: CategoryId | null;
  markupPct: number;
  /** Charter price to the customer. */
  charter: number;
  /** Charter, chosen extras and mandatory extras paid through us. */
  lines: QuoteLine[];
  /** Mandatory or chosen items the customer pays to the operator at the base. */
  payAtBase: QuoteLine[];
  /** Total paid through us, card price. */
  total: number;
  /** Total when paying by bank transfer (discount for the cheaper payment method). */
  bankTotal: number;
  bankDiscountPct: number;
  perPerson: number;
  /** Amount we owe the operator: charter at net plus operator extras. */
  payout: number;
  /** Our revenue on the charter: markup plus agency commission (card price, before card fees). */
  margin: number;
  /** Paid through us for our own crew pool; we pay the crew from it. */
  poolCrew: number;
  /** Crew roles the customer asked for that nobody can supply here. */
  unavailable: CrewRole[];
  schedule: PaymentStep[];
}

export interface PaymentPolicy {
  /** Our minimum deposit, percent. */
  depositPct: number;
  /** Our balance deadline, days before check-in. */
  balanceDaysBefore: number;
  /** Days we keep between the customer's balance and the operator's. */
  bufferDays: number;
}

export const DEFAULT_PAYMENT_POLICY: PaymentPolicy = { depositPct: 30, balanceDaysBefore: 42, bufferDays: 7 };

/**
 * When the customer pays. The stricter of our policy and the operator's plan
 * wins, so we never owe the operator money we have not yet collected. Inside
 * the balance window the whole amount is due now.
 */
export function paymentSchedule(
  total: number,
  checkIn: string,
  today: string,
  policy: PaymentPolicy,
  operator: { depositPct: number | null; balanceDaysBefore: number | null },
): PaymentStep[] {
  const depositPct = Math.min(100, Math.max(policy.depositPct, operator.depositPct ?? 0));
  const balanceDays = Math.max(policy.balanceDaysBefore, (operator.balanceDaysBefore ?? 0) + policy.bufferDays);
  const balanceDue = addDays(checkIn, -balanceDays);
  // Collect in full when the balance would fall due within three days anyway.
  if (depositPct >= 100 || daysBetween(today, balanceDue) <= 3) {
    return [{ kind: "full", amount: total, due: today }];
  }
  const deposit = ceilUnit((total * depositPct) / 100);
  return [
    { kind: "deposit", amount: deposit, due: today },
    { kind: "balance", amount: round2(total - deposit), due: balanceDue },
  ];
}

export interface QuoteInput {
  offer: Offer;
  selections: QuoteSelections;
  markupPct: number;
  parityEnforced: boolean;
  /** Commission to assume when the feed does not state one. */
  defaultCommissionPct: number;
  crewPool: CrewPoolRates;
  crewPreference: CrewSource;
  bankDiscountPct: number;
  policy: PaymentPolicy;
  today: string;
  /** Translated labels for lines; falls back to the extra's own name. */
  labels?: Partial<Record<ExtraCode | "charter", string>>;
}

function findExtra(extras: readonly OfferExtra[], code: ExtraCode): OfferExtra | undefined {
  return extras.find((e) => e.code === code);
}

export function quote(input: QuoteInput): Quote {
  const { offer, selections: s } = input;
  const categoryId = categorise(offer.yacht);
  const charter = sellingCharterPrice(offer.price, input.markupPct, input.parityEnforced);
  const commissionPct = offer.commissionPct ?? input.defaultCommissionPct;
  const charterNet = offer.price * (1 - commissionPct / 100);

  const label = (code: ExtraCode | "charter", fallback: string) => input.labels?.[code] ?? fallback;
  const lines: QuoteLine[] = [{ code: "charter", label: label("charter", "Charter"), amount: charter, source: "charter" }];
  const payAtBase: QuoteLine[] = [];
  const unavailable: CrewRole[] = [];
  let operatorExtrasThroughUs = 0;
  let poolRevenue = 0;

  const addOperatorExtra = (e: OfferExtra) => {
    const amount = ceilUnit(extraTotal(e, s.guests));
    const line: QuoteLine = { code: e.code, label: label(e.code, e.name), amount, source: "operator" };
    if (e.payableAtBase) payAtBase.push(line);
    else {
      lines.push(line);
      operatorExtrasThroughUs += amount;
    }
  };

  // Crew: pool or operator, by preference, falling back to whichever exists.
  const crew: [CrewRole, boolean][] = [
    ["skipper", s.skipper],
    ["chef", s.chef],
    ["hostess", s.hostess],
  ];
  for (const [role, wanted] of crew) {
    if (!wanted) continue;
    const opExtra = findExtra(offer.extras, role);
    const poolRate = input.crewPool[role];
    const usePool = poolRate !== undefined && (input.crewPreference === "pool" || !opExtra);
    if (usePool) {
      const amount = ceilUnit(poolRate);
      lines.push({ code: role, label: label(role, role), amount, source: "pool" });
      poolRevenue += amount;
    } else if (opExtra) {
      addOperatorExtra(opExtra);
    } else {
      unavailable.push(role);
    }
  }

  if (s.provisioning) {
    const e = findExtra(offer.extras, "provisioning");
    if (e) addOperatorExtra(e);
  }
  if (s.damageWaiver) {
    const e = findExtra(offer.extras, "damage_waiver");
    if (e) addOperatorExtra(e);
  }
  // Mandatory extras that are not crew/provisioning/waiver (cleaning, transit log, tourist tax…).
  for (const e of offer.extras) {
    if (!e.mandatory) continue;
    if (["skipper", "chef", "hostess", "provisioning", "damage_waiver"].includes(e.code)) continue;
    addOperatorExtra(e);
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const bankDiscountPct = Math.max(0, input.bankDiscountPct);
  const bankTotal = ceilUnit(total * (1 - bankDiscountPct / 100));
  const payout = round2(charterNet + operatorExtrasThroughUs);
  return {
    currency: offer.currency,
    categoryId,
    markupPct: input.parityEnforced ? 0 : input.markupPct,
    charter,
    lines,
    payAtBase,
    total,
    bankTotal,
    bankDiscountPct,
    perPerson: ceilUnit(total / Math.max(1, s.guests)),
    payout,
    margin: round2(charter - charterNet),
    poolCrew: poolRevenue,
    unavailable,
    schedule: paymentSchedule(total, offer.weekStart, input.today, input.policy, {
      depositPct: offer.depositPct,
      balanceDaysBefore: offer.balanceDaysBefore,
    }),
  };
}

/**
 * How many guests the yacht sleeps once crew are aboard. Each crew member takes
 * a berth unless the yacht has a separate crew cabin for them.
 */
export function guestCapacity(y: { berths: number; crewCabins: number }, crewCount: number): number {
  const crewInGuestBerths = Math.max(0, crewCount - y.crewCabins);
  return Math.max(0, y.berths - crewInGuestBerths);
}
