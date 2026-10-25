import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { BED_KEY, synthesizeBed, voiceEnabled } from "@/lib/cruising/voice";
import { allow } from "@/lib/rate-limit";

// The quiet sea ambience under every short. Generated once.
export async function GET() {
  const env = await getEnvAsync();
  if (!voiceEnabled(env)) return new Response("not found", { status: 404 });
  const headers = { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" };
  const stored = await env.PHOTOS!.get(BED_KEY);
  if (stored) return new Response(stored.body, { headers });
  if (!(await allow(await getDb(), "narration-bed", 3, 3600))) return new Response("busy", { status: 429 });
  try {
    const audio = await synthesizeBed(env);
    await env.PHOTOS!.put(BED_KEY, audio, { httpMetadata: { contentType: "audio/mpeg" } });
    return new Response(audio, { headers });
  } catch (e) {
    console.error("bed", e);
    return new Response("unavailable", { status: 502 });
  }
}
