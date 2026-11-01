"use client";

import { useCallback, useMemo } from "react";
import ScenesStage from "@/components/video/ScenesStage";
import { buildHowToScenes } from "@/components/cruising/HowToVideo";
import { narrationUrl } from "@/lib/cruising/narration";
import { howToNarrationId, type HowToScript } from "@/lib/cruising/howto-scripts";

// A charter know-how video on the renderer's stage. The thumbnail is the
// guide's title scene.
export default function HowToRenderStage({ script, kicker, summary }: { script: HowToScript; kicker: string; summary: string }) {
  const scenes = useMemo(() => buildHowToScenes(script, { kicker, summary, recorded: true }), [script, kicker, summary]);
  const audioUrl = useCallback((text: string) => narrationUrl({ id: howToNarrationId(script.id), speak: script.speak }, text), [script]);
  const poster = useCallback((timeline: { start: number; end: number }[]) => (timeline[1] ? Math.max(0, timeline[1].end - 0.8) : 0), []);
  return <ScenesStage scenes={scenes} audioUrl={audioUrl} poster={poster} />;
}
