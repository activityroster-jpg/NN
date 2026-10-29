import { TEXT_RULES } from "@/lib/cruising/validate";
import { splitSentences, spokenText } from "@/lib/cruising/narration";
import { navigatingOnACharter } from "@/components/courses/lessons/navigating-on-a-charter/script";
import { anchoringAndMooring } from "@/components/courses/lessons/anchoring-and-mooring/script";
import { weatherForACharterWeek } from "@/components/courses/lessons/weather-for-a-charter-week/script";
import { publishedLessons } from "./outline";

// The spoken script of every lesson video, as plain data (no React), so the
// narration API can record it ahead of time and tests can check it. Each
// lesson's client.tsx pairs these lines with its scene visuals.

export interface SceneScript {
  title: string;
  narration: string;
  seconds?: number;
}

export interface LessonScript {
  slug: string;
  speak?: Record<string, string>;
  scenes: SceneScript[];
}

export const LESSON_SCRIPTS: Record<string, LessonScript> = {
  "navigating-on-a-charter": navigatingOnACharter,
  "anchoring-and-mooring": anchoringAndMooring,
  "weather-for-a-charter-week": weatherForACharterWeek,
};

export const lessonNarrationId = (slug: string) => `lesson-${slug}`;

export function lessonSentences(s: LessonScript): string[] {
  return s.scenes.flatMap((sc) => splitSentences(sc.narration));
}

/** Problems with a script's narration text; empty means the voice will read it well. */
export function validateScript(s: LessonScript): string[] {
  const problems: string[] = [];
  const sentences = lessonSentences(s);
  for (const sentence of sentences) {
    const spoken = spokenText(s, sentence);
    for (const [re, why] of TEXT_RULES) if (re.test(spoken)) problems.push(`"${sentence.slice(0, 70)}": ${why}`);
    if (/\//.test(spoken)) problems.push(`"${sentence.slice(0, 70)}": slash would be read as "slash": add a speak entry`);
    if (sentence.split(/\s+/).length < 3) problems.push(`fragment "${sentence}": too short, likely a bad sentence split`);
    if (sentence.length > 260) problems.push(`"${sentence.slice(0, 50)}…" is ${sentence.length} characters: split it`);
    if (!/[.!?]$/.test(sentence)) problems.push(`"${sentence.slice(0, 70)}" does not end with a full stop`);
  }
  for (const key of Object.keys(s.speak ?? {})) if (!sentences.some((x) => x.includes(key))) problems.push(`speak entry "${key}" is not used`);
  for (const l of publishedLessons()) if (!LESSON_SCRIPTS[l.slug]) problems.push(`published lesson ${l.slug} has no script`);
  return problems;
}
