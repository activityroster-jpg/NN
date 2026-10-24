import { z } from "zod";
import type { AppEnv } from "@/lib/env";
import type { Photo } from "./pexels";

// Pixabay: free for commercial use, no attribution required (we credit anyway),
// keys issued instantly. Its API terms forbid hotlinking, so a chosen photo is
// downloaded into our R2 bucket and served from our own domain (see storage.ts).

const Response = z.object({
  totalHits: z.number().optional(),
  hits: z
    .array(
      z
        .object({
          id: z.number(),
          pageURL: z.string(),
          largeImageURL: z.string(),
          webformatURL: z.string(),
          imageWidth: z.number(),
          imageHeight: z.number(),
          user: z.string(),
          tags: z.string().optional(),
        })
        .passthrough(),
    )
    .default([]),
});

export function pixabayEnabled(env: AppEnv): boolean {
  return !!env.PIXABAY_API_KEY;
}

export async function searchPixabay(env: AppEnv, query: string, page = 1): Promise<{ photos: Photo[]; total: number }> {
  if (!env.PIXABAY_API_KEY) return { photos: [], total: 0 };
  // PIXABAY_API_BASE is only for local testing against a stand-in server.
  const u = new URL(env.PIXABAY_API_BASE ?? "https://pixabay.com/api/");
  u.searchParams.set("key", env.PIXABAY_API_KEY);
  u.searchParams.set("q", query);
  u.searchParams.set("image_type", "photo");
  u.searchParams.set("orientation", "horizontal");
  u.searchParams.set("safesearch", "true");
  u.searchParams.set("min_width", "1600");
  u.searchParams.set("per_page", "24");
  u.searchParams.set("page", String(page));
  const res = await fetch(u, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Pixabay ${res.status}`);
  const data = Response.parse(await res.json());
  return {
    total: data.totalHits ?? data.hits.length,
    photos: data.hits.map((h) => ({
      id: `pixabay:${h.id}`,
      // Temporary URL for download only; never shown to visitors.
      url: h.largeImageURL,
      thumb: h.webformatURL,
      alt: h.tags ?? "",
      photographer: h.user,
      photographerUrl: h.pageURL,
      pageUrl: h.pageURL,
      width: h.imageWidth,
      height: h.imageHeight,
      source: "pixabay",
    })),
  };
}
