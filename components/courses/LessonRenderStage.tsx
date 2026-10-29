"use client";

import { useCallback, useMemo } from "react";
import { brandIntroScene } from "@/components/cruising/GuideVideo";
import ScenesStage from "@/components/video/ScenesStage";
import { narrationUrl } from "@/lib/cruising/narration";
import { lessonNarrationId } from "@/lib/courses/navigation/scripts";
import { LESSON_SCENES } from "./lessons/scenes";

// A lesson video on the renderer's stage: the brand intro, then the lesson's
// own scenes. The thumbnail is the lesson's title scene.
export default function LessonRenderStage({ slug, number, title, speak }: { slug: string; number: number; title: string; speak?: Record<string, string> }) {
  const scenes = useMemo(() => [brandIntroScene("NAVIGATION FOR CHARTER SKIPPERS", title, `Lesson ${number}`, "/api/narration/intro"), ...(LESSON_SCENES[slug] ?? [])], [slug, number, title]);
  const audioUrl = useCallback((text: string) => narrationUrl({ id: lessonNarrationId(slug), speak }, text), [slug, speak]);
  const poster = useCallback((timeline: { start: number; end: number }[]) => (timeline[1] ? Math.max(0, timeline[1].end - 0.8) : 0), []);
  return <ScenesStage scenes={scenes} audioUrl={audioUrl} poster={poster} />;
}
