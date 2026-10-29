"use client";

import { useCallback, useMemo } from "react";
import ScenesStage from "@/components/video/ScenesStage";
import { narrationUrl } from "@/lib/cruising/narration";
import type { CruisingGuide } from "@/lib/cruising/types";
import { buildGuideScenes } from "./GuideVideo";

export type { RenderPlan } from "@/components/video/ScenesStage";

const HOLD = 0.7;

// The guide video on the renderer's stage. The thumbnail is the finished week map.
export default function RenderStage({ guide }: { guide: CruisingGuide }) {
  const scenes = useMemo(() => buildGuideScenes(guide, true), [guide]);
  const audioUrl = useCallback((text: string) => narrationUrl(guide, text), [guide]);
  const poster = useCallback(
    (timeline: { start: number; end: number }[]) => {
      const weekIndex = Math.max(0, scenes.findIndex((s) => s.title === "A sample week"));
      return Math.max(0, timeline[weekIndex]!.end - HOLD - 0.05);
    },
    [scenes],
  );
  return <ScenesStage scenes={scenes} audioUrl={audioUrl} poster={poster} />;
}
