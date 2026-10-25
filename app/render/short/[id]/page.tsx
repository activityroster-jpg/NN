import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShortStage, { type SceneFootage } from "@/components/shorts/ShortStage";
import { voiceEnabled } from "@/lib/cruising/voice";
import { getEnvAsync } from "@/lib/env";
import { shortById } from "@/lib/shorts";
import { footageScenes, readManifest } from "@/lib/shorts/footage";

// Bare 1080×1920 overlay stage used by the videos workflow to render shorts.
export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };

export default async function RenderShortPage({ params }: { params: Promise<{ id: string }> }) {
  const s = shortById((await params).id);
  if (!s) notFound();
  const env = await getEnvAsync();
  const footage: Record<number, SceneFootage> = {};
  for (const x of footageScenes(s, await readManifest(env, s.id))) if (x.pick) footage[x.index] = { url: `/media/${x.pick.key}`, start: x.footage.start ?? 0 };
  return <ShortStage short={s} footage={footage} bed={voiceEnabled(env) ? "/api/narration/bed" : null} />;
}
