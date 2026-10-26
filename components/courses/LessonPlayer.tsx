"use client";

// The lesson "video": the guide player (itself ported from the Boaty Jobs
// course player) with the lesson's recorded narration wired in. Scenes are
// built by each lesson; the spoken text comes from the lesson's script so
// the narration API can record it ahead of time.

import GuidePlayer, { fade, phase, SceneTitle, Stage, type Scene } from "@/components/cruising/GuidePlayer";
import { narrationUrl, splitSentences } from "@/lib/cruising/narration";
import { lessonNarrationId } from "@/lib/courses/navigation/scripts";

export { fade, phase, SceneTitle, Stage, splitSentences };
export type { Scene };

export default function LessonPlayer({ slug, title, scenes, speak, poster = 1 }: { slug: string; title: string; scenes: Scene[]; speak?: Record<string, string>; poster?: number }) {
  const source = { id: lessonNarrationId(slug), speak };
  return <GuidePlayer title={title} scenes={scenes} pronounce={speak} poster={poster} audioUrl={(sentence) => narrationUrl(source, sentence)} />;
}
