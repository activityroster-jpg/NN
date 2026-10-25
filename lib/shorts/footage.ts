import { z } from "zod";
import type { AppEnv } from "@/lib/env";
import { SHORTS } from ".";
import type { Footage, Short } from "./types";

// Stock footage for the shorts, from Pixabay's video search. Pixabay's terms
// forbid hotlinking, so a chosen clip is downloaded into our bucket under
// footage/pixabay/<id>-<width>.mp4 and served from /media. Which clip each
// scene uses is remembered in footage/shorts/<short id>.json, so a video
// renders the same way every time until someone changes the search or pick.

export interface FootagePick {
  id: number;
  key: string;
  width: number;
  height: number;
  /** Clip length in seconds (looped if the scene runs longer). */
  duration: number;
  user: string;
  pageURL: string;
  /** The search and pick that chose it; a change makes the scene pick again. */
  q: string;
  pick: number;
}

/** Scene index → chosen clip. */
export type FootageManifest = Record<string, FootagePick>;

const MAX_BYTES = 120 * 1024 * 1024;
const Rendition = z.object({ url: z.string(), width: z.number(), height: z.number(), size: z.number() });
const Hits = z.object({
  hits: z
    .array(
      z
        .object({ id: z.number(), pageURL: z.string(), duration: z.number(), user: z.string(), videos: z.record(z.string(), Rendition.partial().passthrough()) })
        .passthrough(),
    )
    .default([]),
});

export function footageEnabled(env: AppEnv): boolean {
  return !!env.PIXABAY_API_KEY && !!env.PHOTOS;
}

export const manifestKey = (id: string) => `footage/shorts/${id}.json`;

export async function readManifest(env: AppEnv, id: string): Promise<FootageManifest> {
  const obj = env.PHOTOS ? await env.PHOTOS.get(manifestKey(id)) : null;
  if (!obj) return {};
  try {
    return (await obj.json()) as FootageManifest;
  } catch {
    return {};
  }
}

/** Scenes that need footage, with what the manifest holds for them. */
export function footageScenes(s: Short, m: FootageManifest): { index: number; footage: Footage; pick: FootagePick | null }[] {
  return s.scenes.flatMap((sc, index) => {
    if (sc.visual.kind !== "footage") return [];
    const f = sc.visual.footage;
    const have = m[String(index)];
    const pick = have && have.q === f.q && have.pick === (f.pick ?? 0) ? have : null;
    return [{ index, footage: f, pick }];
  });
}

/** Pixabay asked us to slow down and the time budget ran out: try again on the next call. */
class RateLimited extends Error {}

async function search(env: AppEnv, q: string, deadline: number) {
  const u = new URL("videos/", env.PIXABAY_API_BASE ?? "https://pixabay.com/api/");
  u.searchParams.set("key", env.PIXABAY_API_KEY!);
  u.searchParams.set("q", q);
  u.searchParams.set("video_type", "film");
  u.searchParams.set("safesearch", "true");
  u.searchParams.set("min_width", "1920");
  u.searchParams.set("order", "popular");
  u.searchParams.set("per_page", "40");
  for (;;) {
    const res = await fetch(u, { signal: AbortSignal.timeout(15_000) });
    if (res.status === 429) {
      // Pixabay allows 100 requests a minute and says when the window resets.
      const after = Number(res.headers.get("retry-after") || res.headers.get("x-ratelimit-reset") || 0);
      const wait = Math.min((after > 0 ? after : 8) * 1000, deadline - Date.now());
      if (wait <= 0) throw new RateLimited("Pixabay 429");
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`Pixabay ${res.status}`);
    return Hits.parse(await res.json()).hits;
  }
}

/** Largest rendition we are willing to store: at least 1080p, under the size cap. */
function bestRendition(videos: Record<string, Partial<z.infer<typeof Rendition>>>) {
  return Object.values(videos)
    .filter((r): r is z.infer<typeof Rendition> => !!r.url && !!r.width && !!r.height && !!r.size && r.size <= MAX_BYTES && r.height >= 1080)
    .sort((a, b) => b.width - a.width)[0];
}

async function store(env: AppEnv, key: string, url: string, size: number): Promise<void> {
  if (await env.PHOTOS!.head(key)) return;
  const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!res.ok || !res.body) throw new Error(`download ${res.status}`);
  const meta = { httpMetadata: { contentType: "video/mp4", cacheControl: "public, max-age=31536000, immutable" } };
  if (res.headers.get("content-length")) {
    await env.PHOTOS!.put(key, res.body, meta);
    return;
  }
  // No length on the response: R2 needs one, so declare the size Pixabay reported.
  const fixed = new FixedLengthStream(size);
  void res.body.pipeTo(fixed.writable);
  await env.PHOTOS!.put(key, fixed.readable, meta);
}

/** Choose and download the clip for one scene. */
async function pickFor(env: AppEnv, f: Footage, exclude: Set<number>, deadline: number): Promise<FootagePick> {
  const hits = await search(env, f.q, deadline);
  const usable = hits
    .filter((h) => h.duration >= 4 && !exclude.has(h.id))
    .map((h) => ({ h, r: bestRendition(h.videos) }))
    .filter((x): x is { h: (typeof hits)[number]; r: z.infer<typeof Rendition> } => !!x.r)
    // 4K first (crops to portrait without going soft), then Pixabay's own ranking.
    .sort((a, b) => Number(b.r.width >= 3840) - Number(a.r.width >= 3840));
  const chosen = usable[Math.min(f.pick ?? 0, usable.length - 1)];
  if (!chosen) throw new Error(`no footage for "${f.q}"`);
  const key = `footage/pixabay/${chosen.h.id}-${chosen.r.width}.mp4`;
  await store(env, key, chosen.r.url, chosen.r.size);
  return { id: chosen.h.id, key, width: chosen.r.width, height: chosen.r.height, duration: chosen.h.duration, user: chosen.h.user, pageURL: chosen.h.pageURL, q: f.q, pick: f.pick ?? 0 };
}

export interface FootageResult {
  made: number;
  remaining: number;
  /** Pixabay asked us to wait; nothing is wrong, call again. */
  retry?: boolean;
  error?: string;
}

/** Fetch footage for any scene that lacks it, within the time budget. */
export async function warmFootage(env: AppEnv, budgetMs: number): Promise<FootageResult> {
  if (!footageEnabled(env)) return { made: 0, remaining: -1, error: "PIXABAY_API_KEY or the storage bucket is not set on the Worker" };
  const deadline = Date.now() + budgetMs;
  const out: FootageResult = { made: 0, remaining: 0 };
  for (const s of SHORTS) {
    const m = await readManifest(env, s.id);
    const used = new Set(Object.values(m).map((p) => p.id));
    let changed = false;
    for (const sc of footageScenes(s, m)) {
      if (sc.pick) continue;
      if (out.error || out.retry || Date.now() > deadline) {
        out.remaining++;
        continue;
      }
      try {
        const pick = await pickFor(env, sc.footage, used, deadline);
        m[String(sc.index)] = pick;
        used.add(pick.id);
        changed = true;
        out.made++;
      } catch (e) {
        if (e instanceof RateLimited) out.retry = true;
        else out.error = `${s.id} scene ${sc.index + 1}: ${e instanceof Error ? e.message : String(e)}`;
        out.remaining++;
        console.error("footage", s.id, sc.index, e);
      }
    }
    if (changed) await env.PHOTOS!.put(manifestKey(s.id), JSON.stringify(m), { httpMetadata: { contentType: "application/json" } });
  }
  return out;
}

/** How much of each short's footage is chosen (short id → have and total scenes). */
export async function footageStatus(env: AppEnv): Promise<Map<string, { have: number; total: number; picks: FootagePick[] }>> {
  const out = new Map<string, { have: number; total: number; picks: FootagePick[] }>();
  for (const s of SHORTS) {
    const scenes = footageScenes(s, await readManifest(env, s.id));
    const picks = scenes.flatMap((x) => (x.pick ? [x.pick] : []));
    out.set(s.id, { have: picks.length, total: scenes.length, picks });
  }
  return out;
}
