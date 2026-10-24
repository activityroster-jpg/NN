import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { photoCache } from "@/lib/db/schema";
import type { AppEnv } from "@/lib/env";
import { allow } from "@/lib/rate-limit";
import type { Photo } from "./pexels";
import { pixabayEnabled, searchPixabay } from "./pixabay";
import { importPhoto, storageEnabled } from "./storage";
import { reportUnsplashDownload, searchUnsplash, unsplashEnabled } from "./unsplash";

// Picks "the next photo" for a slot. Search results are cached for 24 hours
// (Pixabay asks for this) and the stock API is called at most once every
// MIN_GAP_SEC across the whole site, so queued refreshes trickle through.

export const MIN_GAP_SEC = 20;
const CACHE_HOURS = 24;

export type PickResult = { ok: true; url: string; credit: string; sourceId: string } | { ok: false; wait: number } | { ok: false; error: string };

type Source = "pixabay" | "unsplash";

export function photoSource(env: AppEnv): Source | null {
  if (pixabayEnabled(env) && storageEnabled(env)) return "pixabay";
  if (unsplashEnabled(env)) return "unsplash";
  return null;
}

async function cachedSearch(env: AppEnv, db: Db, source: Source, query: string, page: number): Promise<{ photos: Photo[] } | { wait: number }> {
  const cacheKey = `${source}|${page}|${query.toLowerCase()}`;
  const row = await db.select().from(photoCache).where(eq(photoCache.query, cacheKey)).get();
  if (row && Date.now() - Date.parse(row.fetchedAt) < CACHE_HOURS * 3_600_000) return { photos: row.hits as Photo[] };
  // One API call per MIN_GAP_SEC, site-wide.
  if (!(await allow(db, "stock-photo-api", 1, MIN_GAP_SEC))) return { wait: MIN_GAP_SEC };
  const res = source === "pixabay" ? await searchPixabay(env, query, page) : await searchUnsplash(env, query, page);
  await db
    .insert(photoCache)
    .values({ query: cacheKey, hits: res.photos, fetchedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: photoCache.query, set: { hits: res.photos, fetchedAt: new Date().toISOString() } });
  return { photos: res.photos };
}

/**
 * Next photo for `query` that is not in `exclude` (ids already used on the site
 * or already shown for this slot). Walks pages 1..3 of the cached results.
 */
export async function pickNext(env: AppEnv, db: Db, slotKey: string, query: string, exclude: Set<string>): Promise<PickResult> {
  const source = photoSource(env);
  if (!source) return { ok: false, error: "No photo source is set up." };
  for (let page = 1; page <= 3; page++) {
    const r = await cachedSearch(env, db, source, query, page);
    if ("wait" in r) return { ok: false, wait: r.wait };
    const candidates = r.photos.filter((p) => p.width > p.height && p.width >= 1600 && !exclude.has(p.id));
    const p = candidates[0];
    if (!p) {
      if (r.photos.length < 24) break; // no more pages
      continue;
    }
    try {
      const url = p.source === "pixabay" ? await importPhoto(env, p.url, slotKey.replace(":", "-")) : p.url;
      if (p.downloadLocation) await reportUnsplashDownload(env, p.downloadLocation);
      return { ok: true, url, credit: `${p.photographer} / ${p.source === "pixabay" ? "Pixabay" : "Unsplash"}`, sourceId: p.id };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "download failed" };
    }
  }
  return { ok: false, error: "No more matching photos. Try different search words." };
}
