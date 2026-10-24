import type { AppEnv } from "@/lib/env";

// Recorded narration via ElevenLabs. Each sentence is generated once, stored
// in R2 under a key that includes the voice and model, and served from there.

// "George": warm, mature British narrator from the ElevenLabs voice library.
const DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb";
// Multilingual model: pronounces Croatian, Greek and Italian place names properly.
const DEFAULT_MODEL = "eleven_multilingual_v2";

export function voiceEnabled(env: AppEnv): boolean {
  return !!env.ELEVENLABS_API_KEY && !!env.PHOTOS;
}

export function voiceConfig(env: AppEnv) {
  return { voice: env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE, model: env.ELEVENLABS_MODEL || DEFAULT_MODEL };
}

export function narrationKey(env: AppEnv, hash: string): string {
  const { voice, model } = voiceConfig(env);
  return `narration/${voice}/${model}/${hash}.mp3`;
}

/** Generate one sentence. Neighbouring sentences are passed so the delivery flows. */
export async function synthesize(env: AppEnv, text: string, previous?: string, next?: string): Promise<ArrayBuffer> {
  const { voice, model } = voiceConfig(env);
  const base = (env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io").replace(/\/$/, "");
  const res = await fetch(`${base}/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY ?? "", "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: model,
      previous_text: previous,
      next_text: next,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.arrayBuffer();
}

/** Version of the intro sting; bump to regenerate it. */
export const INTRO_KEY = "narration/intro/v1.mp3";

const INTRO_PROMPT =
  "Short, warm, uplifting instrumental intro for a sailing travel show: gentle acoustic guitar and soft strings, light ocean waves and a distant seagull, optimistic and relaxed, Mediterranean summer feel, clean ending. No vocals.";

/** Generate the intro music: Music API first, then the sound-effects API. */
export async function synthesizeIntro(env: AppEnv): Promise<ArrayBuffer> {
  const base = (env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io").replace(/\/$/, "");
  const headers = { "xi-api-key": env.ELEVENLABS_API_KEY ?? "", "Content-Type": "application/json", Accept: "audio/mpeg" };
  const music = await fetch(`${base}/v1/music?output_format=mp3_44100_128`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt: INTRO_PROMPT, music_length_ms: 7000 }),
    signal: AbortSignal.timeout(60_000),
  });
  if (music.ok) return music.arrayBuffer();
  console.error("intro music", music.status, (await music.text()).slice(0, 200));
  const sfx = await fetch(`${base}/v1/sound-generation?output_format=mp3_44100_128`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text: INTRO_PROMPT, duration_seconds: 7, prompt_influence: 0.4 }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!sfx.ok) throw new Error(`ElevenLabs sound ${sfx.status}: ${(await sfx.text()).slice(0, 200)}`);
  return sfx.arrayBuffer();
}
