import { z } from "zod";
import { getDb } from "@/lib/db";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { getRates } from "@/lib/fx";
import { estimateIn, estimatesForWeek, isSaturday } from "@/lib/pricing";
import { displayCurrency } from "@/lib/request";

// Weekly estimates for every yacht model, for one destination and week, in the
// visitor's display currency. Used by the planner's yacht step.
const Query = z.object({
  d: z.string().refine((d) => DESTINATION_IDS.includes(d)),
  w: z.string().refine(isSaturday),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = Query.safeParse({ d: url.searchParams.get("d"), w: url.searchParams.get("w") });
  if (!q.success) return Response.json({ error: "bad request" }, { status: 400 });
  const db = await getDb();
  const [eur, currency, rates] = await Promise.all([estimatesForWeek(db, q.data.d, q.data.w), displayCurrency(), getRates(db)]);
  const prices = Object.fromEntries(Object.entries(eur).map(([id, p]) => [id, p == null ? null : estimateIn(p, currency, rates)]));
  return Response.json({ currency, prices }, { headers: { "Cache-Control": "private, max-age=300" } });
}
