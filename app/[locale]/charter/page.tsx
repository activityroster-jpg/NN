import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoBanner } from "@/components/DemoBanner";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { IconCalendar, IconChef, IconHelm, IconPin, IconUsers } from "@/components/Icons";
import { CompareProvider, CompareTray } from "@/components/results/Compare";
import { Filters, SortSelect } from "@/components/results/Filters";
import { YachtCard } from "@/components/results/YachtCard";
import { getDb } from "@/lib/db";
import { CATEGORY_IDS } from "@/lib/domain/categories";
import { addDays } from "@/lib/domain/dates";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { filterOffers, sortOffers } from "@/lib/domain/offers";
import { guestCapacity } from "@/lib/domain/pricing";
import { getEnvAsync } from "@/lib/env";
import { getDictionary } from "@/lib/i18n";
import { fmt, weekRange } from "@/lib/i18n/format";
import { displayCurrency, requireLocale, todayIso } from "@/lib/request";
import { loadPricingContext, priceOffer, registerOperators, searchOffers } from "@/lib/services/charter";
import { destinationView } from "@/lib/services/destination-settings";
import { categoryName, destinationName, destinationOptions, enquiryText, extraLabels } from "@/lib/services/labels";
import { parseSearch, tripQuery } from "@/lib/search/params";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const t = getDictionary(await requireLocale(params));
  const p = parseSearch(await searchParams);
  return { title: p ? fmt(t.results.title, { destination: destinationName(t, p.d) }) : t.plan.title, robots: { index: false } };
}

export default async function CharterResults({ params, searchParams }: Props) {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  const p = parseSearch(await searchParams);
  if (!p) redirect(`/${locale}/plan`);

  const env = await getEnvAsync();
  const db = await getDb();
  const display = await displayCurrency();
  const dest = await destinationView(db, p.d);
  const destName = destinationName(t, p.d);
  const today = todayIso();
  const crewCount = (p.s ? 1 : 0) + (p.c ? 1 : 0);
  const trip = tripQuery(p);
  const editHref = `/${locale}/plan?${new URLSearchParams({ d: p.d, w: p.w, g: String(p.g) }).toString()}`;

  const summary = (
    <div className="card flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
      <span className="flex items-center gap-1.5 font-semibold"><IconPin className="h-4 w-4 text-sea" />{destName}</span>
      <span className="flex items-center gap-1.5"><IconCalendar className="h-4 w-4 text-sea" />{weekRange(p.w, addDays(p.w, 7), locale)}</span>
      <span className="flex items-center gap-1.5"><IconUsers className="h-4 w-4 text-sea" />{fmt(t.common.guestsCount, { n: p.g })}</span>
      {p.s && <span className="flex items-center gap-1.5"><IconHelm className="h-4 w-4 text-sea" />{t.common.skipper}</span>}
      {p.c && <span className="flex items-center gap-1.5"><IconChef className="h-4 w-4 text-sea" />{t.common.chef}</span>}
      <Link href={editHref} className="ml-auto font-semibold text-brand underline">{t.common.edit}</Link>
    </div>
  );

  const enquiry = (
    <EnquiryForm
      text={enquiryText(t)}
      destinations={destinationOptions(t, DESTINATION_IDS)}
      locale={locale}
      currency={display}
      defaults={{ destinationId: p.d, weekStart: p.w, guests: p.g, skipper: p.s ? "yes" : "no", chef: p.c, sourcePath: `/${locale}/charter` }}
    />
  );

  if (!dest || !dest.active || dest.mode === "enquiry") {
    return (
      <div className="container-page py-8">
        {summary}
        <h1 className="h-display mt-8 text-4xl">{fmt(t.results.title, { destination: destName })}</h1>
        <p className="mt-2 mb-6 max-w-2xl text-ink/75">{fmt(t.results.enquiryOnly, { destination: destName })}</p>
        {enquiry}
      </div>
    );
  }

  const ctx = await loadPricingContext(db);
  const result = await searchOffers(env, db, ctx, p.d, p.w);
  await registerOperators(db, result.offers).catch((e) => console.error("registerOperators", e));
  const labels = extraLabels(t);
  const selections = { guests: p.g, skipper: p.s, chef: p.c, hostess: false, provisioning: false, damageWaiver: false };
  const priced = new Map(result.offers.map((o) => [o.yacht.key, priceOffer(o, ctx, selections, today, labels)]));
  const priceOf = (o: (typeof result.offers)[number]) => priced.get(o.yacht.key)!.total;
  const filtered = filterOffers(
    result.offers,
    { kind: p.type, categoryId: p.cat, airCon: p.ac, minCabins: p.cabins, minLengthFt: p.len, minYear: p.year, maxPrice: p.max, guests: p.g, crewCount },
    priceOf,
  );
  const sorted = sortOffers(filtered, p.sort ?? "recommended", priceOf, Number(today.slice(0, 4)));
  const filterText = { ...t.results, monohull: t.common.monohull, catamaran: t.common.catamaran };
  const categories = CATEGORY_IDS.map((id) => ({ id, name: categoryName(t, id) ?? id }));
  const symbol = result.offers[0]?.currency === "USD" ? "$" : "€";

  return (
    <CompareProvider scope={`${p.d}|${p.w}`}>
      <div className="container-page py-8 pb-28">
        {summary}
        {result.demo && (
          <div className="mt-4">
            <DemoBanner text={t.common.demoNotice} />
          </div>
        )}
        {result.failed.length > 0 && <p className="mt-3 text-sm text-warn">{t.results.partial}</p>}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="h-display text-4xl">{fmt(t.results.title, { destination: destName })}</h1>
            <p className="mt-1 text-sm text-muted">{sorted.length === 1 ? t.results.foundOne : fmt(t.results.found, { n: sorted.length })}</p>
          </div>
          <SortSelect text={filterText} />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside>
            <Filters text={filterText} categories={categories} currencySymbol={symbol} />
          </aside>
          <div>
            {sorted.length === 0 ? (
              <div>
                <h2 className="text-xl font-semibold">{t.results.noneTitle}</h2>
                <p className="mt-1 mb-6 text-ink/75">{t.results.noneText}</p>
                {enquiry}
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {sorted.map((o, i) => (
                    <YachtCard
                      key={o.yacht.key}
                      offer={o}
                      q={priced.get(o.yacht.key)!}
                      href={`/${locale}/yacht/${encodeURIComponent(o.yacht.key)}?${trip.toString()}`}
                      locale={locale}
                      t={t}
                      display={display}
                      rates={ctx.rates}
                      capacity={guestCapacity(o.yacht, crewCount)}
                      eager={i < 3}
                    />
                  ))}
                </div>
                <p className="mt-6 text-xs text-muted">{fmt(t.common.chargedIn, { currency: result.offers[0]?.currency ?? "EUR" })}</p>
                <div className="mt-12">
                  <h2 className="text-xl font-semibold">{t.home.ctaTitle}</h2>
                  <p className="mt-1 mb-4 text-ink/75">{t.home.ctaText}</p>
                  {enquiry}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <CompareTray href={`/${locale}/compare?${trip.toString()}`} labelCompare={t.results.compareNow} hint={t.results.compareHint} clearLabel={t.common.clear} />
    </CompareProvider>
  );
}
