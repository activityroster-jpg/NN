import { GUIDES } from "@/lib/cruising";
import { spokenText } from "@/lib/cruising/narration";
import { TEXT_RULES } from "@/lib/cruising/validate";
import { sceneSentences, shortSentences } from "./narration";
import type { Short } from "./types";

// Checks a short before it ships: a hook, a sensible length for TikTok, and
// narration the voice reads properly. Returns problems; empty means good.

const MAX_WORDS = 130; // about 55 seconds with the pauses, at the narrator's pace
const DIAGRAMS: Record<string, number[]> = { "med-mooring": [2, 3, 4, 5] };

export function validateShort(s: Short): string[] {
  const problems: string[] = [];
  const p = (m: string) => problems.push(m);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) p(`id "${s.id}" must be a lower-case slug`);
  if (GUIDES.some((g) => g.id === s.id)) p(`id "${s.id}" clashes with a cruising guide`);
  if (s.title.length > 60) p("title longer than 60 characters");
  if (s.scenes.length < 4 || s.scenes.length > 12) p(`${s.scenes.length} scenes: use 4 to 12`);
  if (!s.scenes[0]?.heading) p("the first scene needs a heading: it is the hook");
  if (s.scenes[s.scenes.length - 1]?.visual.kind !== "end") p("the last scene should be the end card");
  if (!s.scenes.some((sc) => sc.visual.kind === "footage")) p("no footage scene");

  s.scenes.forEach((sc, i) => {
    const v = sc.visual;
    if (v.kind === "footage") {
      if (v.footage.q.length > 100 || !v.footage.q.trim()) p(`scene ${i + 1}: footage search must be 1 to 100 characters`);
    } else if (v.kind === "diagram" && !DIAGRAMS[v.id]?.includes(v.step)) p(`scene ${i + 1}: diagram ${v.id} has no step ${v.step}`);
    if (sceneSentences(sc).length === 0) p(`scene ${i + 1}: nothing to say`);
    if (sc.badge && sc.badge.length > 16) p(`scene ${i + 1}: badge longer than 16 characters`);
    if (sc.heading && sc.heading.length > 22) p(`scene ${i + 1}: heading longer than 22 characters (two phone-width lines)`);
  });

  const sentences = shortSentences(s);
  let words = 0;
  for (const sentence of sentences) {
    words += sentence.split(/\s+/).length;
    const spoken = spokenText(s, sentence);
    for (const [re, why] of TEXT_RULES) if (re.test(spoken)) p(`narration "${sentence.slice(0, 70)}": ${why}`);
    if (/\//.test(spoken)) p(`narration "${sentence.slice(0, 70)}": slash would be read as "slash": add a speak entry`);
    if (sentence.split(/\s+/).length < 3) p(`narration fragment "${sentence}": too short, likely a bad sentence split`);
    if (sentence.length > 170) p(`narration "${sentence.slice(0, 50)}…" is ${sentence.length} characters: too long for one caption`);
    if (!/[.!?]$/.test(sentence)) p(`narration "${sentence.slice(0, 70)}" does not end with a full stop`);
  }
  if (words > MAX_WORDS) p(`${words} words: over ${MAX_WORDS}, the video would run past a minute`);
  for (const key of Object.keys(s.speak ?? {})) if (!sentences.some((x) => x.includes(key))) p(`speak entry "${key}" is not used in the narration`);
  if (s.caption.length > 300) p("caption longer than 300 characters");
  for (const h of s.hashtags) if (!/^[a-z0-9]+$/.test(h)) p(`hashtag "${h}": letters and digits only, without the #`);
  if (s.sources.length === 0) p("list what the content was checked against");
  return problems;
}
