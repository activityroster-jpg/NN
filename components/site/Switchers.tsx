"use client";

import { usePathname, useRouter } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/domain/types";
import { CURRENCY_COOKIE, LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        className="cursor-pointer appearance-none rounded-full border border-line bg-card py-1.5 pr-7 pl-3 text-sm font-medium"
        value={locale}
        onChange={(e) => {
          const next = e.target.value;
          const rest = pathname.split("/").slice(2).join("/");
          const qs = typeof window !== "undefined" ? window.location.search : "";
          router.push(`/${next}${rest ? `/${rest}` : ""}${qs}`);
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()} · {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-xs text-muted">▾</span>
    </label>
  );
}

export function CurrencySwitcher({ currency, label }: { currency: Currency; label: string }) {
  const router = useRouter();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        className="cursor-pointer appearance-none rounded-full border border-line bg-card py-1.5 pr-7 pl-3 text-sm font-medium"
        value={currency}
        onChange={(e) => {
          document.cookie = `${CURRENCY_COOKIE}=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c === "EUR" ? "€ EUR" : c === "GBP" ? "£ GBP" : "$ USD"}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-xs text-muted">▾</span>
    </label>
  );
}
