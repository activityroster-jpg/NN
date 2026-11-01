import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { destinationSetting, setting } from "@/lib/db/schema";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { getSettings, saveSettings } from "@/lib/settings";
import { MODELS } from "@/lib/fleet";
import { GALLERY_QUERIES } from "./gallery";
import { SUGGESTED_QUERIES } from "./pexels";

// Every photo slot on the public site, so the admin can see and change them all.

export interface Slot {
  key: string;
  label: string;
  /** Search words used for the auto pick and Refresh. */
  query: string;
  group: "home" | "featured" | "other" | "gallery" | "models";
}

export interface SlotValue {
  url: string | null;
  credit: string | null;
  /** Stock library id ("pixabay:123") for picked photos, so none is used twice. */
  sourceId?: string | null;
}

/** Photos per yacht model. */
export const MODEL_SLOTS = 10;


export const SLOTS: readonly Slot[] = [
  { key: "home:hero", label: "Home page hero", query: "sailing yacht deck mediterranean", group: "home" },
  { key: "home:monohull", label: "Home: sailing yacht card", query: SUGGESTED_QUERIES.monohull!, group: "home" },
  { key: "home:catamaran", label: "Home: catamaran card", query: SUGGESTED_QUERIES.catamaran!, group: "home" },
  ...DESTINATIONS.map((d) => ({ key: `destination:${d.id}`, label: d.id, query: SUGGESTED_QUERIES[d.id] ?? `${d.id} sailing`, group: d.featured ? ("featured" as const) : ("other" as const) })),
  // Destination page galleries (three per destination), filled after the heroes.
  ...DESTINATIONS.flatMap((d) =>
    [1, 2, 3].map((n) => ({ key: `destination:${d.id}:g${n}`, label: `${d.id} · gallery ${n}`, query: GALLERY_QUERIES[d.id]?.[n - 1] ?? `${d.id} coast`, group: "gallery" as const })),
  ),
  // Yacht model pages: up to MODEL_SLOTS photos each, uploaded in the admin
  // (no library photos: a model shows a blank panel until it has uploads).
  ...MODELS.flatMap((m) =>
    Array.from({ length: MODEL_SLOTS }, (_, i) => i + 1).map((n) => ({
      key: `model:${m.id}:g${n}`,
      label: `${m.name} · photo ${n}`,
      query: "",
      group: "models" as const,
    })),
  ),
];

/** Slots that only take uploads (no stock fill, no Refresh): every yacht model photo. */
export const uploadOnly = (s: Slot) => s.group === "models" && !s.query;

/** True when a slot's photo came from the stock library rather than an upload. */
export const isStockCredit = (credit: string | null | undefined) => /\/ (Pixabay|Unsplash)$/.test(credit ?? "");

export const GALLERY_RE = /^destination:([a-z-]+):g([1-3])$/;
export const MODEL_RE = /^model:([a-z0-9-]+):g(10|[1-9])$/;
/** Slots kept in the shared photo map (destination galleries and yacht models). */
const inPhotoMap = (key: string) => GALLERY_RE.test(key) || MODEL_RE.test(key);

// Generic photo slots (galleries) live in one JSON row of the setting table.
const PHOTOS_KEY = "photos";
type PhotoMap = Record<string, SlotValue>;

async function readPhotoMap(db: Db): Promise<PhotoMap> {
  const row = await db.select().from(setting).where(eq(setting.key, PHOTOS_KEY)).get();
  return (row?.value as PhotoMap | undefined) ?? {};
}

async function writePhotoMap(db: Db, map: PhotoMap): Promise<void> {
  await db
    .insert(setting)
    .values({ key: PHOTOS_KEY, value: map, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: setting.key, set: { value: map, updatedAt: new Date().toISOString() } });
}

/** Uploaded photos for one yacht model page, in slot order (library photos are never shown). */
export async function modelPhotos(db: Db, modelId: string): Promise<{ url: string; credit: string | null }[]> {
  const map = await readPhotoMap(db);
  return Array.from({ length: MODEL_SLOTS }, (_, i) => map[`model:${modelId}:g${i + 1}`])
    .filter((v): v is SlotValue & { url: string } => !!v?.url && !isStockCredit(v.credit))
    .map((v) => ({ url: v.url, credit: v.credit }));
}

/** Cover photo of every model that has one: its first uploaded photo. */
export async function modelCovers(db: Db): Promise<Record<string, string>> {
  const map = await readPhotoMap(db);
  const best: Record<string, { url: string; rank: number }> = {};
  for (const [k, v] of Object.entries(map)) {
    const m = MODEL_RE.exec(k);
    if (!m || !v.url || isStockCredit(v.credit)) continue;
    const rank = Number(m[2]);
    if (!best[m[1]!] || rank < best[m[1]!]!.rank) best[m[1]!] = { url: v.url, rank };
  }
  return Object.fromEntries(Object.entries(best).map(([id, b]) => [id, b.url]));
}

/** Gallery photos for one destination page, in order, skipping empty slots. */
export async function galleryFor(db: Db, destinationId: string): Promise<{ url: string; credit: string | null }[]> {
  const map = await readPhotoMap(db);
  return [1, 2, 3].map((n) => map[`destination:${destinationId}:g${n}`]).filter((v): v is SlotValue & { url: string } => !!v?.url);
}

export function slotByKey(key: string): Slot | undefined {
  return SLOTS.find((s) => s.key === key);
}

export async function readSlots(db: Db): Promise<Record<string, SlotValue>> {
  const [rows, settings, map] = await Promise.all([db.select().from(destinationSetting).all(), getSettings(db), readPhotoMap(db)]);
  const out: Record<string, SlotValue> = {};
  for (const s of SLOTS) {
    if (inPhotoMap(s.key)) {
      out[s.key] = { url: map[s.key]?.url ?? null, credit: map[s.key]?.credit ?? null, sourceId: map[s.key]?.sourceId ?? null };
    } else if (s.key.startsWith("destination:")) {
      const r = rows.find((x) => x.id === s.key.slice("destination:".length));
      out[s.key] = { url: r?.heroImageUrl ?? null, credit: r?.heroCredit ?? null };
    } else {
      const img = settings.images[s.key.slice("home:".length) as "hero" | "monohull" | "catamaran"];
      out[s.key] = { url: img?.url ?? null, credit: img?.credit ?? null };
    }
  }
  return out;
}

export async function writeSlot(db: Db, key: string, value: SlotValue): Promise<void> {
  if (inPhotoMap(key)) {
    const map = await readPhotoMap(db);
    if (value.url) map[key] = value;
    else delete map[key];
    await writePhotoMap(db, map);
    return;
  }
  if (key.startsWith("destination:")) {
    const id = key.slice("destination:".length);
    await db
      .insert(destinationSetting)
      .values({ id, heroImageUrl: value.url, heroCredit: value.credit })
      .onConflictDoUpdate({ target: destinationSetting.id, set: { heroImageUrl: value.url, heroCredit: value.credit } });
    return;
  }
  const k = key.slice("home:".length) as "hero" | "monohull" | "catamaran";
  const cur = await getSettings(db);
  await saveSettings(db, { ...cur, images: { ...cur.images, [k]: value.url ? { url: value.url, credit: value.credit ?? "" } : null } });
}

