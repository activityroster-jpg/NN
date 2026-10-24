import type { Db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import type { AppEnv } from "@/lib/env";
import { pickNext, photoSource } from "./picker";
import { readSlots, SLOTS, writeSlot } from "./slots";
import { storageEnabled } from "./storage";

// Fills empty photo slots on its own so the site gets photos without anyone
// clicking through the admin board. Runs from the hourly cron (several slots,
// pausing between stock-API calls) and from public page views (one slot per
// view, in the background). Everything respects the site-wide 20 s API gap
// enforced by pickNext, so these can never exceed Pixabay's limits.

export function autofillEnabled(env: AppEnv): boolean {
  return photoSource(env) !== null && storageEnabled(env);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fill empty slots until none are left or the time budget is spent. */
export async function autofillEmpty(env: AppEnv, db: Db, budgetMs: number): Promise<{ filled: number; remaining: number }> {
  const deadline = Date.now() + budgetMs;
  let filled = 0;
  if (!autofillEnabled(env)) return { filled, remaining: 0 };
  const slots = await readSlots(db);
  const used = new Set(Object.values(slots).map((v) => v.url ?? "").filter(Boolean));
  const empty = SLOTS.filter((s) => !slots[s.key]?.url);
  let i = 0;
  while (i < empty.length && Date.now() < deadline) {
    const s = empty[i]!;
    const r = await pickNext(env, db, s.key, s.query, used);
    if (!r.ok && "wait" in r) {
      if (Date.now() + r.wait * 1000 > deadline) break;
      await sleep(r.wait * 1000 + 250);
      continue; // retry the same slot
    }
    i++;
    if (!r.ok) {
      console.error("autofill", s.key, r.error);
      continue;
    }
    used.add(r.url);
    await writeSlot(db, s.key, { url: r.url, credit: r.credit });
    await audit(db, "cron", "photo_autofilled", "photo_slot", s.key, { url: r.url, query: s.query });
    filled++;
  }
  return { filled, remaining: empty.length - i };
}

/**
 * Called from public pages: fills at most one empty slot in the background
 * (after the response is sent), so the site populates itself while people
 * browse, even before the first hourly cron. Cheap no-op once all slots are full.
 */
export function autofillInBackground(env: AppEnv, db: Db): void {
  if (!autofillEnabled(env)) return;
  let ctx: { waitUntil(p: Promise<unknown>): void } | undefined;
  try {
    ctx = getCloudflareContext().ctx;
  } catch {
    return;
  }
  if (!ctx) return;
  ctx.waitUntil(
    autofillEmpty(env, db, 1_000)
      .then((r) => {
        if (r.filled) revalidatePath("/", "layout");
      })
      .catch((e) => console.error("background photo autofill", e)),
  );
}
