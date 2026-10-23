import Link from "next/link";
import { IconBed, IconPin, IconRuler, IconShower, IconSnow } from "@/components/Icons";
import { Price } from "@/components/Price";
import { YachtImage } from "@/components/YachtImage";
import type { FxRates } from "@/lib/domain/money";
import type { Quote } from "@/lib/domain/pricing";
import type { Currency, Offer } from "@/lib/domain/types";
import type { Locale } from "@/lib/i18n/config";
import { fmt, money } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n";
import { categoryName } from "@/lib/services/labels";
import { CompareToggle } from "./Compare";

export function YachtCard({
  offer,
  q,
  href,
  locale,
  t,
  display,
  rates,
  capacity,
  eager,
}: {
  offer: Offer;
  q: Quote;
  href: string;
  locale: Locale;
  t: Dictionary;
  display: Currency;
  rates: FxRates;
  capacity: number;
  eager?: boolean;
}) {
  const y = offer.yacht;
  const cat = categoryName(t, q.categoryId);
  const atBase = q.payAtBase.reduce((s, l) => s + l.amount, 0);
  const discounted = offer.listPrice > offer.price;
  const crew = q.lines.filter((l) => l.code === "skipper" || l.code === "chef" || l.code === "hostess").map((l) => l.label.toLowerCase());
  const crewLabel = crew.length ? crew.join(" + ") : null;
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:shadow-md">
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-surface-2">
        <YachtImage yacht={y} eager={eager} className="transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {cat && <span className="badge bg-card/95 text-ink shadow-sm">{cat}</span>}
          {y.airCon && (
            <span className="badge gap-1 bg-sea/90 text-white">
              <IconSnow className="h-3 w-3" /> {t.common.ac}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg leading-tight font-semibold">
              <Link href={href} className="hover:underline">
                {y.model}
              </Link>
            </h3>
            <p className="text-sm text-muted">
              “{y.name}” · {fmt(t.common.builtIn, { n: y.year })}
            </p>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-ink/80">
          <li className="flex items-center gap-1.5"><IconRuler className="h-4 w-4 text-muted" />{fmt(t.common.lengthFt, { n: y.lengthFt })}</li>
          <li className="flex items-center gap-1.5"><IconBed className="h-4 w-4 text-muted" />{fmt(t.common.cabinsCount, { n: y.cabins })}</li>
          <li className="flex items-center gap-1.5"><IconShower className="h-4 w-4 text-muted" />{fmt(t.common.headsCount, { n: y.heads })}</li>
          <li className="flex items-center gap-1.5 truncate"><IconPin className="h-4 w-4 shrink-0 text-muted" /><span className="truncate">{y.base.name}</span></li>
        </ul>
        <p className="mt-2 text-xs text-muted">{fmt(t.results.capacity, { n: capacity })}</p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="text-xs text-muted">{t.results.totalWeek}</p>
            <Price amount={q.total} currency={q.currency} display={display} rates={rates} locale={locale} approxLabel={t.common.approx} className="text-2xl font-semibold" />
            {crewLabel && <p className="text-xs text-muted">{fmt(t.results.includesCrew, { crew: crewLabel })}</p>}
            {q.unavailable.length > 0 && <p className="text-xs text-warn">{fmt(t.results.crewOnRequest, { crew: q.unavailable.map((r) => t.common[r]).join(", ") })}</p>}
            {discounted && <p className="text-xs text-ok">{fmt(t.results.wasPrice, { price: money(q.total + Math.ceil((offer.listPrice - offer.price) * (q.charter / offer.price)), q.currency, locale) })}</p>}
            {atBase > 0 && <p className="text-xs text-muted">{fmt(t.results.payAtBase, { price: money(atBase, q.currency, locale) })}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-right text-xs text-muted">
              {money(q.perPerson, q.currency, locale)} {t.common.perPerson}
            </p>
            <Link href={href} className="btn-primary px-4 py-2 text-sm">
              {t.common.viewYacht}
            </Link>
          </div>
        </div>
        <div className="mt-3">
          <CompareToggle yachtKey={y.key} labelAdd={t.results.addCompare} labelOn={t.results.inCompare} />
        </div>
      </div>
    </article>
  );
}
