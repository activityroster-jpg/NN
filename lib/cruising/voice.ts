import type { AppEnv } from "@/lib/env";

// Recorded narration via ElevenLabs. Each sentence is generated once, stored
// in R2 under a key that includes the voice and model, and served from there.

// "George": warm British narrator. Same voice and settings as the ActivityRoster how-to videos.
const DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb";
// Multilingual model: pronounces Croatian, Greek and Italian place names properly.
const DEFAULT_MODEL = "eleven_multilingual_v2";

export function voiceEnabled(env: AppEnv): boolean {
  return !!env.ELEVENLABS_API_KEY && !!env.PHOTOS;
}

export function voiceConfig(env: AppEnv) {
  return { voice: env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE, model: env.ELEVENLABS_MODEL || DEFAULT_MODEL };
}

/** Storage folder for the current voice, model and settings. */
export function narrationPrefix(env: AppEnv): string {
  const { voice, model } = voiceConfig(env);
  // "s2": voice settings version; bump when the settings change so clips are re-recorded.
  return `narration/${voice}/${model}/s2/`;
}

export function narrationKey(env: AppEnv, hash: string): string {
  return `${narrationPrefix(env)}${hash}.mp3`;
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
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.arrayBuffer();
}

/** Version of the intro sting; bump to regenerate it. */
export const INTRO_KEY = "narration/intro/v3.mp3";

const STING_PROMPT =
  "Short, bright logo sting for a sailing travel brand: a soft ocean wave swell rising into a warm, gentle acoustic guitar and chime flourish with a light shimmer tail. Optimistic, relaxed, Mediterranean summer. No voice.";

/** The intro sting (about 3.5 s): sound-effects API, like ActivityRoster's logo sting; music API as fallback. */
export async function synthesizeIntro(env: AppEnv): Promise<ArrayBuffer> {
  const base = (env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io").replace(/\/$/, "");
  const headers = { "xi-api-key": env.ELEVENLABS_API_KEY ?? "", "Content-Type": "application/json", Accept: "audio/mpeg" };
  const sting = await fetch(`${base}/v1/sound-generation?output_format=mp3_44100_128`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text: STING_PROMPT, duration_seconds: 3.5, prompt_influence: 0.5 }),
    signal: AbortSignal.timeout(60_000),
  });
  if (sting.ok) return sting.arrayBuffer();
  console.error("intro sting", sting.status, (await sting.text()).slice(0, 200));
  const music = await fetch(`${base}/v1/music?output_format=mp3_44100_128`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt: STING_PROMPT, music_length_ms: 10000, force_instrumental: true }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!music.ok) throw new Error(`ElevenLabs music ${music.status}: ${(await music.text()).slice(0, 200)}`);
  return music.arrayBuffer(); // longer than the intro: the player fades it out
}
