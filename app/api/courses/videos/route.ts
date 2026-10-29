import { narrationStatus } from "@/lib/cruising/prerecord";
import { lessonNarrationId } from "@/lib/courses/navigation/scripts";
import { publishedLessons } from "@/lib/courses/navigation/outline";
import { lessonVideoKey, lessonVideoVersion, storedLessonVideos } from "@/lib/courses/navigation/videos";
import { getEnvAsync } from "@/lib/env";

// Which lesson videos need rendering: used by the videos workflow. A lesson
// is ready to render only when all of its narration is recorded.
export async function GET() {
  const env = await getEnvAsync();
  const [stored, narration] = await Promise.all([storedLessonVideos(env), narrationStatus(env)]);
  const lessons = publishedLessons().map((l) => {
    const version = lessonVideoVersion(env, l.slug);
    const n = narration.get(lessonNarrationId(l.slug)) ?? { recorded: 0, total: 0 };
    return {
      id: l.slug,
      title: l.title,
      version,
      key: lessonVideoKey(l.slug, version),
      current: stored.get(l.slug)?.current ?? false,
      ready: n.total > 0 && n.recorded === n.total,
      narration: `${n.recorded}/${n.total}`,
    };
  });
  return Response.json({ lessons }, { headers: { "Cache-Control": "no-store" } });
}
