import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { sentenceHash, spokenText } from "@/lib/cruising/narration";
import { narrationSource } from "@/lib/narration/sources";
import { narrationKey, synthesize, voiceEnabled } from "@/lib/cruising/voice";
import { allow } from "@/lib/rate-limit";

// Audio for one narration sentence. Only sentences that are part of a guide's
// or a short's script can be generated (the client sends a hash, never text), so the cost is
// bounded by our own content. Generated once, then served from R2.

const HASH = /^[0-9a-f]{14}$/;

export async function GET(_req: Request, ctx: { params: Promise<{ guide: string; hash: string }> }) {
  const { guide, hash } = await ctx.params;
  const env = await getEnvAsync();
  if (!voiceEnabled(env) || !HASH.test(hash)) return new Response("not found", { status: 404 });
  const g = narrationSource(guide);
  if (!g) return new Response("not found", { status: 404 });

  // The URL names the caption; storage is keyed by what is actually spoken, so
  // a pronunciation change records the sentence again.
  const sentences = g.sentences;
  const i = sentences.findIndex((s) => sentenceHash(s) === hash);
  if (i < 0) return new Response("not found", { status: 404 });
  const say = (k: number) => (sentences[k] === undefined ? undefined : spokenText(g, sentences[k]!));
  const key = narrationKey(env, sentenceHash(say(i)!));
  const headers = { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" };
  const stored = await env.PHOTOS!.get(key);
  if (stored) return new Response(stored.body, { headers });

  // Site-wide guard on generation; the player falls back to the device voice.
  if (!(await allow(await getDb(), "narration-tts", 60, 60))) return new Response("busy", { status: 429 });
  try {
    const audio = await synthesize(env, say(i)!, say(i - 1), say(i + 1));
    await env.PHOTOS!.put(key, audio, { httpMetadata: { contentType: "audio/mpeg" } });
    return new Response(audio, { headers });
  } catch (e) {
    console.error("narration", guide, hash, e);
    return new Response("unavailable", { status: 502 });
  }
}
