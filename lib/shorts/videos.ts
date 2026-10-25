import type { AppEnv } from "@/lib/env";
import { sentenceHash } from "@/lib/cruising/narration";
import { narrationPrefix, voiceEnabled } from "@/lib/cruising/voice";
import type { StoredVideo } from "@/lib/cruising/videos";
import { SHORTS } from ".";
import { footageScenes, type FootageManifest } from "./footage";
import type { Short } from "./types";

// Rendered shorts live in R2 as videos/shorts/<id>-<version>.mp4 (+ .jpg
// cover). The version changes when the script, the voice, the footage
// choice or the design changes, and the workflow renders again.

/** Bump when the look changes, so every short is rendered again. */
export const SHORT_DESIGN = "v1";
export const SHORT_PREFIX = "videos/shorts/";

export function shortVersion(env: AppEnv, s: Short, m: FootageManifest): string {
  const clips = footageScenes(s, m).map((x) => x.pick?.key ?? "?");
  return sentenceHash(JSON.stringify(s) + SHORT_DESIGN + clips.join(",") + (voiceEnabled(env) ? narrationPrefix(env) : "device"));
}

export function shortKey(id: string, version: string): string {
  return `${SHORT_PREFIX}${id}-${version}.mp4`;
}

/** The newest stored MP4 per short, and whether it matches the given version. */
export async function storedShorts(env: AppEnv, versions: Map<string, string>): Promise<Map<string, StoredVideo>> {
  const out = new Map<string, StoredVideo>();
  if (!env.PHOTOS) return out;
  const all: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.PHOTOS.list({ prefix: SHORT_PREFIX, cursor, limit: 1000 });
    all.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  for (const s of SHORTS) {
    const mine = all.filter((o) => o.key.startsWith(`${SHORT_PREFIX}${s.id}-`) && o.key.endsWith(".mp4")).sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());
    const currentKey = shortKey(s.id, versions.get(s.id) ?? "");
    const pick = mine.find((o) => o.key === currentKey) ?? mine[0];
    if (pick) out.set(s.id, { key: pick.key, size: pick.size, uploaded: pick.uploaded, current: pick.key === currentKey });
  }
  return out;
}
