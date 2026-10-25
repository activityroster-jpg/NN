import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { audit } from "@/lib/audit";
import type { Db } from "@/lib/db";
import { socialAccount, socialPost } from "@/lib/db/schema";
import { siteUrl, type AppEnv } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { igMe, igPublishImage, igRefresh } from "./instagram";
import { addLocalDays, localDate, zonedToUtc } from "./time";

// The Instagram queue: one photo a day at the set time unless moved, posted
// by the ten-minute cron. Tokens are refreshed before they run out.

export type SocialPost = typeof socialPost.$inferSelect;
export type SocialAccount = typeof socialAccount.$inferSelect;

const PROVIDER = "instagram";
/** Dashboard tokens last 60 days; refresh once fewer than this many days remain. */
const REFRESH_WITHIN_DAYS = 15;
const DAY = 86_400_000;

export async function getAccount(db: Db): Promise<SocialAccount | null> {
  return (await db.select().from(socialAccount).where(eq(socialAccount.provider, PROVIDER)).get()) ?? null;
}

/** Store a token pasted from the Meta app dashboard, after checking whose it is. */
export async function connectAccount(env: AppEnv, db: Db, token: string, actor: string): Promise<SocialAccount> {
  const me = await igMe(env, token);
  const now = new Date();
  const row = {
    provider: PROVIDER,
    userId: me.userId,
    username: me.username,
    accessToken: token,
    expiresAt: new Date(now.getTime() + 59 * DAY).toISOString(),
    refreshedAt: null,
    connectedAt: now.toISOString(),
    connectedBy: actor,
  };
  await db.insert(socialAccount).values(row).onConflictDoUpdate({ target: socialAccount.provider, set: row });
  await audit(db, actor, "connected", "social_account", PROVIDER, { username: me.username });
  return row;
}

export async function disconnectAccount(db: Db, actor: string): Promise<void> {
  await db.delete(socialAccount).where(eq(socialAccount.provider, PROVIDER));
  await audit(db, actor, "disconnected", "social_account", PROVIDER);
}

/** Refresh the token when it is getting old; returns true when it did. */
export async function refreshTokenIfDue(env: AppEnv, db: Db, acct: SocialAccount): Promise<boolean> {
  const now = Date.now();
  const since = now - Date.parse(acct.refreshedAt ?? acct.connectedAt);
  if (Date.parse(acct.expiresAt) - now > REFRESH_WITHIN_DAYS * DAY || since < DAY) return false;
  const r = await igRefresh(env, acct.accessToken);
  await db
    .update(socialAccount)
    .set({ accessToken: r.accessToken, expiresAt: new Date(now + r.expiresIn * 1000).toISOString(), refreshedAt: new Date(now).toISOString() })
    .where(eq(socialAccount.provider, PROVIDER));
  await audit(db, "cron", "token_refreshed", "social_account", PROVIDER);
  return true;
}

/**
 * The next free daily slot: the first day from today whose slot is still
 * ahead and has nothing scheduled or posted. Pure, so it is testable.
 */
export function nextFreeSlot(taken: Set<string>, now: Date, time: string, tz: string): Date {
  const today = localDate(now, tz);
  for (let i = 0; i < 400; i++) {
    const day = addLocalDays(today, i);
    const at = zonedToUtc(day, time, tz);
    if (at.getTime() > now.getTime() + 5 * 60_000 && !taken.has(day)) return at;
  }
  return zonedToUtc(addLocalDays(today, 400), time, tz);
}

/** Local dates already holding a post, from today on. */
export async function takenDays(db: Db, tz: string, now = new Date()): Promise<Set<string>> {
  const from = zonedToUtc(localDate(now, tz), "00:00", tz).toISOString();
  const rows = await db
    .select({ at: socialPost.scheduledAt })
    .from(socialPost)
    .where(and(inArray(socialPost.status, ["scheduled", "posting", "posted"]), gte(socialPost.scheduledAt, from)))
    .all();
  return new Set(rows.map((r) => localDate(new Date(r.at), tz)));
}

export async function listPosts(db: Db): Promise<{ queue: SocialPost[]; posted: SocialPost[] }> {
  const queue = await db.select().from(socialPost).where(inArray(socialPost.status, ["scheduled", "posting", "failed"])).orderBy(asc(socialPost.scheduledAt)).all();
  const posted = await db.select().from(socialPost).where(eq(socialPost.status, "posted")).orderBy(desc(socialPost.postedAt)).limit(12).all();
  return { queue, posted };
}

/** Publish one post now (the cron for due posts, or "Post now" in the admin). */
export async function publishPost(env: AppEnv, db: Db, id: string, actor: string): Promise<{ ok: true; permalink: string | null } | { ok: false; error: string }> {
  const acct = await getAccount(db);
  if (!acct) return { ok: false, error: "Instagram is not connected." };
  // Claim it, so two runs never post the same photo twice.
  const claimed = await db
    .update(socialPost)
    .set({ status: "posting", updatedAt: new Date().toISOString() })
    .where(and(eq(socialPost.id, id), inArray(socialPost.status, ["scheduled", "failed"])))
    .returning({ id: socialPost.id, imageKey: socialPost.imageKey, caption: socialPost.caption })
    .get();
  if (!claimed) return { ok: false, error: "This post is already being published." };
  try {
    const r = await igPublishImage(env, acct.userId, acct.accessToken, `${siteUrl(env)}/media/${claimed.imageKey}`, claimed.caption);
    await db.update(socialPost).set({ status: "posted", postedAt: new Date().toISOString(), remoteId: r.id, permalink: r.permalink, error: null, updatedAt: new Date().toISOString() }).where(eq(socialPost.id, id));
    await audit(db, actor, "posted", "social_post", id, { permalink: r.permalink });
    return { ok: true, permalink: r.permalink };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.update(socialPost).set({ status: "failed", error, updatedAt: new Date().toISOString() }).where(eq(socialPost.id, id));
    await audit(db, actor, "post_failed", "social_post", id, { error });
    return { ok: false, error };
  }
}

/** Every ten minutes: post what is due, keep the token fresh. */
export async function socialTick(env: AppEnv, db: Db): Promise<Record<string, number>> {
  const out = { posted: 0, failed: 0, refreshed: 0 };
  const acct = await getAccount(db);
  if (!acct) return out;
  try {
    if (await refreshTokenIfDue(env, db, acct)) out.refreshed++;
  } catch (e) {
    console.error("instagram token refresh", e);
  }
  const due = await db
    .select({ id: socialPost.id })
    .from(socialPost)
    .where(and(eq(socialPost.status, "scheduled"), lte(socialPost.scheduledAt, new Date().toISOString())))
    .orderBy(asc(socialPost.scheduledAt))
    .limit(3)
    .all();
  for (const p of due) {
    const r = await publishPost(env, db, p.id, "cron");
    if (r.ok) out.posted++;
    else out.failed++;
  }
  return out;
}

export async function socialSettings(db: Db): Promise<{ time: string; tz: string }> {
  const s = await getSettings(db);
  return { time: s.social.instagramTime, tz: s.social.timezone };
}
