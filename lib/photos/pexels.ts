import { z } from "zod";
import type { AppEnv } from "@/lib/env";

// Stock photo search for the admin, through the Pexels API. Pexels photos are
// free for commercial use without attribution, but we show a credit anyway and
// link back, as their API guidelines ask. Only the admin calls this; the public
// site just displays the chosen photo URL.

export interface Photo {
  id: string;
  /** Large landscape rendition for heroes (Pexels serves it from its CDN). */
  url: string;
  thumb: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  pageUrl: string;
  width: number;
  height: number;
  /** Unsplash only: endpoint to ping when the photo is used. */
  downloadLocation?: string;
  source?: "pexels" | "unsplash";
}

const Response = z.object({
  photos: z
    .array(
      z
        .object({
          id: z.number(),
          width: z.number(),
          height: z.number(),
          url: z.string(),
          alt: z.string().nullable().optional(),
          photographer: z.string(),
          photographer_url: z.string(),
          src: z.object({ large2x: z.string(), large: z.string(), landscape: z.string(), medium: z.string() }).passthrough(),
        })
        .passthrough(),
    )
    .default([]),
  total_results: z.number().optional(),
});

export function pexelsEnabled(env: AppEnv): boolean {
  return !!env.PEXELS_API_KEY;
}

export async function searchPhotos(env: AppEnv, query: string, page = 1): Promise<{ photos: Photo[]; total: number }> {
  if (!env.PEXELS_API_KEY) return { photos: [], total: 0 };
  const u = new URL("https://api.pexels.com/v1/search");
  u.searchParams.set("query", query);
  u.searchParams.set("orientation", "landscape");
  u.searchParams.set("per_page", "24");
  u.searchParams.set("page", String(page));
  const res = await fetch(u, { headers: { Authorization: env.PEXELS_API_KEY }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = Response.parse(await res.json());
  return {
    total: data.total_results ?? data.photos.length,
    photos: data.photos.map((p) => ({
      id: String(p.id),
      url: p.src.large2x,
      thumb: p.src.medium,
      alt: p.alt ?? "",
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      pageUrl: p.url,
      width: p.width,
      height: p.height,
      source: "pexels",
    })),
  };
}

/** Starting searches per destination, tuned for the kind of photo a hero needs. */
export const SUGGESTED_QUERIES: Record<string, string> = {
  croatia: "Hvar Croatia sailing yacht sea",
  "greece-athens": "Hydra Greece harbour sailing",
  sardinia: "La Maddalena Sardinia turquoise sea boat",
  bvi: "British Virgin Islands catamaran anchored",
  "greece-ionian": "Lefkada Greece beach sailing",
  turkey: "Göcek Turkey bay sailing boat",
  balearics: "Mallorca cala sailing boat",
  sicily: "Aeolian islands Stromboli sea",
  corsica: "Bonifacio Corsica cliffs sea",
  montenegro: "Bay of Kotor Montenegro",
  seychelles: "Seychelles granite beach catamaran",
  thailand: "Phang Nga Bay Thailand limestone boat",
  monohull: "sailing yacht heeling blue sea",
  catamaran: "catamaran sailing turquoise water",
};
