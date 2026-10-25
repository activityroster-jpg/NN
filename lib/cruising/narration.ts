import type { CruisingGuide, Leg, MooringType, Wind } from "./types";

// The spoken script of a guide video, built from the guide's data. Shared by
// the player (captions and timing) and the narration API, which records only
// sentences that appear here, so nothing else can be sent to the voice service.

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+(?=[A-Z0-9"“‘(£])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const short = (s: string) => s.split(",")[0]!;
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Every capitalised word the guide uses as a name (places, bases, islands). */
function properNouns(g: CruisingGuide): Set<string> {
  const names = [g.name, g.country, g.base, g.baseMarina.name, g.baseMarina.alsoMain?.name ?? "", ...g.baseMarina.others, ...g.ports.map((p) => p.name), ...g.map.land.map((l) => l.name ?? ""), ...g.legs.flatMap((l) => [l.from, l.to])];
  const out = new Set<string>();
  for (const n of names) for (const w of n.split(/[\s,/]+/)) if (/^\p{Lu}/u.test(w)) out.add(w.replace(/'s$|’s$/, ""));
  return out;
}

/** Lower-case the first letter of a list item unless it starts with a name. */
function listItem(s: string, names: Set<string>): string {
  const first = s.split(/\s+/)[0]!.replace(/'s$|’s$/, "").replace(/[^\p{L}'-]/gu, "");
  return names.has(first) ? s : s.charAt(0).toLowerCase() + s.slice(1);
}

/** "A", "A and B", "A, B and C" (British style). Names keep their capitals. */
export const listOf = (items: string[], names?: Set<string>) => {
  const xs = names ? items.map((x) => listItem(x, names)) : items;
  return xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]!}`;
};

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** Small numbers in words, as a narrator would say them. */
export const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

export const MOOR_LABEL: Record<MooringType["kind"], string> = { marina: "Marinas", "town quay": "Town quays", buoy: "Buoys", anchor: "At anchor" };

export const windText = (w: Wind) => `The ${w.name} blows from the ${w.from}. ${w.note}`;
export const moorText = (m: MooringType) => `${MOOR_LABEL[m.kind]}: ${m.note}`;
export const dayName = (l: Leg) => WEEKDAY[l.day - 1] ?? `Day ${l.day}`;
/** The part of a day's narration before the things-to-do list. */
export const dayLead = (l: Leg) => `${dayName(l)}. ${l.from} to ${l.to}, about ${l.nm} miles. ${l.summary}${l.stop ? ` ${l.stop}` : ""}`;

export interface ScriptPart {
  key: string;
  title: string;
  narration: string;
}

export function guideScript(g: CruisingGuide): ScriptPart[] {
  const total = g.legs.reduce((n, l) => n + l.nm, 0);
  const base = g.baseMarina;
  const names = properNouns(g);
  const parts: ScriptPart[] = [
    { key: "title", title: g.name, narration: `${g.name}, ${g.country}. ${g.tagline}` },
    { key: "base", title: "Where the boats are", narration: base.note },
    { key: "when", title: "When to go", narration: g.seasons.join(" ") },
    { key: "weather", title: "Weather and winds", narration: `${g.weather.summary} ${g.weather.winds.map(windText).join(" ")}` },
    { key: "moor", title: "Where you moor", narration: `Four ways to spend the night. ${g.mooring.map(moorText).join(" ")}` },
    {
      key: "fill",
      title: "Water, power and fuel",
      narration: `Filling up. Water and shore power are available in the marinas and on most town quays, but not on buoys or at anchor. Fuel is available in ${upperFirst(
        listOf(g.ports.filter((p) => p.fuel).map((p) => p.name)),
      )}. Keep the tanks topped up whenever you pass a fuel station.`,
    },
    {
      key: "week",
      title: "A sample week",
      narration: `Now a sample week. It starts and ends in ${short(base.name)}: ${numberWord(g.legs.length)} short sailing days and about ${total} nautical miles, taking in ${upperFirst(
        listOf(g.legs.slice(0, -1).map((l) => short(l.to))),
      )}.`,
    },
    { key: "saturday", title: "Saturday: check-in", narration: `Saturday. ${g.arrival}` },
    ...g.legs.map((l) => ({
      key: `day-${l.day}`,
      title: `${dayName(l)}: ${short(l.from)} to ${short(l.to)}`,
      narration: `${dayLead(l)} While you're there: ${listOf(l.todo, names)}. ${l.overnight}`,
    })),
    { key: "close", title: "Friday evening: back to base", narration: `${g.departure} No sailing licence? Add a skipper and simply enjoy the week.` },
  ];
  return parts;
}

/** Every sentence the guide's video speaks, in order. */
export function guideSentences(g: CruisingGuide): string[] {
  return guideScript(g).flatMap((p) => splitSentences(p.narration));
}

/** Stable short hash of a sentence (cyrb53), used as its audio file name. */
export function sentenceHash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

/** The words actually spoken for a sentence, with the guide's pronunciation fixes. */
export function spokenText(g: Pick<CruisingGuide, "speak">, text: string): string {
  let out = text;
  if (g.speak) for (const k of Object.keys(g.speak).sort((a, b) => b.length - a.length)) out = out.split(k).join(g.speak[k]!);
  return out;
}

/**
 * Address of a sentence's recorded audio. The query names the spoken version,
 * so a pronunciation change gets a new address and browsers never replay an
 * old recording from their cache.
 */
export function narrationUrl(g: Pick<CruisingGuide, "id" | "speak">, text: string): string {
  return `/api/narration/${g.id}/${sentenceHash(text)}?v=${sentenceHash(spokenText(g, text))}`;
}
