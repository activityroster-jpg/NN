"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { pickNext, type PickResult } from "@/lib/photos/picker";
import { readSlots, slotByKey, uploadOnly, writeSlot } from "@/lib/photos/slots";
import { storePhoto } from "@/lib/photos/storage";
import { requireAdmin } from "./auth";

const Key = z.string().regex(/^(destination:[a-z-]+(:g[1-3])?|home:(hero|monohull|catamaran)|model:[a-z0-9-]+:g[1-5])$/);

/** Replace a slot's photo with the next matching one. Called by the board, one slot at a time. */
export async function refreshSlot(key: string, seen: string[], query?: string): Promise<PickResult & { key: string }> {
  const actor = await requireAdmin();
  const k = Key.parse(key);
  const slot = slotByKey(k);
  if (!slot) return { key: k, ok: false, error: "Unknown slot" };
  if (uploadOnly(slot)) return { key: k, ok: false, error: "Upload the builder's photo for this one." };
  const env = await getEnvAsync();
  const db = await getDb();
  // Never repeat a photo already used in another slot.
  const used = new Set<string>(seen.slice(0, 200));
  for (const v of Object.values(await readSlots(db))) if (v.credit) used.add(v.url ?? "");
  const q = (query ?? "").trim().slice(0, 100) || slot.query;
  const r = await pickNext(env, db, k, q, used);
  if (r.ok) {
    await writeSlot(db, k, { url: r.url, credit: r.credit });
    await audit(db, actor, "photo_refreshed", "photo_slot", k, { url: r.url, query: q });
    revalidatePath("/", "layout");
  }
  return { key: k, ...r };
}

/** Drag-and-drop or file-picker upload for one slot. */
export async function uploadToSlot(form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const actor = await requireAdmin();
  const k = Key.parse(String(form.get("key") ?? ""));
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file received." };
  const env = await getEnvAsync();
  try {
    const url = await storePhoto(env, k.replace(":", "-"), await file.arrayBuffer(), file.type);
    const db = await getDb();
    const credit = String(form.get("credit") ?? "").slice(0, 200) || null;
    await writeSlot(db, k, { url, credit });
    await audit(db, actor, "photo_uploaded", "photo_slot", k, { url });
    revalidatePath("/", "layout");
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function clearSlot(key: string): Promise<void> {
  const actor = await requireAdmin();
  const k = Key.parse(key);
  const db = await getDb();
  await writeSlot(db, k, { url: null, credit: null });
  await audit(db, actor, "photo_cleared", "photo_slot", k);
  revalidatePath("/", "layout");
}
