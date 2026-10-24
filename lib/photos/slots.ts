import type { Db } from "@/lib/db";
import { destinationSetting } from "@/lib/db/schema";
import { DESTINATIONS } from "@/lib/domain/destinations";
import { getSettings, saveSettings } from "@/lib/settings";
import { SUGGESTED_QUERIES } from "./pexels";

// Every photo slot on the public site, so the admin can see and change them all.

export interface Slot {
  key: string;
  label: string;
  /** Search words used for the auto pick and Refresh. */
  query: string;
  group: "home" | "featured" | "other";
}

export interface SlotValue {
  url: string | null;
  credit: string | null;
}

export const SLOTS: readonly Slot[] = [
  { key: "home:hero", label: "Home page hero", query: "sailing yacht deck mediterranean", group: "home" },
  { key: "home:monohull", label: "Home: sailing yacht card", query: SUGGESTED_QUERIES.monohull!, group: "home" },
  { key: "home:catamaran", label: "Home: catamaran card", query: SUGGESTED_QUERIES.catamaran!, group: "home" },
  ...DESTINATIONS.map((d) => ({ key: `destination:${d.id}`, label: d.id, query: SUGGESTED_QUERIES[d.id] ?? `${d.id} sailing`, group: d.featured ? ("featured" as const) : ("other" as const) })),
];

export function slotByKey(key: string): Slot | undefined {
  return SLOTS.find((s) => s.key === key);
}

export async function readSlots(db: Db): Promise<Record<string, SlotValue>> {
  const [rows, settings] = await Promise.all([db.select().from(destinationSetting).all(), getSettings(db)]);
  const out: Record<string, SlotValue> = {};
  for (const s of SLOTS) {
    if (s.key.startsWith("destination:")) {
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

