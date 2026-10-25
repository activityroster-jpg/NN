import type { AppEnv } from "@/lib/env";
import { GUIDES } from ".";
import { sentenceHash } from "./narration";
import { narrationPrefix, voiceEnabled } from "./voice";
import type { CruisingGuide } from "./types";

// Downloadable MP4s of the guide videos, made by the "Make guide videos"
// workflow and stored in R2 as videos/cruising/<id>-<version>.mp4. The version
// changes when the guide, the voice or the video design changes.

/** Bump when the video's look changes, so every guide is rendered again. */
export const VIDEO_DESIGN = "v1";
export const VIDEO_PREFIX = "videos/cruising/";

export function videoVersion(env: AppEnv, g: CruisingGuide): string {
  return sentenceHash(JSON.stringify(g) + VIDEO_DESIGN + (voiceEnabled(env) ? narrationPrefix(env) : "device"));
}

export function videoKey(id: string, version: string): string {
  return `${VIDEO_PREFIX}${id}-${version}.mp4`;
}

export interface StoredVideo {
  key: string;
  size: number;
  uploaded: Date;
  current: boolean;
}

/** The newest stored MP4 per guide, and whether it matches the current version. */
export async function storedVideos(env: AppEnv): Promise<Map<string, StoredVideo>> {
  const out = new Map<string, StoredVideo>();
  if (!env.PHOTOS) return out;
  const all: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.PHOTOS.list({ prefix: VIDEO_PREFIX, cursor, limit: 1000 });
    all.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  for (const g of GUIDES) {
    const mine = all.filter((o) => o.key.startsWith(`${VIDEO_PREFIX}${g.id}-`)).sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());
    const currentKey = videoKey(g.id, videoVersion(env, g));
    const pick = mine.find((o) => o.key === currentKey) ?? mine[0];
    if (pick) out.set(g.id, { key: pick.key, size: pick.size, uploaded: pick.uploaded, current: pick.key === currentKey });
  }
  return out;
}
