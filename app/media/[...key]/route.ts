import { getEnvAsync } from "@/lib/env";

// Serves self-hosted photos and the guide video MP4s / thumbnails from R2.
// Supports byte ranges so video players and crawlers can seek.
const ALLOWED = ["photos/", "videos/cruising/"];

export async function GET(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const env = await getEnvAsync();
  if (!env.PHOTOS) return new Response("not found", { status: 404 });
  const { key } = await ctx.params;
  const k = key.join("/");
  if (!ALLOWED.some((p) => k.startsWith(p)) || k.includes("..")) return new Response("not found", { status: 404 });

  const range = req.headers.get("range");
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
  if (m && (m[1] || m[2])) {
    const head = await env.PHOTOS.head(k);
    if (!head) return new Response("not found", { status: 404 });
    const size = head.size;
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response("range not satisfiable", { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const obj = await env.PHOTOS.get(k, { range: { offset: start, length: end - start + 1 } });
    if (!obj) return new Response("not found", { status: 404 });
    return new Response(obj.body, {
      status: 206,
      headers: {
        "Content-Type": head.httpMetadata?.contentType ?? "application/octet-stream",
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const obj = await env.PHOTOS.get(k);
  if (!obj) return new Response("not found", { status: 404 });
  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType ?? (k.endsWith(".mp4") ? "video/mp4" : "image/jpeg"));
  headers.set("Cache-Control", obj.httpMetadata?.cacheControl ?? (k.startsWith("photos/") ? "public, max-age=31536000, immutable" : "public, max-age=86400"));
  headers.set("Content-Length", String(obj.size));
  headers.set("Accept-Ranges", "bytes");
  headers.set("ETag", obj.httpEtag);
  return new Response(obj.body, { headers });
}
