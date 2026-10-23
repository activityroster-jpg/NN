import "server-only";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/domain/types";
import { toIsoDate } from "@/lib/domain/dates";
import { CURRENCY_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";

export function defaultCurrencyFor(country: string | null): Currency {
  if (country === "GB" || country === "IM" || country === "JE" || country === "GG") return "GBP";
  if (country === "US" || country === "VG" || country === "VI" || country === "PR") return "USD";
  return "EUR";
}

/** The visitor's display currency: their choice, else a guess from their country. */
export async function displayCurrency(): Promise<Currency> {
  const c = (await cookies()).get(CURRENCY_COOKIE)?.value;
  if (c && (CURRENCIES as readonly string[]).includes(c)) return c as Currency;
  return defaultCurrencyFor((await headers()).get("cf-ipcountry"));
}

export async function requireLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
