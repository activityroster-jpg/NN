"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { COMPANY } from "@/lib/brand";
import { bookingRef, randomId, randomToken, sha256Hex, safeEqual } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { booking, payment } from "@/lib/db/schema";
import type { Quote } from "@/lib/domain/pricing";
import { EMAIL_FOOTER, layout, sendMail } from "@/lib/email/send";
import { getEnvAsync, siteUrl } from "@/lib/env";
import { isLocale } from "@/lib/i18n/config";
import { allow } from "@/lib/rate-limit";
import { clientIp, todayIso } from "@/lib/request";
import { findOffer, loadPricingContext, priceOffer, providerFor } from "@/lib/services/charter";
import { bookingLink, createPayments } from "@/lib/services/bookings";
import { createCheckoutSession, stripeEnabled } from "@/lib/stripe";
import { selectionsOf, TripSchema, type Trip } from "@/lib/search/trip";

export interface BookState {
  error?: "invalid" | "unavailable" | "rate" | "skipper" | "server";
  fields?: string[];
}

const Details = z.object({
  key: z.string().min(3).max(120),
  mode: z.enum(["hold", "book"]),
  locale: z.string().refine(isLocale),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().min(6).max(40),
  country: z.string().trim().min(2).max(60),
  licence: z.enum(["none", "icc", "dayskipper", "yachtmaster", "other"]).default("none"),
  vhf: z.string().optional().transform((v) => v === "1"),
  experience: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
  method: z.enum(["bank", "card"]).default("bank"),
  agree: z.literal("1"),
  website: z.string().max(0).optional(),
});

function str(form: FormData, k: string): string | undefined {
  const v = form.get(k);
  return typeof v === "string" ? v : undefined;
}

export async function createBooking(_prev: BookState, form: FormData): Promise<BookState> {
  const raw = Object.fromEntries([...form.keys()].map((k) => [k, str(form, k)]));
  const d = Details.safeParse(raw);
  const tripParsed = TripSchema.safeParse(raw);
  if (!d.success || !tripParsed.success) {
    return { error: "invalid", fields: d.success ? [] : d.error.issues.map((i) => String(i.path[0])) };
  }
  const v = d.data;
  const trip: Trip = tripParsed.data;
  if (!trip.s && v.licence === "none") return { error: "skipper", fields: ["licence"] };

  const env = await getEnvAsync();
  const db = await getDb();
  if (!(await allow(db, `book:${await clientIp()}`, 10, 3600))) return { error: "rate" };

  const { offer } = await findOffer(env, db, v.key, trip.w);
  if (!offer || offer.yacht.base.destinationId !== trip.d) return { error: "unavailable" };
  const ctx = await loadPricingContext(db);
  const today = todayIso();
  const q: Quote = priceOffer(offer, ctx, selectionsOf(trip), today);
  const method = v.method === "card" && stripeEnabled(env) && ctx.settings.cardPaymentsEnabled ? "card" : "bank";

  const provider = await providerFor(env, db, offer.yacht.provider);
  if (!provider) return { error: "server" };
  let option;
  try {
    option = await provider.createOption(offer, { name: v.name, email: v.email, phone: v.phone, country: v.country }, ctx.settings.holdHours);
  } catch (e) {
    console.error("createOption failed", e);
    return { error: "unavailable" };
  }

  const token = randomToken();
  const id = randomId();
  const ref = bookingRef();
  const crewSource = (role: "skipper" | "chef" | "hostess") => q.lines.find((l) => l.code === role)?.source ?? "none";
  await db.insert(booking).values({
    id,
    ref,
    accessHash: await sha256Hex(token),
    status: v.mode === "hold" ? "hold" : "awaiting_payment",
    provider: offer.yacht.provider,
    providerYachtId: offer.yacht.providerYachtId,
    providerOptionRef: option.optionRef,
    holdExpiresAt: option.expiresAt,
    operatorId: offer.yacht.operatorId,
    operatorName: offer.yacht.operatorName,
    destinationId: trip.d,
    yachtSnapshot: offer.yacht,
    quoteSnapshot: q,
    weekStart: offer.weekStart,
    weekEnd: offer.weekEnd,
    guests: trip.g,
    skipper: crewSource("skipper"),
    chef: crewSource("chef"),
    hostess: crewSource("hostess"),
    leadName: v.name,
    leadEmail: v.email,
    leadPhone: v.phone,
    leadCountry: v.country,
    sailingExperience: { licence: v.licence, vhf: v.vhf, experience: v.experience ?? "" },
    customerNotes: v.notes ?? null,
    currency: q.currency,
    total: q.total,
    bankTotal: q.bankTotal,
    paymentMethod: method,
    payout: q.payout,
    margin: q.margin,
    locale: v.locale,
  });
  await audit(db, "customer", v.mode === "hold" ? "hold_created" : "booking_created", "booking", id, { ref, optionRef: option.optionRef });

  const b = { ref, locale: v.locale };
  const link = bookingLink(env, b, token);
  const y = offer.yacht;
  let firstPaymentId: string | null = null;
  if (v.mode === "book") {
    const rows = await createPayments(db, { id, currency: q.currency }, q, method, ctx.settings.bankDiscountPct);
    firstPaymentId = rows[0]?.id ?? null;
  }

  await sendMail(env, {
    to: v.email,
    subject: v.mode === "hold" ? `Your yacht is on hold · ${ref}` : `Your booking request · ${ref}`,
    ...layout(
      v.mode === "hold" ? "Your yacht is on hold" : "Thanks for your booking",
      [
        `Hi ${v.name.split(" ")[0]},`,
        `${y.model} "${y.name}" at ${y.base.name}, ${offer.weekStart} to ${offer.weekEnd}.`,
        v.mode === "hold"
          ? `We've asked ${y.operatorName} to reserve it for you until ${new Date(option.expiresAt).toUTCString()}. Nothing to pay yet. Use the link below to book it before then.`
          : method === "bank"
            ? "Your bank transfer details are on your booking page. The yacht is reserved while we wait for your transfer."
            : "Complete your card payment on the next page to secure the yacht.",
        "Keep this email: the link is how you return to your booking.",
      ],
      { label: "View my booking", href: link },
      EMAIL_FOOTER,
    ),
  });
  await sendMail(env, {
    to: COMPANY.email,
    subject: `${v.mode === "hold" ? "HOLD" : "BOOKING"} ${ref} · ${y.model} · ${trip.d} ${offer.weekStart}`,
    ...layout(`New ${v.mode}: ${ref}`, [`${v.name} <${v.email}> ${v.phone}`, `${y.operatorName} · ${y.model} "${y.name}"`, `Total ${q.currency} ${q.total} · payout ${q.payout} · margin ${q.margin}`, `Payment: ${method}`], {
      label: "Open in admin",
      href: `${siteUrl(env)}/admin/bookings/${id}`,
    }),
    replyTo: v.email,
  });

  if (method === "card" && firstPaymentId) {
    const url = await startCardPayment(firstPaymentId, ref, v.locale, token);
    if (url) redirect(url);
  }
  redirect(`/${v.locale}/booking/${ref}?t=${encodeURIComponent(token)}`);
}

/** Create a Stripe Checkout session for one payment. Card price = schedule amount without the bank discount. */
async function startCardPayment(paymentId: string, ref: string, locale: string, token: string): Promise<string | null> {
  const env = await getEnvAsync();
  const db = await getDb();
  const p = await db.select().from(payment).where(eq(payment.id, paymentId)).get();
  const b = p ? await db.select().from(booking).where(eq(booking.id, p.bookingId)).get() : undefined;
  if (!p || !b || p.status !== "pending") return null;
  const q = b.quoteSnapshot as Quote;
  const cardAmount = q.schedule.find((s) => s.kind === p.kind)?.amount ?? p.amount;
  const base = `${siteUrl(env)}/${locale}/booking/${ref}?t=${encodeURIComponent(token)}`;
  try {
    const session = await createCheckoutSession(env, {
      amount: cardAmount,
      currency: b.currency as Quote["currency"],
      description: `Nautical Nomads ${p.kind} · ${(b.yachtSnapshot as { model: string }).model} · ${b.weekStart}`,
      email: b.leadEmail,
      paymentId: p.id,
      bookingRef: ref,
      successUrl: `${base}&paid=1`,
      cancelUrl: `${base}&cancelled=1`,
      locale,
    });
    await db.update(payment).set({ method: "card", amount: cardAmount, stripeSessionId: session.id }).where(eq(payment.id, p.id));
    return session.url;
  } catch (e) {
    console.error("stripe checkout failed", e);
    return null;
  }
}

async function authorise(ref: string, token: string) {
  const db = await getDb();
  const b = await db.select().from(booking).where(eq(booking.ref, ref)).get();
  if (!b || !safeEqual(b.accessHash, await sha256Hex(token))) return null;
  return { db, b };
}

const RefToken = z.object({ ref: z.string().regex(/^NN-[A-Z0-9]{6}$/), t: z.string().min(20).max(100), locale: z.string().refine(isLocale) });

/** Customer turns a 24-hour hold into a booking. */
export async function convertHold(form: FormData): Promise<void> {
  const p = RefToken.extend({ method: z.enum(["bank", "card"]) }).safeParse(Object.fromEntries([...form.keys()].map((k) => [k, str(form, k)])));
  if (!p.success) return;
  const auth = await authorise(p.data.ref, p.data.t);
  if (!auth || auth.b.status !== "hold") redirect(`/${p.data.locale}/booking/${p.data.ref}?t=${encodeURIComponent(p.data.t)}`);
  const { db, b } = auth;
  const env = await getEnvAsync();
  const ctx = await loadPricingContext(db);
  const method = p.data.method === "card" && stripeEnabled(env) && ctx.settings.cardPaymentsEnabled ? "card" : "bank";
  const q = b.quoteSnapshot as Quote;
  await db.update(booking).set({ status: "awaiting_payment", paymentMethod: method, updatedAt: new Date().toISOString() }).where(and(eq(booking.id, b.id), eq(booking.status, "hold")));
  const rows = await createPayments(db, { id: b.id, currency: b.currency }, q, method, ctx.settings.bankDiscountPct);
  await audit(db, "customer", "hold_converted", "booking", b.id, { method });
  if (method === "card" && rows[0]) {
    const url = await startCardPayment(rows[0].id, b.ref, p.data.locale, p.data.t);
    if (url) redirect(url);
  }
  redirect(`/${p.data.locale}/booking/${b.ref}?t=${encodeURIComponent(p.data.t)}`);
}

/** Customer pays a pending payment by card. */
export async function payByCard(form: FormData): Promise<void> {
  const p = RefToken.extend({ paymentId: z.string().uuid() }).safeParse(Object.fromEntries([...form.keys()].map((k) => [k, str(form, k)])));
  if (!p.success) return;
  const auth = await authorise(p.data.ref, p.data.t);
  if (!auth) return;
  const row = await auth.db.select().from(payment).where(and(eq(payment.id, p.data.paymentId), eq(payment.bookingId, auth.b.id))).get();
  if (!row || row.status !== "pending") redirect(`/${p.data.locale}/booking/${p.data.ref}?t=${encodeURIComponent(p.data.t)}`);
  const url = await startCardPayment(row.id, auth.b.ref, p.data.locale, p.data.t);
  redirect(url ?? `/${p.data.locale}/booking/${p.data.ref}?t=${encodeURIComponent(p.data.t)}&cancelled=1`);
}

