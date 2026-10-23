import { CURRENCIES, type Currency } from "@/lib/domain/types";
import { FALLBACK_FX, type FxRates } from "@/lib/domain/money";
import type { Db } from "@/lib/db";
import { fxRate } from "@/lib/db/schema";

// Display-only conversion between EUR, GBP and USD using the ECB daily
// reference rates. Customers are always charged in the operator's currency,
// so we carry no exchange risk; converted prices are shown as approximate.

const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const MAX_AGE_MS = 24 * 3_600_000;

export async function getRates(db: Db): Promise<FxRates> {
  try {
    const rows = await db.select().from(fxRate).all();
    const rates: FxRates = { ...FALLBACK_FX };
    for (const r of rows) if ((CURRENCIES as readonly string[]).includes(r.currency)) rates[r.currency as Currency] = r.perEur;
    return rates;
  } catch {
    return FALLBACK_FX;
  }
}

export function parseEcbXml(xml: string): Partial<FxRates> {
  const out: Partial<FxRates> = {};
  for (const m of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)) {
    const [, ccy, rate] = m;
    if (ccy && rate && (CURRENCIES as readonly string[]).includes(ccy)) out[ccy as Currency] = Number(rate);
  }
  return out;
}

/** Refresh when older than a day. Called from the hourly cron. */
export async function refreshRates(db: Db): Promise<boolean> {
  const rows = await db.select().from(fxRate).all();
  const fresh = rows.length >= 2 && rows.every((r) => Date.now() - Date.parse(r.fetchedAt) < MAX_AGE_MS);
  if (fresh) return false;
  const res = await fetch(ECB_URL, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return false;
  const parsed = parseEcbXml(await res.text());
  const at = new Date().toISOString();
  for (const [ccy, perEur] of Object.entries(parsed)) {
    await db
      .insert(fxRate)
      .values({ currency: ccy, perEur, fetchedAt: at })
      .onConflictDoUpdate({ target: fxRate.currency, set: { perEur, fetchedAt: at } });
  }
  return Object.keys(parsed).length > 0;
}
