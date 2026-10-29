// Published lesson content, loaded by slug. Every lesson marked `published`
// in the outline must have an entry here (tested).

import type { LessonContent } from "@/lib/courses/types";

export const LESSON_CONTENT: Record<string, () => Promise<{ default: LessonContent }>> = {
  "navigating-on-a-charter": () => import("./navigating-on-a-charter"),
  "reading-the-chart": () => import("./reading-the-chart"),
  "distance-speed-and-time": () => import("./distance-speed-and-time"),
};
