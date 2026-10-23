import type { CategoryId } from "./categories";
import { categorise } from "./categories";
import { guestCapacity } from "./pricing";
import type { HullKind, Offer, ProviderId } from "./types";

// The same yacht is often listed on more than one booking manager. Identify it
// by operator, name, model and year, and keep the cheapest listing (ties go to
// the provider we prefer to book through).

const PROVIDER_PREFERENCE: Record<ProviderId, number> = { mmk: 0, nausys: 1, mock: 2 };

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(d\.?o\.?o|ltd|s\.?r\.?l|gmbh|sa|charter|yachting|yachts?)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function yachtIdentity(o: Offer): string {
  const y = o.yacht;
  return [norm(y.operatorName), norm(y.name), norm(y.model), y.year, o.weekStart].join("|");
}

export function dedupeOffers(offers: readonly Offer[]): Offer[] {
  const best = new Map<string, Offer>();
  for (const o of offers) {
    const id = yachtIdentity(o);
    const cur = best.get(id);
    if (
      !cur ||
      o.price < cur.price ||
      (o.price === cur.price && PROVIDER_PREFERENCE[o.yacht.provider] < PROVIDER_PREFERENCE[cur.yacht.provider])
    ) {
      best.set(id, o);
    }
  }
  return [...best.values()];
}

// ── Filtering and sorting for search results ───────────────────────────────

export interface OfferFilters {
  kind?: Extract<HullKind, "monohull" | "catamaran">;
  categoryId?: CategoryId;
  minCabins?: number;
  minLengthFt?: number;
  maxLengthFt?: number;
  minYear?: number;
  airCon?: boolean;
  /** Guests who must fit once the chosen crew are aboard. */
  guests?: number;
  crewCount?: number;
  maxPrice?: number;
}

export type SortKey = "recommended" | "price" | "newest" | "length";

export function filterOffers(offers: readonly Offer[], f: OfferFilters, priceOf: (o: Offer) => number): Offer[] {
  return offers.filter((o) => {
    const y = o.yacht;
    if (f.kind && y.kind !== f.kind) return false;
    if (f.categoryId && categorise(y) !== f.categoryId) return false;
    if (f.minCabins && y.cabins < f.minCabins) return false;
    if (f.minLengthFt && y.lengthFt < f.minLengthFt) return false;
    if (f.maxLengthFt && y.lengthFt > f.maxLengthFt) return false;
    if (f.minYear && y.year < f.minYear) return false;
    if (f.airCon && !y.airCon) return false;
    if (f.guests && guestCapacity(y, f.crewCount ?? 0) < f.guests) return false;
    if (f.maxPrice && priceOf(o) > f.maxPrice) return false;
    return true;
  });
}

export function sortOffers(offers: readonly Offer[], key: SortKey, priceOf: (o: Offer) => number, currentYear: number): Offer[] {
  const list = [...offers];
  switch (key) {
    case "price":
      return list.sort((a, b) => priceOf(a) - priceOf(b));
    case "newest":
      return list.sort((a, b) => b.yacht.year - a.yacht.year || priceOf(a) - priceOf(b));
    case "length":
      return list.sort((a, b) => b.yacht.lengthFt - a.yacht.lengthFt || priceOf(a) - priceOf(b));
    case "recommended":
    default:
      // Value score: newer, roomier, AC, per unit of price. Simple and explainable.
      return list.sort((a, b) => score(b, priceOf(b), currentYear) - score(a, priceOf(a), currentYear));
  }
}

function score(o: Offer, price: number, currentYear: number): number {
  const y = o.yacht;
  const age = Math.max(0, currentYear - y.year);
  const quality = 100 - age * 4 + y.cabins * 6 + y.heads * 4 + (y.airCon ? 10 : 0) + (y.watermaker ? 4 : 0) + (y.generator ? 4 : 0);
  return quality / Math.max(1, Math.log10(Math.max(10, price)));
}
