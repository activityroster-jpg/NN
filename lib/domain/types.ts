// Normalised charter data. Every booking-manager adapter maps its own payloads
// into these shapes, so the rest of the app never sees a provider's format.

export const CURRENCIES = ["EUR", "GBP", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PROVIDERS = ["mock", "mmk", "nausys"] as const;
export type ProviderId = (typeof PROVIDERS)[number];

export type HullKind = "monohull" | "catamaran" | "power" | "gulet";

/** Charter types. Only bareboat and skippered are sold today; the rest are modelled so they can be switched on. */
export const CHARTER_TYPES = ["bareboat", "skippered", "crewed", "cabin", "flotilla"] as const;
export type CharterType = (typeof CHARTER_TYPES)[number];

export interface Base {
  id: string;
  name: string;
  destinationId: string;
  lat?: number;
  lng?: number;
}

export interface Yacht {
  /** Globally unique: `${provider}:${providerYachtId}`. */
  key: string;
  provider: ProviderId;
  providerYachtId: string;
  operatorId: string;
  operatorName: string;
  name: string;
  model: string;
  builder: string;
  kind: HullKind;
  lengthFt: number;
  year: number;
  cabins: number;
  berths: number;
  heads: number;
  /** Separate crew cabins (e.g. a skipper cabin in a catamaran bow). */
  crewCabins: number;
  airCon: boolean;
  watermaker: boolean;
  generator: boolean;
  mainsail: "classic" | "furling" | "unknown";
  base: Base;
  images: string[];
  equipment: string[];
  /** Refundable security deposit held by the operator at the base. */
  securityDeposit: number | null;
}

export const EXTRA_CODES = [
  "skipper",
  "chef",
  "hostess",
  "provisioning",
  "transfer",
  "damage_waiver",
  "cleaning",
  "other",
] as const;
export type ExtraCode = (typeof EXTRA_CODES)[number];

export type ExtraUnit = "week" | "day" | "person" | "person_day" | "booking";

export interface OfferExtra {
  code: ExtraCode;
  name: string;
  price: number;
  unit: ExtraUnit;
  mandatory: boolean;
  /** Paid by the customer to the operator at the base, not through us. */
  payableAtBase: boolean;
}

export interface Offer {
  yacht: Yacht;
  /** ISO date, check-in day. */
  weekStart: string;
  /** ISO date, check-out day. */
  weekEnd: string;
  currency: Currency;
  /** Operator brochure price for the period. */
  listPrice: number;
  /** Operator price after its own discounts: what the customer would pay the operator directly. */
  price: number;
  /** Agency commission on `price` from the feed, percent. Null when the feed does not say. */
  commissionPct: number | null;
  extras: OfferExtra[];
  /** Operator payment plan, when the feed provides it. */
  depositPct: number | null;
  balanceDaysBefore: number | null;
  /** Provider's own reference for this offer (used when creating an option). */
  ref: string;
}
