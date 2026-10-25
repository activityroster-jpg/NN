import { safeEqual } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { tick } from "@/lib/services/cron";
import { socialTick } from "@/lib/social/posts";

// Called by the Worker's scheduled handler (worker.js): hourly for the
// housekeeping tick, every ten minutes (?job=social) for the Instagram queue.
export async function POST(req: Request) {
  const env = await getEnvAsync();
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (!env.CRON_SECRET || !safeEqual(secret, env.CRON_SECRET)) return new Response("forbidden", { status: 403 });
  const db = await getDb();
  const job = new URL(req.url).searchParams.get("job");
  const result = job === "social" ? await socialTick(env, db) : await tick(env, db);
  return Response.json(result);
}
