import { addDays } from "@/lib/domain/dates";
import { destinationById, inSeason } from "@/lib/domain/destinations";
import { monthOf } from "@/lib/domain/dates";
import type { Offer } from "@/lib/domain/types";
import type { CharterProvider, ClientDetails, OptionResult, SearchQuery } from "../types";
import { DEMO_FLEET, demoAvailable, demoDiscountPct, seasonFactor, type DemoYacht } from "./fleet";

function toOffer(d: DemoYacht, weekStart: string, nights: number): Offer {
  const dest = destinationById(d.yacht.base.destinationId);
  const listPrice = Math.round((d.basePrice * seasonFactor(d.yacht.base.destinationId, weekStart) * (nights / 7)) / 10) * 10;
  const price = Math.round((listPrice * (1 - demoDiscountPct(d.yacht.key, weekStart) / 100)) / 10) * 10;
  return {
    yacht: d.yacht,
    weekStart,
    weekEnd: addDays(weekStart, nights),
    currency: dest?.currency ?? "EUR",
    listPrice,
    price,
    commissionPct: d.commissionPct,
    extras: d.extras,
    depositPct: d.depositPct,
    balanceDaysBefore: d.balanceDaysBefore,
    ref: `mock:${d.yacht.providerYachtId}:${weekStart}`,
  };
}

function available(d: DemoYacht, weekStart: string): boolean {
  const dest = destinationById(d.yacht.base.destinationId);
  if (!dest || !inSeason(dest, monthOf(weekStart))) return false;
  return demoAvailable(d.yacht.key, weekStart, dest.id);
}

/** Demo booking manager: in-memory fleet, deterministic availability, options always succeed. */
export const mockProvider: CharterProvider = {
  id: "mock",
  label: "Demo fleet",
  async search(q: SearchQuery): Promise<Offer[]> {
    return DEMO_FLEET.filter((d) => d.yacht.base.destinationId === q.destinationId && available(d, q.weekStart)).map((d) =>
      toOffer(d, q.weekStart, q.nights),
    );
  },
  async getOffer(providerYachtId, weekStart, nights) {
    const d = DEMO_FLEET.find((x) => x.yacht.providerYachtId === providerYachtId);
    if (!d || !available(d, weekStart)) return null;
    return toOffer(d, weekStart, nights);
  },
  async createOption(offer: Offer, _client: ClientDetails, holdHours: number): Promise<OptionResult> {
    return {
      optionRef: `DEMO-OPT-${offer.yacht.providerYachtId}-${offer.weekStart}`,
      expiresAt: new Date(Date.now() + holdHours * 3_600_000).toISOString(),
    };
  },
  async confirm(optionRef: string) {
    return { bookingRef: optionRef.replace("DEMO-OPT", "DEMO-BKG") };
  },
  async cancel() {
    /* nothing to release */
  },
};
