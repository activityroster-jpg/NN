import { and, eq, inArray, isNotNull, lt, lte } from "drizzle-orm";
import { purgeExpiredAuth } from "@/lib/admin/auth";
import { audit } from "@/lib/audit";
import type { Db } from "@/lib/db";
import { booking, payment, rateLimit } from "@/lib/db/schema";
import { addDays } from "@/lib/domain/dates";
import type { Yacht } from "@/lib/domain/types";
import { EMAIL_FOOTER, layout, sendMail } from "@/lib/email/send";
import { siteUrl, type AppEnv } from "@/lib/env";
import { refreshRates } from "@/lib/fx";
import { autofillEmpty } from "@/lib/photos/autofill";
import { prerecordNarration } from "@/lib/cruising/prerecord";
import { warmFootage } from "@/lib/shorts/footage";
import { providerFor } from "./charter";

/** Hourly housekeeping: expire holds, remind about balances, refresh FX, purge old auth rows. */
export async function tick(env: AppEnv, db: Db): Promise<Record<string, number>> {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const out = { expired: 0, reminders: 0, fx: 0, photos: 0, narration: 0, footage: 0 };

  // 1. Holds and unpaid bookings whose option has run out.
  const stale = await db
    .select()
    .from(booking)
    .where(and(inArray(booking.status, ["hold", "awaiting_payment"]), isNotNull(booking.holdExpiresAt), lt(booking.holdExpiresAt, now)))
    .all();
  for (const b of stale) {
    const provider = await providerFor(env, db, b.provider);
    try {
      if (provider && b.providerOptionRef) await provider.cancel(b.providerOptionRef);
    } catch (e) {
      console.error("cancel option failed", b.ref, e);
    }
    await db.update(booking).set({ status: "expired", updatedAt: now }).where(eq(booking.id, b.id));
    await db.update(payment).set({ status: "void" }).where(and(eq(payment.bookingId, b.id), eq(payment.status, "pending")));
    await audit(db, "cron", "expired", "booking", b.id);
    const y = b.yachtSnapshot as Yacht;
    await sendMail(env, {
      to: b.leadEmail,
      subject: `Your hold has ended · ${b.ref}`,
      ...layout("Your hold has ended", [`Hi ${b.leadName.split(" ")[0]},`, `The hold on ${y.model} "${y.name}" for ${b.weekStart} has ended and the yacht has been released.`, "If you'd still like to sail, reply to this email and we'll check what's available."], { label: "Plan again", href: `${siteUrl(env)}/${b.locale}/plan?d=${b.destinationId}&w=${b.weekStart}` }, EMAIL_FOOTER),
    });
    out.expired++;
  }

  // 2. Balance reminders: seven days before and on the due date.
  const due = await db
    .select({ p: payment, b: booking })
    .from(payment)
    .innerJoin(booking, eq(payment.bookingId, booking.id))
    .where(and(eq(payment.status, "pending"), eq(payment.kind, "balance"), lte(payment.dueDate, addDays(today, 7)), inArray(booking.status, ["paid_deposit", "confirmed"])))
    .all();
  for (const { p, b } of due) {
    const last = p.reminderSentAt?.slice(0, 10);
    const daysLeft = Math.round((Date.parse(p.dueDate) - Date.parse(today)) / 86_400_000);
    const shouldSend = !last || (daysLeft <= 0 && last < p.dueDate);
    if (!shouldSend) continue;
    await sendMail(env, {
      to: b.leadEmail,
      subject: `Balance due ${p.dueDate} · ${b.ref}`,
      ...layout("Your balance is due soon", [`Hi ${b.leadName.split(" ")[0]},`, `The balance of ${p.currency} ${p.amount.toFixed(2)} for booking ${b.ref} is due on ${p.dueDate}.`, "Payment details are on your booking page (use the link in your booking email), or reply and we'll resend it."], undefined, EMAIL_FOOTER),
    });
    await db.update(payment).set({ reminderSentAt: now }).where(eq(payment.id, p.id));
    out.reminders++;
  }

  // 3. FX and housekeeping.
  try {
    if (await refreshRates(db)) out.fx = 1;
  } catch (e) {
    console.error("fx refresh failed", e);
  }
  await purgeExpiredAuth();
  await db.delete(rateLimit).where(lt(rateLimit.windowStart, Math.floor(Date.now() / 1000) - 86_400));
  // 4. Photos: fill any empty slots, pausing between stock-API calls (up to ~3 min).
  try {
    out.photos = (await autofillEmpty(env, db, 4 * 60_000)).filled;
  } catch (e) {
    console.error("photo autofill failed", e);
  }
  // 5. Guide narration: record anything not yet in storage (up to ~3 min).
  try {
    out.narration = (await prerecordNarration(env, 3 * 60_000)).made;
  } catch (e) {
    console.error("narration prerecord failed", e);
  }
  // 6. Shorts: choose and download stock footage for scenes without it (up to ~2 min),
  // so a batch of new shorts does not depend on the next deploy.
  try {
    out.footage = (await warmFootage(env, 2 * 60_000)).made;
  } catch (e) {
    console.error("footage warm failed", e);
  }
  return out;
}
