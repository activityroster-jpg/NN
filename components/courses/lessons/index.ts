// Published lesson content, loaded by slug. Every lesson marked `published`
// in the outline must have an entry here (tested).

import type { LessonContent } from "@/lib/courses/types";

export const LESSON_CONTENT: Record<string, () => Promise<{ default: LessonContent }>> = {
  "navigating-on-a-charter": () => import("./navigating-on-a-charter"),
  "plotter-apps-and-the-plan": () => import("./plotter-apps-and-the-plan"),
  "charter-navigation-quiz": () => import("./charter-navigation-quiz"),
};
