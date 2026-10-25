import { GUIDES } from "@/lib/cruising";
import { guideSentences } from "@/lib/cruising/narration";
import { SHORTS } from "@/lib/shorts";
import { shortSentences } from "@/lib/shorts/narration";

// Everything the voice may be asked to read: the cruising guide scripts and
// the shorts. Narration is looked up by id and recorded from this list only.

export interface NarrationSource {
  id: string;
  sentences: string[];
  speak?: Record<string, string>;
}

export function narrationSources(): NarrationSource[] {
  return [...GUIDES.map((g) => ({ id: g.id, sentences: guideSentences(g), speak: g.speak })), ...SHORTS.map((s) => ({ id: s.id, sentences: shortSentences(s), speak: s.speak }))];
}

export function narrationSource(id: string): NarrationSource | undefined {
  return narrationSources().find((s) => s.id === id);
}
