import { getEnvAsync } from "@/lib/env";

// Serves self-hosted photos from R2 with long cache headers.
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const env = await getEnvAsync();
  if (!env.PHOTOS) return new Response("not found", { status: 404 });
  const { key } = await ctx.params;
  const k = key.join("/");
  if (!k.startsWith("photos/") || k.includes("..")) return new Response("not found", { status: 404 });
  const obj = await env.PHOTOS.get(k);
  if (!obj) return new Response("not found", { status: 404 });
  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType ?? "image/jpeg");
  headers.set("Cache-Control", obj.httpMetadata?.cacheControl ?? "public, max-age=31536000, immutable");
  headers.set("ETag", obj.httpEtag);
  return new Response(obj.body, { headers });
}
