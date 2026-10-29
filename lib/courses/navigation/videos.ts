import type { AppEnv } from "@/lib/env";
import { sentenceHash } from "@/lib/cruising/narration";
import { narrationPrefix, voiceEnabled } from "@/lib/cruising/voice";
import type { StoredVideo } from "@/lib/cruising/videos";
import { publishedLessons } from "./outline";
import { LESSON_SCRIPTS } from "./scripts";

// Lesson videos as MP4s for YouTube, made by the videos workflow from
// /render/lesson/<slug> and stored in R2 as videos/lessons/<slug>-<version>.mp4,
// with a .jpg thumbnail and a .json of chapter times beside each. The version
// changes when the script, the voice or the design changes.

/** Bump when lesson visuals change, so every lesson video is rendered again. */
export const LESSON_VIDEO_DESIGN = "v1";
export const LESSON_VIDEO_PREFIX = "videos/lessons/";

export function lessonVideoVersion(env: AppEnv, slug: string): string {
  return sentenceHash(JSON.stringify(LESSON_SCRIPTS[slug] ?? null) + LESSON_VIDEO_DESIGN + (voiceEnabled(env) ? narrationPrefix(env) : "device"));
}

export function lessonVideoKey(slug: string, version: string): string {
  return `${LESSON_VIDEO_PREFIX}${slug}-${version}.mp4`;
}

/** The newest stored MP4 per lesson, and whether it matches the current version. */
export async function storedLessonVideos(env: AppEnv): Promise<Map<string, StoredVideo>> {
  const out = new Map<string, StoredVideo>();
  if (!env.PHOTOS) return out;
  const all: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.PHOTOS.list({ prefix: LESSON_VIDEO_PREFIX, cursor, limit: 1000 });
    all.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  for (const l of publishedLessons()) {
    const mine = all.filter((o) => o.key.startsWith(`${LESSON_VIDEO_PREFIX}${l.slug}-`) && o.key.endsWith(".mp4")).sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());
    const currentKey = lessonVideoKey(l.slug, lessonVideoVersion(env, l.slug));
    const pick = mine.find((o) => o.key === currentKey) ?? mine[0];
    if (pick) out.set(l.slug, { key: pick.key, size: pick.size, uploaded: pick.uploaded, current: pick.key === currentKey });
  }
  return out;
}

const clock = (s: number) => {
  const t = Math.floor(s);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

/** YouTube title and description, with chapters when the render stored their times. */
export function youtubeText(lesson: { title: string; summary: string; number: number; slug: string }, total: number, url: string, chapters: { title: string; start: number }[] | null): { title: string; description: string } {
  const title = `${lesson.title} | Navigation for charter skippers, lesson ${lesson.number}`.slice(0, 100);
  const lines = [
    lesson.summary,
    "",
    `Lesson ${lesson.number} of ${total} in Navigation for charter skippers, a free course from Nautical Nomads with notes, interactive charts and marked exercises:`,
    url,
  ];
  // YouTube needs the first chapter at 0:00 and at least three, each ten seconds or longer.
  const ch = (chapters ?? []).filter((c, i, a) => i === 0 || c.start - a[i - 1]!.start >= 10);
  if (ch.length >= 3) {
    lines.push("", "Chapters");
    ch.forEach((c, i) => lines.push(`${clock(i === 0 ? 0 : c.start)} ${i === 0 ? "Introduction" : c.title}`));
  }
  lines.push("", "Training material only: not an RYA-accredited course. The Isle of Kerran practice chart is fictional; never use it to navigate.", "", "#sailing #yachtcharter #navigation #learntosail #nauticalnomads");
  return { title, description: lines.join("\n") };
}
