/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoBanner } from "@/components/DemoBanner";
import { IconAnchor, IconBed, IconCheck, IconInfo, IconPin, IconRuler, IconShower, IconSnow, IconUsers } from "@/components/Icons";
import { YachtImage } from "@/components/YachtImage";
import { ExtrasToggles, type ExtraOption } from "@/components/yacht/ExtrasToggles";
import { PriceSummary } from "@/components/yacht/PriceSummary";
import { getDb } from "@/lib/db";
import { addDays } from "@/lib/domain/dates";
import { destinationById } from "@/lib/domain/destinations";
import { guestCapacity } from "@/lib/domain/pricing";
import { getEnvAsync } from "@/lib/env";
import { getDictionary } from "@/lib/i18n";
import { fmt, money, weekRange } from "@/lib/i18n/format";
import { displayCurrency, requireLocale, todayIso } from "@/lib/request";
import { findOffer, loadPricingContext, priceOffer } from "@/lib/services/charter";
import { categoryName, destinationName, extraLabels } from "@/lib/services/labels";
import { crewCount, parseTrip, selectionsOf, tripParams } from "@/lib/search/trip";

type Props = { params: Promise<{ locale: string; key: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  return { title: decodeURIComponent(key).split(":")[0] === "mock" ? "Yacht" : "Yacht", robots: { index: false } };
}

export default async function YachtPage({ params, searchParams }: Props) {
  const locale = await requireLocale(params.then((p) => ({ locale: p.locale })));
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  const t = getDictionary(locale);
  const trip = parseTrip(await searchParams);
  if (!trip) redirect(`/${locale}/plan`);

  const env = await getEnvAsync();
  const db = await getDb();
  const display = await displayCurrency();
  const { offer, demo } = await findOffer(env, db, key, trip.w);
  const backHref = `/${locale}/charter?${new URLSearchParams({ d: trip.d, w: trip.w, g: String(trip.g), s: trip.s ? "1" : "0", c: trip.c ? "1" : "0" }).toString()}`;

  if (!offer) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="h-display text-3xl">{t.yacht.notAvailable}</h1>
        <Link href={backHref} className="btn-primary mt-6">{t.yacht.otherWeeks}</Link>
      </div>
    );
  }

  const ctx = await loadPricingContext(db);
  const q = priceOffer(offer, ctx, selectionsOf(trip), todayIso(), extraLabels(t));
  const y = offer.yacht;
  const dest = destinationById(y.base.destinationId);
  const cat = categoryName(t, q.categoryId);
  const capacity = guestCapacity(y, crewCount(trip));
  const has = (code: string) => offer.extras.find((e) => e.code === code);
  const pool = ctx.crewRates.get(y.base.destinationId) ?? [];
  const crewAvailable = (role: "skipper" | "chef" | "hostess") => !!has(role) || pool.some((r) => r.role === role);
  const priceHint = (code: string) => {
    const e = has(code);
    return e ? `${money(e.price, offer.currency, locale)}${e.unit === "person" ? ` / ${t.common.perPerson}` : ""}` : undefined;
  };

  const options: ExtraOption[] = [
    { key: "s", label: t.common.skipper, help: t.licence.noLicence, price: priceHint("skipper"), disabled: !crewAvailable("skipper") },
    { key: "c", label: t.common.chef, help: t.plan.chefYesHelp, price: priceHint("chef"), disabled: !crewAvailable("chef") },
    { key: "h", label: t.common.hostess, price: priceHint("hostess"), disabled: !crewAvailable("hostess") },
  ];
  if (has("provisioning")) options.push({ key: "pv", label: t.yacht.provisioning, price: priceHint("provisioning") });
  if (has("damage_waiver")) options.push({ key: "dw", label: t.yacht.damageWaiver, help: t.yacht.damageWaiverHelp, price: priceHint("damage_waiver") });

  const tp = tripParams(trip);
  const holdHref = `/${locale}/book/${encodeURIComponent(y.key)}?${tp.toString()}&mode=hold`;
  const bookHref = `/${locale}/book/${encodeURIComponent(y.key)}?${tp.toString()}&mode=book`;
  const specs: [string, string][] = [
    [t.common.length, fmt(t.common.lengthFt, { n: y.lengthFt })],
    [t.common.year, String(y.year)],
    [t.common.cabins, String(y.cabins)],
    [t.common.berths, String(y.berths)],
    [t.common.heads, String(y.heads)],
    [t.common.airCon, y.airCon ? t.common.yes : t.common.no],
    [t.common.watermaker, y.watermaker ? t.common.yes : t.common.no],
    [t.common.generator, y.generator ? t.common.yes : t.common.no],
    [t.common.mainsail, y.mainsail === "furling" ? t.common.furling : y.mainsail === "classic" ? t.common.classic : "—"],
    [t.common.base, y.base.name],
    [t.common.operator, y.operatorName],
  ];

  return (
    <div className="container-page py-8">
      <Link href={backHref} className="text-sm font-semibold text-brand hover:underline">← {fmt(t.results.title, { destination: destinationName(t, trip.d) })}</Link>
      {demo && <div className="mt-4"><DemoBanner text={t.common.demoNotice} /></div>}

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-surface-2">
              <YachtImage yacht={y} eager />
            </div>
            <div className="hidden grid-rows-2 gap-2 sm:grid">
              <div className="overflow-hidden rounded-2xl bg-surface-2"><YachtImage yacht={y} index={1} /></div>
              <div className="overflow-hidden rounded-2xl bg-surface-2"><YachtImage yacht={y} index={2} /></div>
            </div>
          </div>
          {y.provider !== "mock" && <p className="mt-2 text-xs text-muted">{t.yacht.photosComing}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {cat && <span className="badge bg-brand-soft text-ink">{cat}</span>}
            <span className="badge bg-surface-2 text-ink">{y.kind === "catamaran" ? t.common.catamaran : t.common.monohull}</span>
            {y.airCon && <span className="badge gap-1 bg-sea/90 text-white"><IconSnow className="h-3 w-3" />{t.common.airCon}</span>}
          </div>
          <h1 className="h-display mt-3 text-4xl sm:text-5xl">{y.model}</h1>
          <p className="mt-1 text-lg text-muted">“{y.name}” · {fmt(t.common.builtIn, { n: y.year })}</p>

          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [IconRuler, fmt(t.common.lengthFt, { n: y.lengthFt })],
              [IconBed, fmt(t.common.cabinsCount, { n: y.cabins })],
              [IconShower, fmt(t.common.headsCount, { n: y.heads })],
              [IconUsers, fmt(t.results.capacity, { n: capacity })],
            ].map(([Icon, label], i) => {
              const I = Icon as typeof IconRuler;
              return (
                <li key={i} className="card flex items-center gap-2 px-3 py-3 text-sm font-medium">
                  <I className="h-5 w-5 text-sea" /> {label as string}
                </li>
              );
            })}
          </ul>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">{t.yacht.specs}</h2>
            <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line py-2 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {y.equipment.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">{t.yacht.equipment}</h2>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {y.equipment.map((e) => (
                  <li key={e} className="flex items-center gap-2"><IconCheck className="h-4 w-4 text-ok" />{e}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold"><IconAnchor className="h-5 w-5 text-sea" />{t.common.skipper}</h3>
              <p className="mt-2 text-sm text-ink/80">{dest ? t.licence[dest.licenceRule] : t.licence.icc}</p>
              <p className="mt-2 text-sm text-ink/80">{t.licence.noLicence}</p>
            </div>
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-semibold"><IconPin className="h-5 w-5 text-sea" />{t.common.base}</h3>
              <p className="mt-2 text-sm text-ink/80">{y.base.name} · {destinationName(t, y.base.destinationId)}</p>
              {y.securityDeposit && <p className="mt-2 text-sm text-ink/80">{fmt(t.yacht.securityDeposit, { amount: money(y.securityDeposit, offer.currency, locale) })}</p>}
            </div>
          </section>
        </div>

        <aside id="price" className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg font-semibold">{t.yacht.priceTitle}</h2>
            <p className="text-sm text-muted">{fmt(t.yacht.forWeek, { dates: weekRange(offer.weekStart, addDays(offer.weekStart, 7), locale) })}</p>
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">{t.yacht.chooseExtras}</p>
              <ExtrasToggles options={options} guests={trip.g} guestsLabel={t.common.guests} maxGuests={Math.max(1, guestCapacity(y, crewCount(trip)))} />
            </div>
            {q.unavailable.length > 0 && (
              <p className="mt-3 flex gap-2 rounded-xl bg-warn/10 p-3 text-sm"><IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-warn" />{fmt(t.yacht.crewUnavailable, { role: q.unavailable.map((r) => t.common[r]).join(", ") })}</p>
            )}
            {trip.g > capacity && <p className="mt-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">{fmt(t.results.capacity, { n: capacity })}</p>}
            <div className="mt-5">
              <PriceSummary q={q} t={t} locale={locale} display={display} rates={ctx.rates} />
            </div>
            <div className="mt-6 space-y-2">
              <Link href={bookHref} className="btn-primary w-full">{t.yacht.book}</Link>
              <p className="text-center text-xs text-muted">{t.yacht.bookHelp}</p>
              <Link href={holdHref} className="btn-secondary w-full">{t.yacht.hold}</Link>
              <p className="text-center text-xs text-muted">{t.yacht.holdHelp}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">{fmt(t.common.chargedIn, { currency: offer.currency })}</p>
        </aside>
      </div>
      {/* Phones: the price box sits below the details, so keep the total and the next step in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur lg:hidden">
        <div className="container-page flex items-center justify-between gap-3 py-3">
          <a href="#price" className="leading-tight">
            <span className="block text-xs text-muted">{t.results.totalWeek}</span>
            <span className="text-lg font-semibold">{money(q.total, q.currency, locale)}</span>
          </a>
          <div className="flex gap-2">
            <a href="#price" className="btn-secondary px-4 py-2 text-sm">{t.yacht.priceTitle}</a>
            <Link href={bookHref} className="btn-primary px-4 py-2 text-sm">{t.yacht.book}</Link>
          </div>
        </div>
      </div>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
