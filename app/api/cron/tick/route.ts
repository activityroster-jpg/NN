import { safeEqual } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { tick } from "@/lib/services/cron";

// Called hourly by the Worker's scheduled handler (worker.js).
export async function POST(req: Request) {
  const env = await getEnvAsync();
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (!env.CRON_SECRET || !safeEqual(secret, env.CRON_SECRET)) return new Response("forbidden", { status: 403 });
  const result = await tick(env, await getDb());
  return Response.json(result);
}
