import { BOOKING_RETIRED } from "@/lib/flags";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoBanner } from "@/components/DemoBanner";
import { Price } from "@/components/Price";
import { YachtImage } from "@/components/YachtImage";
import { getDb } from "@/lib/db";
import { guestCapacity } from "@/lib/domain/pricing";
import type { Offer } from "@/lib/domain/types";
import { getEnvAsync } from "@/lib/env";
import { getDictionary } from "@/lib/i18n";
import { fmt, money } from "@/lib/i18n/format";
import { displayCurrency, requireLocale, todayIso } from "@/lib/request";
import { findOffer, loadPricingContext, priceOffer } from "@/lib/services/charter";
import { categoryName, extraLabels } from "@/lib/services/labels";
import { crewCount, parseTrip, selectionsOf, tripParams } from "@/lib/search/trip";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary(await requireLocale(params));
  return { title: t.compare.title, robots: { index: false } };
}

export default async function ComparePage({ params, searchParams }: Props) {
  if (BOOKING_RETIRED) redirect(`/${(await params).locale}/plan`);
  const locale = await requireLocale(params);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const trip = parseTrip(sp);
  if (!trip) redirect(`/${locale}/plan`);
  const keys = (typeof sp.y === "string" ? sp.y : "").split(",").filter(Boolean).slice(0, 3);
  const backHref = `/${locale}/charter?${tripParams(trip).toString()}`;

  const env = await getEnvAsync();
  const db = await getDb();
  const display = await displayCurrency();
  const ctx = await loadPricingContext(db);
  const found = await Promise.all(keys.map((k) => findOffer(env, db, k, trip.w)));
  const offers = found.map((f) => f.offer).filter((o): o is Offer => !!o);
  const demo = found.some((f) => f.demo);
  const today = todayIso();
  const labels = extraLabels(t);
  const rows = offers.map((o) => ({ o, q: priceOffer(o, ctx, selectionsOf(trip), today, labels) }));

  if (rows.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="h-display text-3xl">{t.compare.title}</h1>
        <p className="mt-3 text-ink/75">{t.compare.empty}</p>
        <Link href={backHref} className="btn-primary mt-6">{t.common.back}</Link>
      </div>
    );
  }

  const yes = <span className="font-semibold text-ok">✓</span>;
  const no = <span className="text-muted">—</span>;
  const cells: [string, (r: (typeof rows)[number]) => React.ReactNode][] = [
    [t.results.category, (r) => categoryName(t, r.q.categoryId) ?? "—"],
    [t.common.year, (r) => r.o.yacht.year],
    [t.common.length, (r) => fmt(t.common.lengthFt, { n: r.o.yacht.lengthFt })],
    [t.common.cabins, (r) => r.o.yacht.cabins],
    [t.common.heads, (r) => r.o.yacht.heads],
    [t.compare.rowCapacity, (r) => guestCapacity(r.o.yacht, crewCount(trip))],
    [t.common.airCon, (r) => (r.o.yacht.airCon ? yes : no)],
    [t.common.watermaker, (r) => (r.o.yacht.watermaker ? yes : no)],
    [t.common.generator, (r) => (r.o.yacht.generator ? yes : no)],
    [t.common.base, (r) => r.o.yacht.base.name],
    [t.common.operator, (r) => r.o.yacht.operatorName],
    [t.extras.charter, (r) => money(r.q.charter, r.q.currency, locale)],
    [t.common.skipper, (r) => { const l = r.q.lines.find((x) => x.code === "skipper"); return l ? money(l.amount, r.q.currency, locale) : trip.s ? t.results.crewOnRequest.replace("{crew}", t.common.skipper) : no; }],
    [t.common.chef, (r) => { const l = r.q.lines.find((x) => x.code === "chef"); return l ? money(l.amount, r.q.currency, locale) : trip.c ? t.results.crewOnRequest.replace("{crew}", t.common.chef) : no; }],
    [t.yacht.payAtBaseTitle, (r) => { const s = r.q.payAtBase.reduce((a, l) => a + l.amount, 0); return s ? money(s, r.q.currency, locale) : no; }],
    [t.compare.rowPrice, (r) => <Price amount={r.q.total} currency={r.q.currency} display={display} rates={ctx.rates} locale={locale} approxLabel={t.common.approx} className="text-lg font-semibold" />],
    [t.compare.rowPerPerson, (r) => money(r.q.perPerson, r.q.currency, locale)],
    [t.compare.rowDeposit, (r) => money(r.q.schedule[0]?.amount ?? 0, r.q.currency, locale)],
  ];
  const cheapest = Math.min(...rows.map((r) => r.q.total));

  return (
    <div className="container-page py-8">
      <Link href={backHref} className="text-sm font-semibold text-brand hover:underline">← {t.common.back}</Link>
      <h1 className="h-display mt-3 text-4xl">{t.compare.title}</h1>
      {demo && <div className="mt-4"><DemoBanner text={t.common.demoNotice} /></div>}
      <div className="-mx-4 mt-8 overflow-x-auto px-4">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-44" />
              {rows.map((r) => (
                <th key={r.o.yacht.key} className="px-3 pb-4 text-left align-top font-normal">
                  <div className="aspect-[16/10] overflow-hidden rounded-xl bg-surface-2"><YachtImage yacht={r.o.yacht} /></div>
                  <p className="mt-2 text-base font-semibold">{r.o.yacht.model}</p>
                  <p className="text-muted">“{r.o.yacht.name}”</p>
                  {r.q.total === cheapest && rows.length > 1 && <span className="badge mt-1 bg-ok/12 text-ok">{t.results.sortPrice}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map(([label, render]) => (
              <tr key={label}>
                <th scope="row" className="border-t border-line py-2.5 pr-3 text-left font-medium text-muted">{label}</th>
                {rows.map((r) => (
                  <td key={r.o.yacht.key} className="border-t border-line px-3 py-2.5">{render(r)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td />
              {rows.map((r) => (
                <td key={r.o.yacht.key} className="px-3 pt-4">
                  <Link href={`/${locale}/yacht/${encodeURIComponent(r.o.yacht.key)}?${tripParams(trip).toString()}`} className="btn-primary w-full px-4 py-2.5 text-sm">{t.compare.choose}</Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
