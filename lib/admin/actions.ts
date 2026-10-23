"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { randomId, randomToken, sha256Hex } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { booking, crewMember, crewRate, destinationSetting, enquiry, operator, payment, payout, pricingRule, providerBase } from "@/lib/db/schema";
import { CATEGORY_IDS } from "@/lib/domain/categories";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import type { Yacht } from "@/lib/domain/types";
import { EMAIL_FOOTER, layout, sendMail } from "@/lib/email/send";
import { getEnvAsync } from "@/lib/env";
import { clientIp } from "@/lib/request";
import { bookingLink, confirmWithOperator, recordPayment } from "@/lib/services/bookings";
import { providerFor } from "@/lib/services/charter";
import { getSettings, saveSettings, SettingsSchema } from "@/lib/settings";
import { requestCode, requireAdmin, signOut, verifyCode } from "./auth";

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const numOrNull = (v: string) => (v === "" ? null : Number(v));
const on = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "1";

// ── Auth ───────────────────────────────────────────────────────────────────
export async function adminRequestCode(form: FormData) {
  const email = z.string().email().safeParse(s(form, "email"));
  if (email.success) await requestCode(email.data, await clientIp());
  redirect(`/admin/login?sent=1&email=${encodeURIComponent(s(form, "email"))}`);
}

export async function adminVerifyCode(form: FormData) {
  const ok = await verifyCode(s(form, "email"), s(form, "code"));
  redirect(ok ? "/admin" : `/admin/login?sent=1&error=1&email=${encodeURIComponent(s(form, "email"))}`);
}

export async function adminSignOut() {
  await signOut();
  redirect("/admin/login");
}

// ── Bookings ───────────────────────────────────────────────────────────────
export async function markPaymentReceived(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "paymentId"));
  const env = await getEnvAsync();
  const db = await getDb();
  await db.update(payment).set({ method: "bank" }).where(eq(payment.id, id));
  await recordPayment(db, env, id, actor);
  revalidatePath("/admin", "layout");
}

export async function retryConfirm(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "bookingId"));
  await confirmWithOperator(await getDb(), await getEnvAsync(), id, actor);
  revalidatePath(`/admin/bookings/${id}`);
}

export async function markConfirmedManually(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "bookingId"));
  const ref = z.string().max(80).parse(s(form, "operatorRef"));
  const db = await getDb();
  await db.update(booking).set({ status: "confirmed", providerBookingRef: ref || null, updatedAt: new Date().toISOString() }).where(eq(booking.id, id));
  await audit(db, actor, "confirmed_manually", "booking", id, { ref });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function extendHold(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "bookingId"));
  const hours = z.coerce.number().int().min(1).max(168).parse(s(form, "hours") || "48");
  const db = await getDb();
  const b = await db.select().from(booking).where(eq(booking.id, id)).get();
  if (!b) return;
  const base = b.holdExpiresAt && b.holdExpiresAt > new Date().toISOString() ? Date.parse(b.holdExpiresAt) : Date.now();
  const until = new Date(base + hours * 3_600_000).toISOString();
  await db.update(booking).set({ holdExpiresAt: until, updatedAt: new Date().toISOString() }).where(eq(booking.id, id));
  await audit(db, actor, "hold_extended", "booking", id, { until, note: "extend the option with the operator too" });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function cancelBooking(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "bookingId"));
  const reason = s(form, "reason").slice(0, 500);
  const env = await getEnvAsync();
  const db = await getDb();
  const b = await db.select().from(booking).where(eq(booking.id, id)).get();
  if (!b || b.status === "cancelled") return;
  const provider = await providerFor(env, db, b.provider);
  try {
    if (provider && b.providerOptionRef && (b.status === "hold" || b.status === "awaiting_payment")) await provider.cancel(b.providerOptionRef);
  } catch (e) {
    console.error("cancel at provider failed", e);
  }
  await db.update(booking).set({ status: "cancelled", updatedAt: new Date().toISOString() }).where(eq(booking.id, id));
  await db.update(payment).set({ status: "void" }).where(eq(payment.bookingId, id));
  await audit(db, actor, "cancelled", "booking", id, { reason });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function saveBookingNotes(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "bookingId"));
  const crew = form.getAll("crew").filter((v): v is string => typeof v === "string");
  const db = await getDb();
  await db.update(booking).set({ adminNotes: s(form, "notes").slice(0, 5000), crewMemberIds: crew, updatedAt: new Date().toISOString() }).where(eq(booking.id, id));
  await audit(db, actor, "notes_updated", "booking", id, { crew });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function resendCustomerLink(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "bookingId"));
  const env = await getEnvAsync();
  const db = await getDb();
  const b = await db.select().from(booking).where(eq(booking.id, id)).get();
  if (!b) return;
  const token = randomToken();
  await db.update(booking).set({ accessHash: await sha256Hex(token) }).where(eq(booking.id, id));
  const y = b.yachtSnapshot as Yacht;
  await sendMail(env, {
    to: b.leadEmail,
    subject: `Your booking link · ${b.ref}`,
    ...layout("Your booking", [`Hi ${b.leadName.split(" ")[0]},`, `Here's the link to your booking of ${y.model} "${y.name}" (${b.weekStart}). Older links no longer work.`], { label: "View my booking", href: bookingLink(env, b, token) }, EMAIL_FOOTER),
  });
  await audit(db, actor, "link_resent", "booking", id);
  revalidatePath(`/admin/bookings/${id}`);
}

// ── Enquiries ──────────────────────────────────────────────────────────────
export async function updateEnquiry(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "id"));
  const status = z.enum(["new", "contacted", "quoted", "won", "lost"]).parse(s(form, "status"));
  const db = await getDb();
  await db.update(enquiry).set({ status, notes: s(form, "notes").slice(0, 5000), updatedAt: new Date().toISOString() }).where(eq(enquiry.id, id));
  await audit(db, actor, "updated", "enquiry", id, { status });
  revalidatePath("/admin/enquiries", "layout");
}

// ── Payouts ────────────────────────────────────────────────────────────────
export async function markPayoutPaid(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "id"));
  const db = await getDb();
  await db.update(payout).set({ status: "paid", paidAt: new Date().toISOString(), reference: s(form, "reference").slice(0, 120) || null }).where(eq(payout.id, id));
  await audit(db, actor, "paid", "payout", id, { reference: s(form, "reference") });
  revalidatePath("/admin", "layout");
}

// ── Operators ──────────────────────────────────────────────────────────────
export async function saveOperator(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().min(1).max(120).parse(s(form, "id"));
  const v = z
    .object({
      commissionPct: z.number().min(0).max(60).nullable(),
      depositPct: z.number().min(0).max(100).nullable(),
      balanceDaysBefore: z.number().int().min(0).max(365).nullable(),
    })
    .parse({ commissionPct: numOrNull(s(form, "commissionPct")), depositPct: numOrNull(s(form, "depositPct")), balanceDaysBefore: numOrNull(s(form, "balanceDaysBefore")) });
  const db = await getDb();
  await db
    .update(operator)
    .set({ ...v, parityEnforced: on(form, "parityEnforced"), active: on(form, "active"), notes: s(form, "notes").slice(0, 2000) || null, updatedAt: new Date().toISOString() })
    .where(eq(operator.id, id));
  await audit(db, actor, "updated", "operator", id, { ...v, parity: on(form, "parityEnforced"), active: on(form, "active") });
  revalidatePath("/admin/operators");
}

// ── Pricing ────────────────────────────────────────────────────────────────
export async function saveBusinessSettings(form: FormData) {
  const actor = await requireAdmin();
  const db = await getDb();
  const cur = await getSettings(db);
  const n = (k: string, fallback: number) => (s(form, k) === "" ? fallback : Number(s(form, k)));
  const section = s(form, "section");
  const next =
    section === "pricing"
      ? {
          ...cur,
          markupPct: n("markupPct", cur.markupPct),
          defaultCommissionPct: n("defaultCommissionPct", cur.defaultCommissionPct),
          bankDiscountPct: n("bankDiscountPct", cur.bankDiscountPct),
          depositPct: n("depositPct", cur.depositPct),
          balanceDaysBefore: n("balanceDaysBefore", cur.balanceDaysBefore),
          bufferDays: n("bufferDays", cur.bufferDays),
          holdHours: n("holdHours", cur.holdHours),
          crewPreference: s(form, "crewPreference") === "pool" ? ("pool" as const) : ("operator" as const),
          cardPaymentsEnabled: on(form, "cardPaymentsEnabled"),
        }
      : section === "offeringB"
        ? { ...cur, offeringB: { enabled: false, marginPct: n("marginPct", cur.offeringB.marginPct), basisRank: n("basisRank", cur.offeringB.basisRank), minSupply: n("minSupply", cur.offeringB.minSupply) } }
        : {
            ...cur,
            bank: { accountName: s(form, "accountName"), bankName: s(form, "bankName"), iban: s(form, "iban").replace(/\s+/g, " "), bic: s(form, "bic"), sortCode: s(form, "sortCode"), accountNumber: s(form, "accountNumber") },
            contact: { email: s(form, "contactEmail") || cur.contact.email, phone: s(form, "contactPhone"), whatsapp: s(form, "whatsapp") },
          };
  const parsed = SettingsSchema.safeParse(next);
  if (!parsed.success) redirect(`/admin/${section === "settings" ? "settings" : section === "offeringB" ? "categories" : "pricing"}?error=1`);
  await saveSettings(db, parsed.data);
  await audit(db, actor, "settings_saved", "settings", section);
  revalidatePath("/admin", "layout");
}

export async function addPricingRule(form: FormData) {
  const actor = await requireAdmin();
  const v = z
    .object({
      destinationId: z.string().refine((x) => x === "" || DESTINATION_IDS.includes(x)),
      categoryId: z.string().refine((x) => x === "" || (CATEGORY_IDS as readonly string[]).includes(x)),
      operatorId: z.string().max(120),
      markupPct: z.coerce.number().min(0).max(100),
    })
    .parse({ destinationId: s(form, "destinationId"), categoryId: s(form, "categoryId"), operatorId: s(form, "operatorId"), markupPct: s(form, "markupPct") });
  const db = await getDb();
  const id = randomId();
  await db.insert(pricingRule).values({ id, destinationId: v.destinationId || null, categoryId: v.categoryId || null, operatorId: v.operatorId || null, markupPct: v.markupPct });
  await audit(db, actor, "created", "pricing_rule", id, v);
  revalidatePath("/admin/pricing");
}

export async function togglePricingRule(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(s(form, "id"));
  const db = await getDb();
  const r = await db.select().from(pricingRule).where(eq(pricingRule.id, id)).get();
  if (!r) return;
  await db.update(pricingRule).set({ active: !r.active }).where(eq(pricingRule.id, id));
  await audit(db, actor, r.active ? "deactivated" : "activated", "pricing_rule", id);
  revalidatePath("/admin/pricing");
}

// ── Crew ───────────────────────────────────────────────────────────────────
export async function saveCrewMember(form: FormData) {
  const actor = await requireAdmin();
  const v = z
    .object({
      id: z.string(),
      name: z.string().min(2).max(120),
      role: z.enum(["skipper", "chef", "hostess"]),
      email: z.string().max(200),
      phone: z.string().max(40),
      weeklyCost: z.string(),
      currency: z.enum(["EUR", "GBP", "USD"]),
      notes: z.string().max(2000),
    })
    .parse({ id: s(form, "id"), name: s(form, "name"), role: s(form, "role"), email: s(form, "email"), phone: s(form, "phone"), weeklyCost: s(form, "weeklyCost"), currency: s(form, "currency") || "EUR", notes: s(form, "notes") });
  const destinations = form.getAll("destinations").filter((x): x is string => typeof x === "string" && DESTINATION_IDS.includes(x));
  const db = await getDb();
  const row = { name: v.name, role: v.role, email: v.email || null, phone: v.phone || null, destinations, weeklyCost: numOrNull(v.weeklyCost), currency: v.currency, notes: v.notes || null, active: v.id ? on(form, "active") : true };
  if (v.id) await db.update(crewMember).set(row).where(eq(crewMember.id, v.id));
  else await db.insert(crewMember).values({ id: randomId(), ...row });
  await audit(db, actor, v.id ? "updated" : "created", "crew_member", v.id || null, { name: v.name, role: v.role });
  revalidatePath("/admin/crew");
}

export async function saveCrewRate(form: FormData) {
  const actor = await requireAdmin();
  const v = z
    .object({ destinationId: z.string().refine((x) => DESTINATION_IDS.includes(x)), role: z.enum(["skipper", "chef", "hostess"]), weeklyPrice: z.coerce.number().min(0).max(100000), currency: z.enum(["EUR", "GBP", "USD"]) })
    .parse({ destinationId: s(form, "destinationId"), role: s(form, "role"), weeklyPrice: s(form, "weeklyPrice"), currency: s(form, "currency") || "EUR" });
  const db = await getDb();
  const active = s(form, "active") === "" ? true : on(form, "active");
  await db
    .insert(crewRate)
    .values({ id: randomId(), ...v, active })
    .onConflictDoUpdate({ target: [crewRate.destinationId, crewRate.role], set: { weeklyPrice: v.weeklyPrice, currency: v.currency, active } });
  await audit(db, actor, "saved", "crew_rate", `${v.destinationId}:${v.role}`, v);
  revalidatePath("/admin/crew");
}

// ── Destinations and bases ─────────────────────────────────────────────────
export async function saveDestination(form: FormData) {
  const actor = await requireAdmin();
  const id = z.string().refine((x) => DESTINATION_IDS.includes(x)).parse(s(form, "id"));
  const hero = s(form, "heroImageUrl");
  const v = {
    active: on(form, "active"),
    featured: on(form, "featured"),
    mode: s(form, "mode") === "enquiry" ? "enquiry" : "live",
    sortOrder: Number(s(form, "sortOrder")) || 0,
    heroImageUrl: hero && /^https:\/\//.test(hero) ? hero.slice(0, 500) : null,
  };
  const db = await getDb();
  await db.insert(destinationSetting).values({ id, ...v }).onConflictDoUpdate({ target: destinationSetting.id, set: v });
  await audit(db, actor, "updated", "destination", id, v);
  revalidatePath("/admin/destinations");
}

export async function saveProviderBase(form: FormData) {
  const actor = await requireAdmin();
  const v = z
    .object({ provider: z.enum(["mmk", "nausys"]), externalId: z.string().min(1).max(60), name: z.string().min(1).max(120), destinationId: z.string().refine((x) => x === "" || DESTINATION_IDS.includes(x)) })
    .parse({ provider: s(form, "provider"), externalId: s(form, "externalId"), name: s(form, "name"), destinationId: s(form, "destinationId") });
  const db = await getDb();
  const id = `${v.provider}:${v.externalId}`;
  await db
    .insert(providerBase)
    .values({ id, provider: v.provider, externalId: v.externalId, name: v.name, destinationId: v.destinationId || null })
    .onConflictDoUpdate({ target: providerBase.id, set: { name: v.name, destinationId: v.destinationId || null } });
  await audit(db, actor, "mapped", "provider_base", id, v);
  revalidatePath("/admin/destinations");
}
