"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { prerecordNarration } from "@/lib/cruising/prerecord";
import { INTRO_KEY, synthesize, synthesizeIntro, voiceEnabled } from "@/lib/cruising/voice";
import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";

function back(kind: "ok" | "error", message: string): never {
  redirect(`/admin/narration?${kind}=${encodeURIComponent(message.slice(0, 400))}`);
}

/** One short sentence through ElevenLabs, to show whether the key works. */
export async function testVoice(): Promise<void> {
  await requireAdmin();
  const env = await getEnvAsync();
  if (!env.ELEVENLABS_API_KEY) back("error", "ELEVENLABS_API_KEY is not set on the Worker (Cloudflare → Workers & Pages → nn → Settings → Variables and Secrets).");
  if (!env.PHOTOS) back("error", "The storage bucket is not connected to the Worker.");
  let msg = "";
  try {
    const audio = await synthesize(env, "Welcome aboard. This is the Nautical Nomads narrator.");
    msg = `Voice works: ElevenLabs returned ${Math.round(audio.byteLength / 1024)} KB of audio.`;
  } catch (e) {
    back("error", e instanceof Error ? e.message : String(e));
  }
  back("ok", msg);
}

/** Generate and store the intro music now. */
export async function makeIntro(): Promise<void> {
  const actor = await requireAdmin();
  const env = await getEnvAsync();
  if (!voiceEnabled(env)) back("error", "ElevenLabs key or storage missing.");
  let msg = "";
  try {
    const audio = await synthesizeIntro(env);
    await env.PHOTOS!.put(INTRO_KEY, audio, { httpMetadata: { contentType: "audio/mpeg" } });
    await audit(await getDb(), actor, "intro_music_generated", "narration", null, { bytes: audio.byteLength });
    msg = `Intro music generated and stored (${Math.round(audio.byteLength / 1024)} KB).`;
  } catch (e) {
    back("error", e instanceof Error ? e.message : String(e));
  }
  back("ok", msg);
}

/** Record missing narration for about 25 seconds (run again to continue). */
export async function recordNow(): Promise<void> {
  const actor = await requireAdmin();
  const env = await getEnvAsync();
  if (!voiceEnabled(env)) back("error", "ElevenLabs key or storage missing.");
  const made = await prerecordNarration(env, 25_000);
  await audit(await getDb(), actor, "narration_recorded", "narration", null, { made });
  back("ok", `Recorded ${made} new clip${made === 1 ? "" : "s"}. If any were left, press again or wait for the hourly job.`);
}

/** Delete stored intro music so it is generated again. */
export async function resetIntro(): Promise<void> {
  await requireAdmin();
  const env = await getEnvAsync();
  await env.PHOTOS?.delete(INTRO_KEY);
  back("ok", "Intro music cleared. It will be generated again on the next play.");
}
