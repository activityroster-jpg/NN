import type { AppEnv } from "@/lib/env";
import { GUIDES } from ".";
import { guideSentences, sentenceHash } from "./narration";
import { INTRO_KEY, narrationKey, synthesize, synthesizeIntro, voiceEnabled } from "./voice";

// Hourly: record any narration not yet in storage, so visitors never wait for
// generation. Stops when the time budget runs out and carries on next hour.
export async function prerecordNarration(env: AppEnv, budgetMs: number): Promise<number> {
  if (!voiceEnabled(env)) return 0;
  const deadline = Date.now() + budgetMs;
  let made = 0;
  if (!(await env.PHOTOS!.head(INTRO_KEY))) {
    try {
      await env.PHOTOS!.put(INTRO_KEY, await synthesizeIntro(env), { httpMetadata: { contentType: "audio/mpeg" } });
      made++;
    } catch (e) {
      console.error("prerecord intro", e);
    }
  }
  for (const g of GUIDES) {
    const sentences = guideSentences(g);
    for (let i = 0; i < sentences.length; i++) {
      if (Date.now() > deadline) return made;
      const key = narrationKey(env, sentenceHash(sentences[i]!));
      if (await env.PHOTOS!.head(key)) continue;
      try {
        const audio = await synthesize(env, sentences[i]!, sentences[i - 1], sentences[i + 1]);
        await env.PHOTOS!.put(key, audio, { httpMetadata: { contentType: "audio/mpeg" } });
        made++;
      } catch (e) {
        console.error("prerecord", g.id, i, e);
        return made; // quota or outage: try again next hour
      }
    }
  }
  return made;
}
