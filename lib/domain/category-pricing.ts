import type { CategoryId } from "./categories";
import { categorise } from "./categories";
import { ceilUnit } from "./money";
import type { Currency, Offer } from "./types";

// Offering B (not yet on sale): the customer books a category ("Premium Cat,
// Croatia, week of 4 July") and we choose the yacht later. The published price
// must be one we can actually buy at with a margin, for that specific week.
//
// Method: take the matching yachts still available that week, ranked by what
// they cost us (operator price less commission). Price off the Nth cheapest, so
// at least N yachts can fill the booking at or below our cost basis, and add
// the target margin. Publish nothing when fewer than `minSupply` match.

export interface CategoryPricingPolicy {
  marginPct: number;
  /** Price off this rank of cheapest cost (1 = cheapest). */
  basisRank: number;
  /** Minimum matching available yachts before a price is published. */
  minSupply: number;
  /** Round the published price up to this step. */
  roundTo: number;
  defaultCommissionPct: number;
}

export const DEFAULT_CATEGORY_POLICY: CategoryPricingPolicy = {
  marginPct: 12,
  basisRank: 3,
  minSupply: 3,
  roundTo: 10,
  defaultCommissionPct: 15,
};

export interface CategoryWeekPrice {
  categoryId: CategoryId;
  weekStart: string;
  currency: Currency;
  price: number;
  supply: number;
  /** Our cost for the basis yacht. */
  basisCost: number;
  basisYachtKey: string;
}

export function offerCost(o: Offer, defaultCommissionPct: number): number {
  return o.price * (1 - (o.commissionPct ?? defaultCommissionPct) / 100);
}

export function categoryWeekPrice(
  offers: readonly Offer[],
  categoryId: CategoryId,
  weekStart: string,
  currency: Currency,
  policy: CategoryPricingPolicy = DEFAULT_CATEGORY_POLICY,
): CategoryWeekPrice | null {
  const matching = offers
    .filter((o) => o.weekStart === weekStart && o.currency === currency && categorise(o.yacht) === categoryId)
    .map((o) => ({ o, cost: offerCost(o, policy.defaultCommissionPct) }))
    .sort((a, b) => a.cost - b.cost);
  if (matching.length < Math.max(policy.minSupply, 1)) return null;
  const rank = Math.min(Math.max(policy.basisRank, 1), matching.length);
  const basis = matching[rank - 1]!;
  const raw = basis.cost * (1 + policy.marginPct / 100);
  const step = Math.max(1, policy.roundTo);
  return {
    categoryId,
    weekStart,
    currency,
    price: ceilUnit(Math.ceil(raw / step) * step),
    supply: matching.length,
    basisCost: Math.round(basis.cost),
    basisYachtKey: basis.o.yacht.key,
  };
}
