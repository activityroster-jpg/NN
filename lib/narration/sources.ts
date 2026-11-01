import { GUIDES } from "@/lib/cruising";
import { HOWTO_SCRIPTS, howToNarrationId, howToSentences } from "@/lib/cruising/howto-scripts";
import { guideSentences, splitSentences } from "@/lib/cruising/narration";
import { LESSON_SCRIPTS, lessonNarrationId, lessonSentences } from "@/lib/courses/navigation/scripts";
import { SHORTS } from "@/lib/shorts";
import { shortSentences } from "@/lib/shorts/narration";

// Everything the voice may be asked to read: the cruising guide scripts, the
// shorts, the course lesson videos and the charter know-how videos. Narration is looked up by id and recorded from this list only.

export interface NarrationSource {
  id: string;
  sentences: string[];
  speak?: Record<string, string>;
}

export function narrationSources(): NarrationSource[] {
  return [
    ...GUIDES.map((g) => ({ id: g.id, sentences: guideSentences(g), speak: g.speak })),
    ...SHORTS.map((s) => ({ id: s.id, sentences: shortSentences(s), speak: s.speak })),
    ...Object.values(LESSON_SCRIPTS).map((l) => ({ id: lessonNarrationId(l.slug), sentences: lessonSentences(l), speak: l.speak })),
    ...Object.values(HOWTO_SCRIPTS).map((h) => ({ id: howToNarrationId(h.id), sentences: howToSentences(h, splitSentences), speak: h.speak })),
  ];
}

export function narrationSource(id: string): NarrationSource | undefined {
  return narrationSources().find((s) => s.id === id);
}
