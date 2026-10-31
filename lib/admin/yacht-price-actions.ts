"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { yachtWeekPrice } from "@/lib/db/schema";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { modelById } from "@/lib/fleet";
import { getYachtPricing, isSaturday, saveYachtPricing, YachtPricingSchema } from "@/lib/pricing";
import { requireAdmin } from "./auth";

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
};

/** The markup on market prices used for every week without its own price. */
export async function saveYachtMarkup(form: FormData) {
  const actor = await requireAdmin();
  const parsed = YachtPricingSchema.safeParse({ markupPct: Number(str(form, "markupPct").replace(",", ".")) });
  const back = str(form, "back").startsWith("/admin/yacht-prices") ? str(form, "back") : "/admin/yacht-prices";
  if (!parsed.success || str(form, "markupPct") === "") redirect(`${back}${back.includes("?") ? "&" : "?"}error=markup`);
  const db = await getDb();
  const before = await getYachtPricing(db);
  await saveYachtPricing(db, parsed.data);
  await audit(db, actor, "yacht_markup_changed", "yacht_pricing", null, { from: before.markupPct, to: parsed.data.markupPct });
  revalidatePath("/admin/yacht-prices");
  redirect(`${back}${back.includes("?") ? "&" : "?"}saved=1`);
}

const Ids = z.object({
  modelId: z.string().regex(/^[a-z0-9-]+$/).refine((id) => !!modelById(id)),
  destinationId: z.string().refine((d) => DESTINATION_IDS.includes(d)),
});
const Price = z.number().int().min(100).max(500_000);

/**
 * Save the week grid for one model in one destination. Each week's field is
 * `w_<YYYY-MM-DD>`; a number sets that week's price, an empty field returns the
 * week to the market default. Only weeks present in the form are touched.
 */
export async function saveYachtWeeks(form: FormData) {
  const actor = await requireAdmin();
  const ids = Ids.safeParse({ modelId: str(form, "modelId"), destinationId: str(form, "destinationId") });
  if (!ids.success) redirect("/admin/yacht-prices?error=model");
  const { modelId, destinationId } = ids.data;
  const page = `/admin/yacht-prices/${modelId}?d=${destinationId}`;

  const set: { weekStart: string; priceEur: number }[] = [];
  const touched: string[] = [];
  for (const [k, raw] of form.entries()) {
    if (!k.startsWith("w_") || typeof raw !== "string") continue;
    const week = k.slice(2);
    if (!isSaturday(week)) continue;
    touched.push(week);
    const v = raw.replace(/[\s,€]/g, "");
    if (v === "") continue;
    const n = Price.safeParse(Math.round(Number(v)));
    if (!n.success) redirect(`${page}&error=${encodeURIComponent(week)}`);
    set.push({ weekStart: week, priceEur: n.data });
  }
  if (touched.length > 120) redirect(`${page}&error=too-many`);

  const db = await getDb();
  const where = and(eq(yachtWeekPrice.modelId, modelId), eq(yachtWeekPrice.destinationId, destinationId), inArray(yachtWeekPrice.weekStart, touched));
  const before = touched.length ? await db.select().from(yachtWeekPrice).where(where).all() : [];
  const prev = new Map(before.map((r) => [r.weekStart, r.priceEur]));
  const changes = touched
    .map((w) => ({ week: w, from: prev.get(w) ?? null, to: set.find((s) => s.weekStart === w)?.priceEur ?? null }))
    .filter((c) => c.from !== c.to);
  if (changes.length) {
    if (touched.length) await db.delete(yachtWeekPrice).where(where);
    const at = new Date().toISOString();
    if (set.length) await db.insert(yachtWeekPrice).values(set.map((s) => ({ modelId, destinationId, weekStart: s.weekStart, priceEur: s.priceEur, updatedAt: at })));
    await audit(db, actor, "yacht_week_prices_saved", "yacht_week_price", `${modelId}|${destinationId}`, { changes: changes.slice(0, 120) });
  }
  revalidatePath("/admin/yacht-prices");
  redirect(`${page}&saved=${changes.length}`);
}
