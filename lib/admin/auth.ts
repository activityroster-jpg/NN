import "server-only";
import { and, desc, eq, gt, isNull, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { numericCode, randomId, randomToken, safeEqual, sha256Hex } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { adminOtp, adminSession } from "@/lib/db/schema";
import { layout, sendMail } from "@/lib/email/send";
import { adminEmails, getEnvAsync } from "@/lib/env";
import { allow } from "@/lib/rate-limit";

// Admin sign-in: an allow-listed email (ADMIN_EMAILS secret) receives a
// six-digit code valid for ten minutes, five attempts. Sessions last seven
// days; only the SHA-256 of the session token is stored.

export const SESSION_COOKIE = "nn_admin";
const SESSION_DAYS = 7;

export async function requestCode(email: string, ip: string): Promise<void> {
  const env = await getEnvAsync();
  const db = await getDb();
  const e = email.trim().toLowerCase();
  if (!(await allow(db, `otp-ip:${ip}`, 20, 3600))) return;
  if (!adminEmails(env).includes(e)) return; // same response either way: no account enumeration
  if (!(await allow(db, `otp:${e}`, 5, 3600))) return;
  const code = numericCode();
  await db.insert(adminOtp).values({ id: randomId(), email: e, codeHash: await sha256Hex(`${e}:${code}`), expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() });
  await sendMail(env, { to: e, subject: `Nautical Nomads admin code: ${code}`, ...layout("Your sign-in code", [`Your code is ${code}. It expires in 10 minutes.`, "If you didn't ask for it, ignore this email."]) });
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const env = await getEnvAsync();
  const db = await getDb();
  const e = email.trim().toLowerCase();
  if (!adminEmails(env).includes(e)) return false;
  const now = new Date().toISOString();
  const otp = await db
    .select()
    .from(adminOtp)
    .where(and(eq(adminOtp.email, e), isNull(adminOtp.usedAt), gt(adminOtp.expiresAt, now)))
    .orderBy(desc(adminOtp.createdAt))
    .get();
  if (!otp || otp.attempts >= 5) return false;
  const ok = safeEqual(otp.codeHash, await sha256Hex(`${e}:${code.trim()}`));
  if (!ok) {
    await db.update(adminOtp).set({ attempts: otp.attempts + 1 }).where(eq(adminOtp.id, otp.id));
    return false;
  }
  await db.update(adminOtp).set({ usedAt: now }).where(eq(adminOtp.id, otp.id));
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(adminSession).values({ tokenHash: await sha256Hex(token), email: e, expiresAt: expires.toISOString() });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
  await audit(db, e, "sign_in", "admin", e);
  return true;
}

/** The signed-in admin's email, or a redirect to the sign-in page. */
export async function requireAdmin(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/admin/login");
  const db = await getDb();
  const env = await getEnvAsync();
  const s = await db.select().from(adminSession).where(eq(adminSession.tokenHash, await sha256Hex(token))).get();
  if (!s || s.expiresAt < new Date().toISOString() || !adminEmails(env).includes(s.email)) redirect("/admin/login");
  return s.email;
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(adminSession).where(eq(adminSession.tokenHash, await sha256Hex(token)));
  }
  jar.delete(SESSION_COOKIE);
}

export async function purgeExpiredAuth(): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.delete(adminSession).where(lt(adminSession.expiresAt, now));
  await db.delete(adminOtp).where(lt(adminOtp.expiresAt, new Date(Date.now() - 86_400_000).toISOString()));
}
