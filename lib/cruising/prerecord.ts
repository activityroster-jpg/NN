import type { AppEnv } from "@/lib/env";
import { GUIDES } from ".";
import { guideSentences, sentenceHash } from "./narration";
import { INTRO_KEY, narrationKey, synthesize, synthesizeIntro, voiceEnabled } from "./voice";

// Hourly: record any narration not yet in storage, so visitors never wait for
// generation. Stops when the time budget runs out and carries on next hour.
export interface PrerecordResult {
  made: number;
  /** Sentences still to record (0 when everything is done). */
  remaining: number;
  intro: boolean;
  error?: string;
}

export async function prerecordNarration(env: AppEnv, budgetMs: number): Promise<PrerecordResult> {
  if (!voiceEnabled(env)) return { made: 0, remaining: -1, intro: false, error: "ELEVENLABS_API_KEY or the storage bucket is not set on the Worker" };
  const deadline = Date.now() + budgetMs;
  const out: PrerecordResult = { made: 0, remaining: 0, intro: !!(await env.PHOTOS!.head(INTRO_KEY)) };
  if (!out.intro) {
    try {
      await env.PHOTOS!.put(INTRO_KEY, await synthesizeIntro(env), { httpMetadata: { contentType: "audio/mpeg" } });
      out.intro = true;
    } catch (e) {
      out.error = `intro music: ${e instanceof Error ? e.message : String(e)}`;
      console.error("prerecord intro", e);
    }
  }
  for (const g of GUIDES) {
    const sentences = guideSentences(g);
    for (let i = 0; i < sentences.length; i++) {
      const key = narrationKey(env, sentenceHash(sentences[i]!));
      if (await env.PHOTOS!.head(key)) continue;
      if (Date.now() > deadline || (out.error && !out.error.startsWith("intro"))) {
        out.remaining++;
        continue;
      }
      try {
        const audio = await synthesize(env, sentences[i]!, sentences[i - 1], sentences[i + 1]);
        await env.PHOTOS!.put(key, audio, { httpMetadata: { contentType: "audio/mpeg" } });
        out.made++;
      } catch (e) {
        // Quota or outage: stop calling the API, count what is left, try again later.
        out.error = e instanceof Error ? e.message : String(e);
        out.remaining++;
        console.error("prerecord", g.id, i, e);
      }
    }
  }
  return out;
}
