import { BOOKING_RETIRED } from "@/lib/flags";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookForm } from "@/components/book/BookForm";
import { DemoBanner } from "@/components/DemoBanner";
import { YachtImage } from "@/components/YachtImage";
import { PriceSummary } from "@/components/yacht/PriceSummary";
import { getDb } from "@/lib/db";
import { addDays } from "@/lib/domain/dates";
import { getEnvAsync } from "@/lib/env";
import { getDictionary } from "@/lib/i18n";
import { fmt, money, weekRange } from "@/lib/i18n/format";
import { displayCurrency, requireLocale, todayIso } from "@/lib/request";
import { findOffer, loadPricingContext, priceOffer } from "@/lib/services/charter";
import { categoryName, extraLabels } from "@/lib/services/labels";
import { stripeEnabled } from "@/lib/stripe";
import { parseTrip, selectionsOf, tripParams } from "@/lib/search/trip";

type Props = { params: Promise<{ locale: string; key: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary(await requireLocale(params.then((p) => ({ locale: p.locale }))));
  return { title: t.book.titleBook, robots: { index: false } };
}

export default async function BookPage({ params, searchParams }: Props) {
  if (BOOKING_RETIRED) redirect(`/${(await params).locale}/plan`);
  const locale = await requireLocale(params.then((p) => ({ locale: p.locale })));
  const key = decodeURIComponent((await params).key);
  const sp = await searchParams;
  const t = getDictionary(locale);
  const trip = parseTrip(sp);
  if (!trip) redirect(`/${locale}/plan`);
  const mode = sp.mode === "hold" ? "hold" : "book";

  const env = await getEnvAsync();
  const db = await getDb();
  const display = await displayCurrency();
  const { offer, demo } = await findOffer(env, db, key, trip.w);
  const yachtHref = `/${locale}/yacht/${encodeURIComponent(key)}?${tripParams(trip).toString()}`;
  if (!offer) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="h-display text-3xl">{t.yacht.notAvailable}</h1>
        <Link href={`/${locale}/charter?${tripParams(trip).toString()}`} className="btn-primary mt-6">{t.yacht.otherWeeks}</Link>
      </div>
    );
  }
  const ctx = await loadPricingContext(db);
  const q = priceOffer(offer, ctx, selectionsOf(trip), todayIso(), extraLabels(t));
  const y = offer.yacht;
  const hidden: Record<string, string> = { key, mode, locale, ...Object.fromEntries(tripParams(trip).entries()) };
  const first = q.schedule[0]!;
  const cardAvailable = stripeEnabled(env) && ctx.settings.cardPaymentsEnabled;

  return (
    <div className="container-page py-8">
      <Link href={yachtHref} className="text-sm font-semibold text-brand hover:underline">← {y.model}</Link>
      <h1 className="h-display mt-3 text-4xl">{mode === "hold" ? t.book.titleHold : t.book.titleBook}</h1>
      {demo && <div className="mt-4"><DemoBanner text={t.common.demoNotice} /></div>}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <BookForm
          text={{ ...t.book, skipperRequired: t.yacht.skipperRequired }}
          mode={mode}
          hidden={hidden}
          withSkipper={trip.s}
          cardAvailable={cardAvailable}
          termsHref={`/${locale}/legal/booking-conditions`}
          bankDiscount={ctx.settings.bankDiscountPct}
          bankPrice={money(Math.round(first.amount * (1 - ctx.settings.bankDiscountPct / 100)), q.currency, locale)}
          cardPrice={money(first.amount, q.currency, locale)}
        />
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="aspect-[16/9] bg-surface-2"><YachtImage yacht={y} /></div>
            <div className="p-5">
              <p className="text-xs font-semibold tracking-wider text-muted uppercase">{t.book.summary}</p>
              <h2 className="mt-1 text-lg font-semibold">{y.model} · “{y.name}”</h2>
              <p className="text-sm text-muted">{categoryName(t, q.categoryId)} · {y.base.name}</p>
              <p className="mt-1 text-sm">{weekRange(offer.weekStart, addDays(offer.weekStart, 7), locale)} · {fmt(t.common.guestsCount, { n: trip.g })}</p>
              <div className="mt-4"><PriceSummary q={q} t={t} locale={locale} display={display} rates={ctx.rates} /></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
