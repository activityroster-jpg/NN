import type { AppEnv } from "@/lib/env";
import { GUIDES } from ".";
import { guideSentences, sentenceHash, spokenText } from "./narration";
import { INTRO_KEY, narrationKey, narrationPrefix, synthesize, synthesizeIntro, voiceEnabled } from "./voice";

// Records any narration not yet in storage, so visitors never wait for it.
// Called after each deploy (until nothing is left) and hourly. Lists what is
// stored in one pass, then records a few sentences at a time until the time
// budget runs out.

export interface PrerecordResult {
  made: number;
  /** Sentences still to record (0 when everything is done). */
  remaining: number;
  intro: boolean;
  error?: string;
}

/** Parallel requests to ElevenLabs; their plans allow at least this many. */
const PARALLEL = 3;

interface Job {
  key: string;
  text: string;
  previous?: string;
  next?: string;
}

async function storedKeys(env: AppEnv, prefix: string): Promise<Set<string>> {
  const keys = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await env.PHOTOS!.list({ prefix, cursor, limit: 1000 });
    for (const o of page.objects) keys.add(o.key);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return keys;
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

  const stored = await storedKeys(env, narrationPrefix(env));
  const jobs: Job[] = [];
  const queued = new Set<string>();
  for (const g of GUIDES) {
    const spoken = guideSentences(g).map((s) => spokenText(g, s));
    spoken.forEach((text, i) => {
      const key = narrationKey(env, sentenceHash(text));
      if (stored.has(key) || queued.has(key)) return;
      queued.add(key);
      jobs.push({ key, text, previous: spoken[i - 1], next: spoken[i + 1] });
    });
  }

  let failed = false;
  let next = 0;
  const worker = async () => {
    while (!failed && Date.now() < deadline) {
      const job = jobs[next++];
      if (!job) return;
      try {
        const audio = await synthesize(env, job.text, job.previous, job.next);
        await env.PHOTOS!.put(job.key, audio, { httpMetadata: { contentType: "audio/mpeg" } });
        out.made++;
      } catch (e) {
        // Quota or outage: stop calling the API; the rest waits for next time.
        failed = true;
        out.error = e instanceof Error ? e.message : String(e);
        console.error("prerecord", job.key, e);
      }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  out.remaining = jobs.length - out.made;
  return out;
}

/** How much of each guide's narration is recorded (guide id → recorded and total sentences). */
export async function narrationStatus(env: AppEnv): Promise<Map<string, { recorded: number; total: number }>> {
  const out = new Map<string, { recorded: number; total: number }>();
  const stored = voiceEnabled(env) ? await storedKeys(env, narrationPrefix(env)) : new Set<string>();
  for (const g of GUIDES) {
    const keys = [...new Set(guideSentences(g).map((s) => narrationKey(env, sentenceHash(spokenText(g, s)))))];
    out.set(g.id, { recorded: keys.filter((k) => stored.has(k)).length, total: keys.length });
  }
  return out;
}

/** True when every sentence of the guide is recorded (so the video never switches voice). */
export async function narrationComplete(env: AppEnv, id: string): Promise<boolean> {
  const s = (await narrationStatus(env)).get(id);
  return !!s && s.total > 0 && s.recorded === s.total;
}
