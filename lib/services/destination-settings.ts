import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { destinationSetting } from "@/lib/db/schema";
import { DESTINATIONS, type DestinationDef } from "@/lib/domain/destinations";

export interface DestinationView extends DestinationDef {
  active: boolean;
  mode: "live" | "enquiry";
  heroImageUrl: string | null;
  sortOrder: number;
}

/** The code catalogue with the admin's overrides applied. */
export async function destinationViews(db: Db): Promise<DestinationView[]> {
  let rows: (typeof destinationSetting.$inferSelect)[] = [];
  try {
    rows = await db.select().from(destinationSetting).all();
  } catch {
    rows = [];
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  return DESTINATIONS.map((d, i) => {
    const r = byId.get(d.id);
    return {
      ...d,
      featured: r?.featured ?? d.featured,
      active: r?.active ?? true,
      mode: r?.mode === "enquiry" ? "enquiry" : "live",
      heroImageUrl: r?.heroImageUrl ?? null,
      sortOrder: r?.sortOrder ?? i,
    } satisfies DestinationView;
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function destinationView(db: Db, id: string): Promise<DestinationView | undefined> {
  const r = await db.select().from(destinationSetting).where(eq(destinationSetting.id, id)).get().catch(() => undefined);
  const d = DESTINATIONS.find((x) => x.id === id);
  if (!d) return undefined;
  return {
    ...d,
    featured: r?.featured ?? d.featured,
    active: r?.active ?? true,
    mode: r?.mode === "enquiry" ? "enquiry" : "live",
    heroImageUrl: r?.heroImageUrl ?? null,
    sortOrder: r?.sortOrder ?? 0,
  };
}
