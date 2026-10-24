import { z } from "zod";
import type { AppEnv } from "@/lib/env";
import type { Photo } from "./pexels";

// Unsplash as a second stock-photo source (Pexels paused new API keys in
// October 2026). A free "demo" key allows 50 searches an hour, plenty for the
// admin. Unsplash's guidelines: hotlink their CDN URLs, credit the photographer
// with a link, and ping the download endpoint when a photo is chosen.

const UTM = "utm_source=nautical_nomads&utm_medium=referral";

const Response = z.object({
  total: z.number().optional(),
  results: z
    .array(
      z
        .object({
          id: z.string(),
          width: z.number(),
          height: z.number(),
          alt_description: z.string().nullable().optional(),
          urls: z.object({ raw: z.string(), regular: z.string(), small: z.string() }).passthrough(),
          links: z.object({ html: z.string(), download_location: z.string() }).passthrough(),
          user: z.object({ name: z.string(), links: z.object({ html: z.string() }).passthrough() }).passthrough(),
        })
        .passthrough(),
    )
    .default([]),
});

export function unsplashEnabled(env: AppEnv): boolean {
  return !!env.UNSPLASH_ACCESS_KEY;
}

export async function searchUnsplash(env: AppEnv, query: string, page = 1): Promise<{ photos: Photo[]; total: number }> {
  if (!env.UNSPLASH_ACCESS_KEY) return { photos: [], total: 0 };
  const u = new URL("https://api.unsplash.com/search/photos");
  u.searchParams.set("query", query);
  u.searchParams.set("orientation", "landscape");
  u.searchParams.set("per_page", "24");
  u.searchParams.set("page", String(page));
  u.searchParams.set("content_filter", "high");
  const res = await fetch(u, { headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`, "Accept-Version": "v1" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Unsplash ${res.status}`);
  const data = Response.parse(await res.json());
  return {
    total: data.total ?? data.results.length,
    photos: data.results.map((p) => ({
      id: `unsplash:${p.id}`,
      // A hero-sized rendition from Unsplash's CDN (they ask that we hotlink).
      url: `${p.urls.raw}&w=2000&q=80&fm=jpg&fit=crop`,
      thumb: p.urls.small,
      alt: p.alt_description ?? "",
      photographer: p.user.name,
      photographerUrl: `${p.user.links.html}?${UTM}`,
      pageUrl: `${p.links.html}?${UTM}`,
      width: p.width,
      height: p.height,
      downloadLocation: p.links.download_location,
    })),
  };
}

/** Unsplash asks apps to report when a photo is actually used. Never fails the caller. */
export async function reportUnsplashDownload(env: AppEnv, downloadLocation: string): Promise<void> {
  if (!env.UNSPLASH_ACCESS_KEY) return;
  try {
    await fetch(downloadLocation, { headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` }, signal: AbortSignal.timeout(5000) });
  } catch {
    /* best effort */
  }
}
