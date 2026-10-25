import { narrationUrl, sentenceHash, splitSentences, spokenText } from "@/lib/cruising/narration";
import type { Short, ShortScene } from "./types";

// The spoken script of a short. The narration API records only sentences
// that appear here, so nothing else can be sent to the voice service.

/** Spoken lines of a scene: the lead (uncaptioned) then the narration. */
export function sceneSentences(sc: ShortScene): { text: string; captioned: boolean }[] {
  return [...(sc.lead ? splitSentences(sc.lead).map((text) => ({ text, captioned: false })) : []), ...splitSentences(sc.narration).map((text) => ({ text, captioned: true }))];
}

export function shortSentences(s: Short): string[] {
  return s.scenes.flatMap((sc) => sceneSentences(sc).map((x) => x.text));
}

export const shortSpoken = (s: Short, text: string) => spokenText(s, text);
export const shortNarrationUrl = (s: Short, text: string) => narrationUrl(s, text);
export { sentenceHash };

/** Rough length in seconds when the recording cannot be measured (local preview). */
export function estimateSeconds(text: string): number {
  return Math.max(1.2, text.split(/\s+/).length * 0.4 + 0.3);
}
