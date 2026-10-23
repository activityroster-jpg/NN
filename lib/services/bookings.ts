import { and, asc, eq } from "drizzle-orm";
import { audit } from "@/lib/audit";
import { randomId, safeEqual, sha256Hex } from "@/lib/crypto";
import type { Db } from "@/lib/db";
import { booking, payment, payout } from "@/lib/db/schema";
import { addDays } from "@/lib/domain/dates";
import type { Quote } from "@/lib/domain/pricing";
import type { Yacht } from "@/lib/domain/types";
import { EMAIL_FOOTER, layout, sendMail } from "@/lib/email/send";
import { siteUrl, type AppEnv } from "@/lib/env";
import { providerFor } from "./charter";

export type BookingRow = typeof booking.$inferSelect;
export type PaymentRow = typeof payment.$inferSelect;

export const OPEN_STATUSES = ["hold", "awaiting_payment", "paid_deposit", "confirmed"] as const;

export function bookingLink(env: AppEnv, b: Pick<BookingRow, "ref" | "locale">, token: string): string {
  return `${siteUrl(env)}/${b.locale}/booking/${b.ref}?t=${encodeURIComponent(token)}`;
}

/** Create payment rows from the quote's schedule. The first is due now; later ones default to bank transfer. */
export async function createPayments(db: Db, b: Pick<BookingRow, "id" | "currency">, q: Quote, method: "bank" | "card", bankDiscountPct: number): Promise<PaymentRow[]> {
  // Whole currency units: easier to type into a banking app.
  const factor = method === "bank" ? 1 - bankDiscountPct / 100 : 1;
  const rows: PaymentRow[] = [];
  for (const [i, step] of q.schedule.entries()) {
    const row = {
      id: randomId(),
      bookingId: b.id,
      kind: step.kind,
      method: i === 0 ? method : "bank",
      amount: Math.round(step.amount * (i === 0 ? factor : 1 - bankDiscountPct / 100)),
      currency: b.currency,
      dueDate: step.due,
      status: "pending",
      stripeSessionId: null,
      stripePaymentIntent: null,
      paidAt: null,
      reminderSentAt: null,
      createdAt: new Date().toISOString(),
    } satisfies PaymentRow;
    await db.insert(payment).values(row);
    rows.push(row);
  }
  return rows;
}

/**
 * A payment arrived (card webhook or bank transfer marked by the admin).
 * Idempotent: a payment already marked paid is ignored.
 */
export async function recordPayment(
  db: Db,
  env: AppEnv,
  paymentId: string,
  actor: string,
  stripe?: { sessionId?: string; paymentIntent?: string },
): Promise<{ ok: boolean; message: string }> {
  const p = await db.select().from(payment).where(eq(payment.id, paymentId)).get();
  if (!p) return { ok: false, message: "payment not found" };
  if (p.status === "paid") return { ok: true, message: "already paid" };
  const now = new Date().toISOString();
  await db
    .update(payment)
    .set({ status: "paid", paidAt: now, stripeSessionId: stripe?.sessionId ?? p.stripeSessionId, stripePaymentIntent: stripe?.paymentIntent ?? p.stripePaymentIntent })
    .where(and(eq(payment.id, paymentId), eq(payment.status, "pending")));
  await audit(db, actor, "payment_received", "payment", paymentId, { amount: p.amount, currency: p.currency, method: p.method });

  const b = await db.select().from(booking).where(eq(booking.id, p.bookingId)).get();
  if (!b) return { ok: true, message: "paid; booking missing" };

  if (b.status === "awaiting_payment" || b.status === "hold" || b.status === "expired") {
    await db.update(booking).set({ status: "paid_deposit", holdExpiresAt: null, updatedAt: now }).where(eq(booking.id, b.id));
    await confirmWithOperator(db, env, b.id, actor);
  }
  await sendMail(env, {
    to: b.leadEmail,
    subject: `Payment received · ${b.ref}`,
    ...layout(
      "Thank you, payment received",
      [`Hi ${b.leadName.split(" ")[0]},`, `We've received your payment of ${p.currency} ${p.amount.toFixed(2)} for booking ${b.ref}.`, "We'll be in touch with everything you need before you sail."],
      undefined,
      EMAIL_FOOTER,
    ),
  });
  return { ok: true, message: "paid" };
}

/** Ask the booking manager to turn the option into a confirmed booking, and create the payouts we owe. */
export async function confirmWithOperator(db: Db, env: AppEnv, bookingId: string, actor: string): Promise<boolean> {
  const b = await db.select().from(booking).where(eq(booking.id, bookingId)).get();
  if (!b || b.status === "confirmed") return !!b;
  const provider = await providerFor(env, db, b.provider);
  let bookingRef: string | null = null;
  try {
    if (provider && b.providerOptionRef) bookingRef = (await provider.confirm(b.providerOptionRef)).bookingRef;
  } catch (e) {
    console.error("operator confirm failed", b.ref, e);
    await audit(db, actor, "operator_confirm_failed", "booking", b.id, { error: String(e) });
    await sendMail(env, {
      to: "info@nauticalnomads.com",
      subject: `ACTION: confirm ${b.ref} with ${b.operatorName} manually`,
      ...layout("Operator confirmation failed", [`Booking ${b.ref} is paid but the booking manager refused the confirmation.`, String(e)], { label: "Open booking", href: `${siteUrl(env)}/admin/bookings/${b.id}` }),
    });
    return false;
  }
  if (!bookingRef) return false;
  const now = new Date().toISOString();
  await db.update(booking).set({ status: "confirmed", providerBookingRef: bookingRef, updatedAt: now }).where(eq(booking.id, b.id));
  const q = b.quoteSnapshot as Quote;
  const existing = await db.select().from(payout).where(eq(payout.bookingId, b.id)).all();
  if (existing.length === 0) {
    // What we owe the operator, split like the customer's schedule: the same
    // share as the customer's first payment now, the rest a week after the
    // customer's balance date (our balance deadline sits at least a week ahead of the operator's).
    const first = q.schedule[0];
    const balance = q.schedule.find((s) => s.kind === "balance");
    if (first && balance) {
      const share = Math.round(((q.payout * first.amount) / q.total) * 100) / 100;
      await db.insert(payout).values({ id: randomId(), bookingId: b.id, payee: b.operatorName, payeeKind: "operator", amount: share, currency: b.currency, dueDate: now.slice(0, 10) });
      await db.insert(payout).values({ id: randomId(), bookingId: b.id, payee: b.operatorName, payeeKind: "operator", amount: Math.round((q.payout - share) * 100) / 100, currency: b.currency, dueDate: addDays(balance.due, 7) });
    } else {
      await db.insert(payout).values({ id: randomId(), bookingId: b.id, payee: b.operatorName, payeeKind: "operator", amount: q.payout, currency: b.currency, dueDate: now.slice(0, 10) });
    }
    for (const line of q.lines.filter((l) => l.source === "pool")) {
      await db.insert(payout).values({ id: randomId(), bookingId: b.id, payee: `Crew: ${line.label}`, payeeKind: "crew", amount: line.amount, currency: b.currency, dueDate: b.weekEnd });
    }
  }
  await audit(db, actor, "confirmed", "booking", b.id, { bookingRef });
  const y = b.yachtSnapshot as Yacht;
  await sendMail(env, {
    to: b.leadEmail,
    subject: `Confirmed: ${y.model} · ${b.ref}`,
    ...layout(
      "Your charter is confirmed",
      [
        `Hi ${b.leadName.split(" ")[0]},`,
        `Great news: ${b.operatorName} has confirmed your charter of ${y.model} "${y.name}" from ${b.weekStart} to ${b.weekEnd} at ${y.base.name}.`,
        "We'll send check-in details and a packing list closer to the date.",
      ],
      undefined,
      EMAIL_FOOTER,
    ),
  });
  return true;
}

export async function paymentsFor(db: Db, bookingId: string): Promise<PaymentRow[]> {
  return db.select().from(payment).where(eq(payment.bookingId, bookingId)).orderBy(asc(payment.dueDate)).all();
}

/** The customer's view of a booking: needs the reference and the secret from their link. */
export async function loadBookingForCustomer(db: Db, ref: string, token: string): Promise<BookingRow | null> {
  const b = await db.select().from(booking).where(eq(booking.ref, ref)).get();
  if (!b || !token || !safeEqual(b.accessHash, await sha256Hex(token))) return null;
  return b;
}
