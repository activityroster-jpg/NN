import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { autofillEmpty, autofillEnabled } from "@/lib/photos/autofill";
import { allow } from "@/lib/rate-limit";

// Fills empty photo slots (yacht models included) for about 25 seconds per
// call. Called by the deploy workflow until nothing is left, so new slots get
// their photos right after a deploy instead of over the next hours. Safe to
// expose: it only fills empty slots, and the stock API is still called at most
// once every 20 seconds site-wide.
export async function POST() {
  const env = await getEnvAsync();
  const db = await getDb();
  if (!autofillEnabled(env)) return Response.json({ error: "no photo source or storage set up", filled: 0, remaining: -1 });
  if (!(await allow(db, "photos-warm", 200, 3600))) return Response.json({ error: "busy, try again later" }, { status: 429 });
  const r = await autofillEmpty(env, db, 25_000);
  return Response.json(r, { headers: { "Cache-Control": "no-store" } });
}
