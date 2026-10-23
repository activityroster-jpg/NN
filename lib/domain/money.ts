import type { Currency } from "./types";

/** Round a customer-facing price up to a whole unit, so displayed totals never undercharge. */
export function ceilUnit(n: number): number {
  return Math.ceil(n - 1e-9);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Rates expressed as units of currency per 1 EUR (ECB convention). */
export type FxRates = Record<Currency, number>;

export const FALLBACK_FX: FxRates = { EUR: 1, GBP: 0.86, USD: 1.08 };

export function convert(amount: number, from: Currency, to: Currency, rates: FxRates): number {
  if (from === to) return amount;
  const inEur = amount / rates[from];
  return inEur * rates[to];
}

export function formatMoney(amount: number, currency: Currency, locale = "en-GB", opts: { exact?: boolean } = {}): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: opts.exact ? 2 : 0,
    minimumFractionDigits: opts.exact ? 2 : 0,
  }).format(amount);
}
