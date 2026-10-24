import type { AppEnv } from "@/lib/env";

// Our own photo storage (Cloudflare R2). Keys look like photos/<name>.jpg and
// are served by app/media/[...key]/route.ts at /media/photos/<name>.jpg.

const MAX_BYTES = 12 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function storageEnabled(env: AppEnv): boolean {
  return !!env.PHOTOS;
}

function extFor(type: string): string {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : type === "image/avif" ? "avif" : "jpg";
}

function safeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "photo";
}

/** Store bytes and return the public path. */
export async function storePhoto(env: AppEnv, name: string, body: ArrayBuffer, contentType: string): Promise<string> {
  if (!env.PHOTOS) throw new Error("Photo storage is not set up: create the R2 bucket (docs/setup.md).");
  if (!TYPES.has(contentType)) throw new Error(`Unsupported image type ${contentType}`);
  if (body.byteLength > MAX_BYTES) throw new Error("Image larger than 12 MB");
  const key = `photos/${safeName(name)}-${Date.now().toString(36)}.${extFor(contentType)}`;
  await env.PHOTOS.put(key, body, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } });
  return `/media/${key}`;
}

/** Download a photo from its source (Pixabay) into our storage. */
export async function importPhoto(env: AppEnv, sourceUrl: string, name: string): Promise<string> {
  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const type = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0]!.trim();
  return storePhoto(env, name, await res.arrayBuffer(), type);
}
