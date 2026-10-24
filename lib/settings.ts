import { eq } from "drizzle-orm";
import { z } from "zod";
import { DEFAULT_CATEGORY_POLICY } from "@/lib/domain/category-pricing";
import { DEFAULT_PAYMENT_POLICY } from "@/lib/domain/pricing";
import type { Db } from "@/lib/db";
import { setting } from "@/lib/db/schema";

// Business settings, editable in the admin. Code holds the defaults; the
// database holds overrides, validated on read so a bad row can't break pricing.

export const SettingsSchema = z.object({
  markupPct: z.number().min(0).max(100).default(10),
  defaultCommissionPct: z.number().min(0).max(60).default(15),
  bankDiscountPct: z.number().min(0).max(10).default(2),
  depositPct: z.number().min(0).max(100).default(DEFAULT_PAYMENT_POLICY.depositPct),
  balanceDaysBefore: z.number().int().min(0).max(365).default(DEFAULT_PAYMENT_POLICY.balanceDaysBefore),
  bufferDays: z.number().int().min(0).max(60).default(DEFAULT_PAYMENT_POLICY.bufferDays),
  holdHours: z.number().int().min(1).max(72).default(24),
  crewPreference: z.enum(["operator", "pool"]).default("operator"),
  cardPaymentsEnabled: z.boolean().default(true),
  bank: z
    .object({
      accountName: z.string().default("ActiveRoster Ltd"),
      bankName: z.string().default(""),
      iban: z.string().default(""),
      bic: z.string().default(""),
      sortCode: z.string().default(""),
      accountNumber: z.string().default(""),
    })
    .default({}),
  contact: z
    .object({
      email: z.string().default("info@nauticalnomads.com"),
      phone: z.string().default(""),
      whatsapp: z.string().default(""),
    })
    .default({}),
  /** Photos for the "sailing yacht or catamaran" cards on the home page. */
  images: z
    .object({
      hero: z.object({ url: z.string(), credit: z.string() }).nullable().default(null),
      monohull: z.object({ url: z.string(), credit: z.string() }).nullable().default(null),
      catamaran: z.object({ url: z.string(), credit: z.string() }).nullable().default(null),
    })
    .default({}),
  offeringB: z
    .object({
      enabled: z.boolean().default(false),
      marginPct: z.number().min(0).max(100).default(DEFAULT_CATEGORY_POLICY.marginPct),
      basisRank: z.number().int().min(1).max(20).default(DEFAULT_CATEGORY_POLICY.basisRank),
      minSupply: z.number().int().min(1).max(50).default(DEFAULT_CATEGORY_POLICY.minSupply),
    })
    .default({}),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});

const KEY = "business";

export async function getSettings(db: Db): Promise<Settings> {
  const row = await db.select().from(setting).where(eq(setting.key, KEY)).get();
  const parsed = SettingsSchema.safeParse(row?.value ?? {});
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function saveSettings(db: Db, value: Settings): Promise<void> {
  const v = SettingsSchema.parse(value);
  await db
    .insert(setting)
    .values({ key: KEY, value: v, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: setting.key, set: { value: v, updatedAt: new Date().toISOString() } });
}
