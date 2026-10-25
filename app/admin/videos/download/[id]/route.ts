import { requireAdmin } from "@/lib/admin/auth";
import { guideById } from "@/lib/cruising";
import { storedVideos } from "@/lib/cruising/videos";
import { getEnvAsync } from "@/lib/env";

// Admin-only download of a guide video MP4.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const g = guideById(id);
  const env = await getEnvAsync();
  if (!g || !env.PHOTOS) return new Response("not found", { status: 404 });
  const v = (await storedVideos(env)).get(id);
  const obj = v ? await env.PHOTOS.get(v.key) : null;
  if (!obj) return new Response("This video hasn't been made yet.", { status: 404 });
  const name = `${g.name} - Nautical Nomads.mp4`.replace(/[^\w .,-]/g, "");
  return new Response(obj.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(obj.size),
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
