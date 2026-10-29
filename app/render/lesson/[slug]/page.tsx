import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonRenderStage from "@/components/courses/LessonRenderStage";
import { locateLesson } from "@/lib/courses/navigation/outline";
import { LESSON_SCRIPTS } from "@/lib/courses/navigation/scripts";

// Bare 1920×1080 stage used by the videos workflow to render lesson MP4s.
export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };

export default async function RenderLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loc = locateLesson(slug);
  const script = LESSON_SCRIPTS[slug];
  if (!loc || !loc.lesson.published || !script) notFound();
  return <LessonRenderStage slug={slug} number={loc.number} title={loc.lesson.title} speak={script.speak} />;
}
