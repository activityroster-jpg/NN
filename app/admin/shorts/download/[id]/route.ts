import { requireAdmin } from "@/lib/admin/auth";
import { getEnvAsync } from "@/lib/env";
import { shortById } from "@/lib/shorts";
import { readManifest } from "@/lib/shorts/footage";
import { shortVersion, storedShorts } from "@/lib/shorts/videos";

// Admin-only download of a short's MP4.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const s = shortById(id);
  const env = await getEnvAsync();
  if (!s || !env.PHOTOS) return new Response("not found", { status: 404 });
  const versions = new Map([[s.id, shortVersion(env, s, await readManifest(env, s.id))]]);
  const v = (await storedShorts(env, versions)).get(id);
  const obj = v ? await env.PHOTOS.get(v.key) : null;
  if (!obj) return new Response("This video hasn't been made yet.", { status: 404 });
  const name = `${s.title} - Nautical Nomads.mp4`.replace(/[^\w .,-]/g, "");
  return new Response(obj.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(obj.size),
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
