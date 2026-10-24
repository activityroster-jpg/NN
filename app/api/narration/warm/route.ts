import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { prerecordNarration } from "@/lib/cruising/prerecord";
import { allow } from "@/lib/rate-limit";

// Records any guide narration (and the intro music) not yet stored, for about
// 25 seconds per call. Called by the deploy workflow until nothing is left, so
// every video is fully recorded right after a deploy. Safe to expose: it only
// ever records our own script, each sentence once.
export async function POST() {
  const env = await getEnvAsync();
  if (!(await allow(await getDb(), "narration-warm", 30, 600))) return Response.json({ error: "busy, try again later" }, { status: 429 });
  const result = await prerecordNarration(env, 25_000);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
