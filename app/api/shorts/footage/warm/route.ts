import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { warmFootage } from "@/lib/shorts/footage";
import { allow } from "@/lib/rate-limit";

// Chooses and downloads stock footage for any short scene that lacks it, for
// about 25 seconds per call. Called by the deploy workflow until nothing is
// left. Safe to expose: it only ever fetches clips for our own scenes, once.
export async function POST() {
  const env = await getEnvAsync();
  if (!(await allow(await getDb(), "footage-warm", 200, 3600))) return Response.json({ error: "busy, try again later" }, { status: 429 });
  const result = await warmFootage(env, 25_000);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
