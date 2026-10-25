"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { randomId } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { socialPost } from "@/lib/db/schema";
import { getEnvAsync } from "@/lib/env";
import { getSettings, saveSettings } from "@/lib/settings";
import { generateCaption } from "@/lib/social/caption";
import { connectAccount, disconnectAccount, nextFreeSlot, publishPost, socialSettings, takenDays } from "@/lib/social/posts";
import { zonedToUtc } from "@/lib/social/time";
import { requireAdmin } from "./auth";

// Admin → Instagram. Forms that can fail come back to the page with ?error=
// or ?ok= so the result is visible; the composer gets a plain return value.

const PAGE = "/admin/instagram";
const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};
function back(q: { ok?: string; error?: string }): never {
  const p = new URLSearchParams();
  if (q.ok) p.set("ok", q.ok);
  if (q.error) p.set("error", q.error.slice(0, 300));
  redirect(`${PAGE}?${p}`);
}
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function connectInstagram(form: FormData) {
  const actor = await requireAdmin();
  const token = s(form, "token");
  if (!token) back({ error: "Paste the access token first." });
  let error = "";
  let username = "";
  try {
    username = (await connectAccount(await getEnvAsync(), await getDb(), token, actor)).username;
  } catch (e) {
    error = message(e);
  }
  revalidatePath(PAGE);
  back(error ? { error } : { ok: `Connected as @${username}.` });
}

export async function disconnectInstagram() {
  const actor = await requireAdmin();
  await disconnectAccount(await getDb(), actor);
  revalidatePath(PAGE);
  back({ ok: "Instagram disconnected. Queued posts are kept." });
}

export async function saveInstagramTime(form: FormData) {
  const actor = await requireAdmin();
  const time = s(form, "time");
  if (!/^\d{2}:\d{2}$/.test(time)) back({ error: "Pick a time." });
  const db = await getDb();
  const cur = await getSettings(db);
  await saveSettings(db, { ...cur, social: { ...cur.social, instagramTime: time } });
  await audit(db, actor, "settings_updated", "settings", "social", { instagramTime: time });
  revalidatePath(PAGE);
  back({ ok: `New photos will be scheduled for ${time} each day.` });
}

/** Called by the composer with the cropped JPEG; writes the caption and books the next free day. */
export async function addInstagramPost(form: FormData): Promise<{ ok: true; id: string; source: string } | { ok: false; error: string }> {
  const actor = await requireAdmin();
  const file = form.get("file");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  const note = s(form, "note").slice(0, 300);
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No photo received." };
  if (file.type !== "image/jpeg" || file.size > 8 * 1024 * 1024) return { ok: false, error: "The photo must be a JPEG under 8 MB." };
  if (!(width > 0 && height > 0)) return { ok: false, error: "Missing photo size." };
  const env = await getEnvAsync();
  if (!env.PHOTOS) return { ok: false, error: "Photo storage is not set up (see Admin → Photos)." };
  try {
    const db = await getDb();
    const id = randomId();
    const imageKey = `social/instagram/${id}.jpg`;
    const bytes = await file.arrayBuffer();
    await env.PHOTOS.put(imageKey, bytes, { httpMetadata: { contentType: "image/jpeg", cacheControl: "public, max-age=31536000, immutable" } });
    const { caption, source } = await generateCaption(env, bytes, note);
    const { time, tz } = await socialSettings(db);
    const at = nextFreeSlot(await takenDays(db, tz), new Date(), time, tz);
    await db.insert(socialPost).values({ id, imageKey, width, height, caption, note: note || null, captionSource: source, status: "scheduled", scheduledAt: at.toISOString(), createdBy: actor });
    await audit(db, actor, "queued", "social_post", id, { scheduledAt: at.toISOString(), captionSource: source });
    revalidatePath(PAGE);
    return { ok: true, id, source };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

export async function updateInstagramPost(form: FormData) {
  const actor = await requireAdmin();
  const id = s(form, "id");
  const caption = s(form, "caption").slice(0, 2200);
  const note = s(form, "note").slice(0, 300);
  const date = s(form, "date");
  const time = s(form, "time");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) back({ error: "Pick a date and a time." });
  const db = await getDb();
  const cur = await db.select().from(socialPost).where(eq(socialPost.id, id)).get();
  if (!cur || cur.status === "posted" || cur.status === "posting") back({ error: "That post can no longer be changed." });
  const { tz } = await socialSettings(db);
  const at = zonedToUtc(date, time, tz).toISOString();
  await db
    .update(socialPost)
    .set({ caption, note: note || null, captionSource: caption !== cur.caption ? "edited" : cur.captionSource, scheduledAt: at, status: "scheduled", error: null, updatedAt: new Date().toISOString() })
    .where(eq(socialPost.id, id));
  await audit(db, actor, "updated", "social_post", id, { scheduledAt: at });
  revalidatePath(PAGE);
  back({ ok: "Saved." });
}

export async function regenerateInstagramCaption(form: FormData) {
  const actor = await requireAdmin();
  const id = s(form, "id");
  const note = s(form, "note").slice(0, 300);
  const env = await getEnvAsync();
  const db = await getDb();
  const cur = await db.select().from(socialPost).where(eq(socialPost.id, id)).get();
  if (!cur || cur.status === "posted" || cur.status === "posting") back({ error: "That post can no longer be changed." });
  const obj = env.PHOTOS ? await env.PHOTOS.get(cur.imageKey) : null;
  if (!obj) back({ error: "The photo is missing from storage." });
  const { caption, source } = await generateCaption(env, await obj.arrayBuffer(), note);
  await db.update(socialPost).set({ caption, note: note || null, captionSource: source, updatedAt: new Date().toISOString() }).where(eq(socialPost.id, id));
  await audit(db, actor, "caption_regenerated", "social_post", id, { captionSource: source });
  revalidatePath(PAGE);
  back({ ok: source === "template" ? "No caption writer is available, so a plain caption was used. Edit it before it posts." : "New caption written." });
}

export async function postInstagramNow(form: FormData) {
  const actor = await requireAdmin();
  const id = s(form, "id");
  const r = await publishPost(await getEnvAsync(), await getDb(), id, actor);
  revalidatePath(PAGE);
  back(r.ok ? { ok: "Posted to Instagram." } : { error: r.error });
}

export async function removeInstagramPost(form: FormData) {
  const actor = await requireAdmin();
  const id = s(form, "id");
  const env = await getEnvAsync();
  const db = await getDb();
  const cur = await db.select().from(socialPost).where(eq(socialPost.id, id)).get();
  if (!cur) back({ error: "Already removed." });
  if (cur.status === "posting") back({ error: "That post is being published right now." });
  await db.delete(socialPost).where(eq(socialPost.id, id));
  if (cur.status !== "posted" && env.PHOTOS) await env.PHOTOS.delete(cur.imageKey).catch(() => undefined);
  await audit(db, actor, "removed", "social_post", id, { status: cur.status });
  revalidatePath(PAGE);
  back({ ok: cur.status === "posted" ? "Removed from the list here; the Instagram post itself stays up." : "Removed from the queue." });
}
