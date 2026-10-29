import { requireAdmin } from "@/lib/admin/auth";
import { locateLesson } from "@/lib/courses/navigation/outline";
import { storedLessonVideos } from "@/lib/courses/navigation/videos";
import { getEnvAsync } from "@/lib/env";

// Admin-only download of a lesson video MP4 (?thumb=1 for its thumbnail).
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await ctx.params;
  const loc = locateLesson(slug);
  const env = await getEnvAsync();
  if (!loc || !env.PHOTOS) return new Response("not found", { status: 404 });
  const v = (await storedLessonVideos(env)).get(slug);
  const thumb = new URL(req.url).searchParams.get("thumb") === "1";
  const key = v ? (thumb ? v.key.replace(/\.mp4$/, ".jpg") : v.key) : null;
  const obj = key ? await env.PHOTOS.get(key) : null;
  if (!obj) return new Response("This video hasn't been made yet.", { status: 404 });
  const name = `Lesson ${String(loc.number).padStart(2, "0")} - ${loc.lesson.title} - Nautical Nomads.${thumb ? "jpg" : "mp4"}`.replace(/[^\w .,-]/g, "");
  return new Response(obj.body, {
    headers: {
      "Content-Type": thumb ? "image/jpeg" : "video/mp4",
      "Content-Length": String(obj.size),
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
