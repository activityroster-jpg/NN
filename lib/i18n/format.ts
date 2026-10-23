import { formatMoney } from "@/lib/domain/money";
import type { Currency } from "@/lib/domain/types";
import { INTL_LOCALE, type Locale } from "./config";

/** Replace {name} placeholders. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in values ? String(values[k]) : `{${k}}`));
}

export function money(amount: number, currency: Currency, locale: Locale, exact = false): string {
  return formatMoney(amount, currency, INTL_LOCALE[locale], { exact });
}

export function dateLong(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export function dateShort(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export function monthName(month: number, locale: Locale, style: "long" | "short" = "long"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: style, timeZone: "UTC" }).format(new Date(Date.UTC(2027, month - 1, 1)));
}

export function weekRange(startIso: string, endIso: string, locale: Locale): string {
  return `${dateShort(startIso, locale)} – ${dateLong(endIso, locale)}`;
}
