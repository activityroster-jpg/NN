import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IconCheck, IconClock, IconInfo } from "@/components/Icons";
import { YachtImage } from "@/components/YachtImage";
import { PriceSummary } from "@/components/yacht/PriceSummary";
import { convertHold, payByCard } from "@/lib/actions/booking";
import { getDb } from "@/lib/db";
import type { Quote } from "@/lib/domain/pricing";
import type { Currency, Yacht } from "@/lib/domain/types";
import { getEnvAsync } from "@/lib/env";
import { getRates } from "@/lib/fx";
import { getDictionary } from "@/lib/i18n";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { dateLong, fmt, money, weekRange } from "@/lib/i18n/format";
import { displayCurrency, requireLocale } from "@/lib/request";
import { loadBookingForCustomer, paymentsFor } from "@/lib/services/bookings";
import { getSettings } from "@/lib/settings";
import { stripeEnabled } from "@/lib/stripe";

type Props = { params: Promise<{ locale: string; ref: string }>; searchParams: Promise<Record<string, string | undefined>> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function BookingPage({ params, searchParams }: Props) {
  const locale = await requireLocale(params.then((p) => ({ locale: p.locale })));
  const { ref } = await params;
  const sp = await searchParams;
  const token = sp.t ?? "";
  const t = getDictionary(locale);
  const db = await getDb();
  const b = await loadBookingForCustomer(db, ref, token);
  if (!b) notFound();
  const env = await getEnvAsync();
  const settings = await getSettings(db);
  const payments = await paymentsFor(db, b.id);
  const q = b.quoteSnapshot as Quote;
  const y = b.yachtSnapshot as Yacht;
  const display = await displayCurrency();
  const rates = await getRates(db);
  const cardOk = stripeEnabled(env) && settings.cardPaymentsEnabled;
  const bank = settings.bank;
  const hasBank = !!(bank.iban || bank.accountNumber);
  const nextDue = payments.find((p) => p.status === "pending");
  const expires = b.holdExpiresAt
    ? new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(b.holdExpiresAt)) + " UTC"
    : "";

  const status: Record<string, string> = {
    hold: fmt(t.booking.statusHold, { time: expires }),
    awaiting_payment: t.booking.statusAwaiting,
    paid_deposit: t.booking.statusPaid,
    confirmed: t.booking.statusConfirmed,
    completed: t.booking.statusCompleted,
    cancelled: t.booking.statusCancelled,
    expired: t.booking.statusExpired,
  };
  const tone = b.status === "confirmed" || b.status === "completed" ? "bg-ok/12 text-ok" : b.status === "cancelled" || b.status === "expired" ? "bg-danger/10 text-danger" : "bg-warn/12 text-warn";
  const hidden = { ref: b.ref, t: token, locale };

  return (
    <div className="container-page py-10">
      <p className="text-sm text-muted">{t.booking.keepLink}</p>
      <h1 className="h-display mt-2 text-4xl">{fmt(t.booking.title, { ref: b.ref })}</h1>
      <p className={`badge mt-3 gap-1.5 px-3 py-1 text-sm ${tone}`}>
        {b.status === "confirmed" ? <IconCheck className="h-4 w-4" /> : <IconClock className="h-4 w-4" />}
        {status[b.status] ?? b.status}
      </p>
      {sp.paid && <p className="mt-4 rounded-xl bg-ok/10 p-3 text-sm text-ok">{t.booking.cardDone}</p>}
      {sp.cancelled && <p className="mt-4 rounded-xl bg-warn/10 p-3 text-sm">{t.booking.cardCancelled}</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {b.status === "hold" && (
            <section className="card p-5">
              <p className="mb-4 text-ink/80">{t.booking.holdExplain}</p>
              <form action={convertHold} className="flex flex-wrap gap-3">
                {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
                <button name="method" value="bank" className="btn-primary">{t.booking.bookIt} · {t.book.payBank}</button>
                {cardOk && <button name="method" value="card" className="btn-secondary">{t.booking.bookIt} · {t.book.payCard}</button>}
              </form>
            </section>
          )}

          {nextDue && b.status !== "hold" && b.status !== "cancelled" && b.status !== "expired" && (
            <section className="card space-y-4 p-5">
              <h2 className="text-lg font-semibold">{t.booking.bankTitle}</h2>
              {hasBank ? (
                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {[
                    [t.booking.bankAmount, money(nextDue.amount, nextDue.currency as Currency, locale, true)],
                    [t.booking.bankRef, b.ref],
                    [t.booking.accountName, bank.accountName],
                    [t.booking.bankName, bank.bankName],
                    [t.booking.iban, bank.iban],
                    [t.booking.bic, bank.bic],
                    [t.booking.sortCode, bank.sortCode],
                    [t.booking.accountNumber, bank.accountNumber],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="border-b border-line pb-2">
                        <dt className="text-muted">{k}</dt>
                        <dd className="font-mono font-medium break-all">{v}</dd>
                      </div>
                    ))}
                </dl>
              ) : (
                <p className="flex gap-2 text-sm"><IconInfo className="mt-0.5 h-4 w-4 text-warn" />{t.booking.bankDetailsSoon}</p>
              )}
              {cardOk && (
                <form action={payByCard}>
                  {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
                  <input type="hidden" name="paymentId" value={nextDue.id} />
                  <button className="btn-secondary">{fmt(t.booking.payNow, { amount: money(q.schedule.find((s) => s.kind === nextDue.kind)?.amount ?? nextDue.amount, nextDue.currency as Currency, locale) })}</button>
                </form>
              )}
            </section>
          )}

          {payments.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 text-lg font-semibold">{t.booking.schedule}</h2>
              <ul className="divide-y divide-line text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <span>{p.kind === "deposit" ? t.yacht.depositNow.split(" ")[0] : p.kind === "balance" ? t.yacht.balanceBy.split(" ")[0] : t.yacht.fullNow}</span>
                    <span className="text-muted">{p.status === "paid" ? t.booking.paid : fmt(t.booking.due, { date: dateLong(p.dueDate, locale) })}</span>
                    <span className="font-medium">{money(p.amount, p.currency as Currency, locale, true)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="text-sm text-muted">{fmt(t.booking.questions, { email: settings.contact.email })}</p>
        </div>

        <aside>
          <div className="card overflow-hidden">
            <div className="aspect-[16/9] bg-surface-2"><YachtImage yacht={y} /></div>
            <div className="p-5">
              <h2 className="text-lg font-semibold">{y.model} · “{y.name}”</h2>
              <p className="text-sm text-muted">{y.base.name} · {b.operatorName}</p>
              <p className="mt-1 text-sm">{weekRange(b.weekStart, b.weekEnd, locale)} · {fmt(t.common.guestsCount, { n: b.guests })}</p>
              <div className="mt-4"><PriceSummary q={q} t={t} locale={locale} display={display} rates={rates} showSchedule={payments.length === 0} /></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
