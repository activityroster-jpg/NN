import type { Offer, ProviderId } from "@/lib/domain/types";

export interface SearchQuery {
  destinationId: string;
  /** ISO date of the check-in day (normally a Saturday). */
  weekStart: string;
  nights: number;
  /** Provider base ids mapped to this destination in the admin. */
  baseIds: string[];
}

export interface ClientDetails {
  name: string;
  email: string;
  phone: string;
  country: string;
}

export interface OptionResult {
  /** Provider's id for the option, needed to confirm or cancel it. */
  optionRef: string;
  /** ISO timestamp when the provider releases the option. */
  expiresAt: string;
}

/** One booking manager. Every method maps to the provider's own API. */
export interface CharterProvider {
  id: ProviderId;
  label: string;
  search(q: SearchQuery): Promise<Offer[]>;
  /** A fresh offer for one yacht and week, or null when it is no longer available. */
  getOffer(providerYachtId: string, weekStart: string, nights: number): Promise<Offer | null>;
  /** Hold the yacht for the customer (an "option"). */
  createOption(offer: Offer, client: ClientDetails, holdHours: number): Promise<OptionResult>;
  /** Turn a held option into a confirmed booking with the operator. */
  confirm(optionRef: string): Promise<{ bookingRef: string }>;
  cancel(optionRef: string): Promise<void>;
}

export class ProviderError extends Error {
  constructor(
    public readonly provider: ProviderId,
    message: string,
    public readonly status?: number,
  ) {
    super(`[${provider}] ${message}`);
  }
}
