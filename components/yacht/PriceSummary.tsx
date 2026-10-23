import { Price } from "@/components/Price";
import type { FxRates } from "@/lib/domain/money";
import type { Quote } from "@/lib/domain/pricing";
import type { Currency } from "@/lib/domain/types";
import type { Locale } from "@/lib/i18n/config";
import { dateLong, fmt, money } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n";

export function PriceSummary({ q, t, locale, display, rates, showSchedule = true }: { q: Quote; t: Dictionary; locale: Locale; display: Currency; rates: FxRates; showSchedule?: boolean }) {
  const atBase = q.payAtBase.reduce((s, l) => s + l.amount, 0);
  return (
    <div className="space-y-4">
      <dl className="space-y-1.5 text-sm">
        {q.lines.map((l, i) => (
          <div key={i} className="flex justify-between gap-3">
            <dt className="text-ink/80">{l.label}</dt>
            <dd className="font-medium">{money(l.amount, q.currency, locale)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-end justify-between border-t border-line pt-3">
        <span className="font-semibold">{t.common.total}</span>
        <Price amount={q.total} currency={q.currency} display={display} rates={rates} locale={locale} approxLabel={t.common.approx} className="text-2xl font-semibold" approxClassName="text-right" />
      </div>
      {q.bankDiscountPct > 0 && <p className="text-xs text-ok">{fmt(t.yacht.bankPrice, { price: money(q.bankTotal, q.currency, locale) })}</p>}
      {atBase > 0 && (
        <div className="rounded-xl bg-surface-2/70 p-3 text-sm">
          <p className="font-medium">{t.yacht.payAtBaseTitle}</p>
          <p className="mb-2 text-xs text-muted">{t.yacht.payAtBaseHelp}</p>
          <dl className="space-y-1">
            {q.payAtBase.map((l, i) => (
              <div key={i} className="flex justify-between gap-3">
                <dt className="text-ink/80">{l.label}</dt>
                <dd>{money(l.amount, q.currency, locale)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {showSchedule && (
        <div className="text-sm">
          <p className="mb-1 font-medium">{t.yacht.payments}</p>
          <ul className="space-y-1 text-ink/80">
            {q.schedule.map((s, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{s.kind === "deposit" ? t.yacht.depositNow : s.kind === "full" ? t.yacht.fullNow : fmt(t.yacht.balanceBy, { date: dateLong(s.due, locale) })}</span>
                <span className="font-medium">{money(s.amount, q.currency, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
