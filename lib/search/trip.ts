import { z } from "zod";
import { isIsoDate } from "@/lib/domain/dates";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import type { QuoteSelections } from "@/lib/domain/pricing";

// Trip parameters on the yacht, compare and booking pages: the search's core
// plus extras chosen on the yacht page.

const flag = z
  .enum(["0", "1"])
  .optional()
  .catch(undefined)
  .transform((v) => v === "1");

export const TripSchema = z.object({
  d: z.string().refine((v) => DESTINATION_IDS.includes(v)),
  w: z.string().refine(isIsoDate),
  g: z.coerce.number().int().min(1).max(12).catch(4),
  s: flag,
  c: flag,
  h: flag,
  pv: flag,
  dw: flag,
});

export type Trip = z.infer<typeof TripSchema>;

export function parseTrip(raw: Record<string, string | string[] | undefined>): Trip | null {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === "string") flat[k] = v;
  const r = TripSchema.safeParse(flat);
  return r.success ? r.data : null;
}

export function selectionsOf(t: Trip): QuoteSelections {
  return { guests: t.g, skipper: t.s, chef: t.c, hostess: t.h, provisioning: t.pv, damageWaiver: t.dw };
}

export function tripParams(t: Trip): URLSearchParams {
  const q = new URLSearchParams({ d: t.d, w: t.w, g: String(t.g), s: t.s ? "1" : "0", c: t.c ? "1" : "0" });
  if (t.h) q.set("h", "1");
  if (t.pv) q.set("pv", "1");
  if (t.dw) q.set("dw", "1");
  return q;
}

export function crewCount(t: Trip): number {
  return (t.s ? 1 : 0) + (t.c ? 1 : 0) + (t.h ? 1 : 0);
}
