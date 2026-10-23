import { convert, type FxRates } from "@/lib/domain/money";
import type { Currency } from "@/lib/domain/types";
import { money } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";

/**
 * A price in the charge currency, with the visitor's display currency shown as
 * an approximation when it differs. We never charge in the converted currency.
 */
export function Price({
  amount,
  currency,
  display,
  rates,
  locale,
  approxLabel,
  className = "",
  approxClassName = "",
}: {
  amount: number;
  currency: Currency;
  display: Currency;
  rates: FxRates;
  locale: Locale;
  approxLabel: string;
  className?: string;
  approxClassName?: string;
}) {
  if (display === currency) return <span className={className}>{money(amount, currency, locale)}</span>;
  return (
    <span className="inline-flex flex-col">
      <span className={className}>{money(amount, currency, locale)}</span>
      <span className={`text-xs text-muted ${approxClassName}`}>
        ≈ {money(convert(amount, currency, display, rates), display, locale)} <span className="sr-only">{approxLabel}</span>
      </span>
    </span>
  );
}
