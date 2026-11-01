import { requireAdmin } from "@/lib/admin/auth";
import { howToById } from "@/lib/cruising/howto";
import { storedHowToVideos } from "@/lib/cruising/howto-videos";
import { getEnvAsync } from "@/lib/env";

// Admin-only download of a charter know-how video MP4 (?thumb=1 for its thumbnail).
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const g = howToById(id);
  const env = await getEnvAsync();
  if (!g || !env.PHOTOS) return new Response("not found", { status: 404 });
  const v = (await storedHowToVideos(env)).get(id);
  const thumb = new URL(req.url).searchParams.get("thumb") === "1";
  const key = v ? (thumb ? v.key.replace(/\.mp4$/, ".jpg") : v.key) : null;
  const obj = key ? await env.PHOTOS.get(key) : null;
  if (!obj) return new Response("This video hasn't been made yet.", { status: 404 });
  const name = `${g.title} - Nautical Nomads.${thumb ? "jpg" : "mp4"}`.replace(/[^\w .,-]/g, "");
  return new Response(obj.body, {
    headers: {
      "Content-Type": thumb ? "image/jpeg" : "video/mp4",
      "Content-Length": String(obj.size),
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
