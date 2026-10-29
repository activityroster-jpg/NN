// Facts and figures for Lesson 11 (weather for a charter week). Pure and
// server-safe. The Beaufort table is ported from the Boaty Jobs lesson
// "Weather for navigators", with a column on what each force means on a
// charter. The forecasts are FICTIONAL examples written for this lesson;
// the local winds come from our cruising guides (lib/cruising/guides).

export interface BeaufortForce {
  force: number;
  /** Mean wind speed band, knots (inclusive). F0 is under 1 kn; F12 has no upper limit. */
  min: number;
  max: number | null;
  name: string;
  /** What the open sea looks like (the standard descriptions, shortened). */
  sea: string;
  /** What it means on a charter yacht. */
  charter: string;
}

export const BEAUFORT: BeaufortForce[] = [
  { force: 0, min: 0, max: 0, name: "Calm", sea: "Like a mirror", charter: "Motor, or swim." },
  { force: 1, min: 1, max: 3, name: "Light air", sea: "Ripples", charter: "Too light to sail: motor." },
  { force: 2, min: 4, max: 6, name: "Light breeze", sea: "Small wavelets; crests don't break", charter: "Gentle sailing, slowly." },
  { force: 3, min: 7, max: 10, name: "Gentle breeze", sea: "Large wavelets; a few white horses", charter: "Lovely sailing." },
  { force: 4, min: 11, max: 16, name: "Moderate breeze", sea: "Small waves; fairly frequent white horses", charter: "Ideal sailing; the boat heels and goes well." },
  { force: 5, min: 17, max: 21, name: "Fresh breeze", sea: "Moderate waves; many white horses; some spray", charter: "Reef early. Upwind is wet and tiring for a new crew." },
  { force: 6, min: 22, max: 27, name: "Strong breeze", sea: "Large waves; white foam crests everywhere", charter: "Experienced crews only, well reefed. Many charter skippers stay in." },
  { force: 7, min: 28, max: 33, name: "Near gale", sea: "Sea heaps up; foam blown in streaks", charter: "Stay in harbour." },
  { force: 8, min: 34, max: 40, name: "Gale", sea: "Moderately high waves; crests break into spindrift", charter: "Stay in harbour, with extra lines and fenders." },
  { force: 9, min: 41, max: 47, name: "Severe gale", sea: "High waves; dense streaks of foam", charter: "Stay in harbour." },
  { force: 10, min: 48, max: 55, name: "Storm", sea: "Very high waves; the sea looks white", charter: "Stay in harbour." },
  { force: 11, min: 56, max: 63, name: "Violent storm", sea: "Exceptionally high waves", charter: "Stay in harbour." },
  { force: 12, min: 64, max: null, name: "Hurricane force", sea: "Air full of foam and spray", charter: "Stay in harbour." },
];

/** "11–16 kn", "less than 1 kn", "64 kn or more". */
export function knotsText(force: number): string {
  const b = BEAUFORT[force]!;
  if (b.force === 0) return "less than 1 kn";
  if (b.max === null) return `${b.min} kn or more`;
  return `${b.min}–${b.max} kn`;
}

/** The Beaufort force for a mean wind speed in whole knots. */
export function forceFor(knots: number): number {
  const k = Math.round(knots);
  for (let i = BEAUFORT.length - 1; i >= 0; i--) if (k >= BEAUFORT[i]!.min) return i;
  return 0;
}

/** A rough range for the gusts: a third to a half above the mean (more off high land, or in a bora). */
export function gustRange(knots: number): [number, number] {
  return [Math.round(knots * 1.33), Math.round(knots * 1.5)];
}

/* ------------------------------------------------------------------ */
/* Directions                                                           */
/* ------------------------------------------------------------------ */

export type Point8 = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export const POINTS: Point8[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const POINT_DEG: Record<Point8, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
export const POINT_WORD: Record<Point8, string> = {
  N: "north", NE: "north-east", E: "east", SE: "south-east", S: "south", SW: "south-west", W: "west", NW: "north-west",
};
/** "northerly", "south-westerly". */
export const windWord = (p: Point8) => `${POINT_WORD[p]}erly`;
export const opposite = (p: Point8): Point8 => POINTS[(POINTS.indexOf(p) + 4) % 8]!;

/** Compass words (as the guides write them) to degrees. */
export function degreesFor(word: string): number | null {
  const w = word.toLowerCase().trim();
  const hit = POINTS.find((p) => POINT_WORD[p] === w);
  return hit ? POINT_DEG[hit] : null;
}

/* ------------------------------------------------------------------ */
/* The sea-breeze day                                                   */
/* ------------------------------------------------------------------ */

/**
 * A typical settled summer day on a Mediterranean coast: mean wind in knots
 * by hour (local time). Illustrative, not a forecast.
 */
export const SEA_BREEZE_DAY: Array<{ hour: number; knots: number }> = [
  { hour: 6, knots: 3 }, { hour: 7, knots: 3 }, { hour: 8, knots: 2 }, { hour: 9, knots: 3 }, { hour: 10, knots: 5 },
  { hour: 11, knots: 8 }, { hour: 12, knots: 11 }, { hour: 13, knots: 13 }, { hour: 14, knots: 15 }, { hour: 15, knots: 16 },
  { hour: 16, knots: 16 }, { hour: 17, knots: 14 }, { hour: 18, knots: 11 }, { hour: 19, knots: 7 }, { hour: 20, knots: 4 },
  { hour: 21, knots: 2 }, { hour: 22, knots: 2 },
];

export function breezeAt(hour: number): number {
  const a = SEA_BREEZE_DAY.find((h) => h.hour === Math.floor(hour)) ?? SEA_BREEZE_DAY[0]!;
  const b = SEA_BREEZE_DAY.find((h) => h.hour === Math.floor(hour) + 1) ?? a;
  return a.knots + (b.knots - a.knots) * (hour - Math.floor(hour));
}

export function breezeAdvice(hour: number): string {
  if (hour < 10) return "Calm or a light land breeze off the shore. Motor, or make an early start on a longer passage.";
  if (hour < 12) return "The sea breeze is setting in, onshore. Get the sails up.";
  if (hour < 17) return "The sea breeze at its best, often force 3 to 5. Bays open to it get choppy, and entrances facing it are lively.";
  if (hour < 20) return "Easing as the land cools. A good time to arrive and anchor.";
  return "Dying away around sunset. Usually a quiet night, unless the forecast says otherwise.";
}

/* ------------------------------------------------------------------ */
/* Example forecasts to decode (fictional)                              */
/* ------------------------------------------------------------------ */

export type Decision = "go" | "wait" | "change";
export const DECISION_TEXT: Record<Decision, string> = { go: "Go", wait: "Stay put", change: "Change the plan" };

export interface ForecastPart {
  text: string;
  /** Meaning, shown when the phrase is tapped. */
  note?: string;
}

export interface Forecast {
  id: string;
  area: string;
  issued: string;
  lines: Array<{ label: string; parts: ForecastPart[] }>;
  plan: string;
  best: Decision;
  feedback: Record<Decision, string>;
}

const F = (n: number) => `force ${n} is ${knotsText(n)}`;
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

export const FORECASTS: Forecast[] = [
  {
    id: "A",
    area: "Central Adriatic (example)",
    issued: "Tuesday 07:00",
    lines: [
      { label: "Wind", parts: [
        { text: "Light and variable in the morning,", note: "Variable: no steady direction. Expect to motor first thing." },
        { text: "north-west 3 to 4 in the afternoon,", note: `The afternoon sea breeze, the maestral. North-west means it blows from the north-west. ${cap(F(3))}, ${F(4)}.` },
        { text: "locally 5.", note: `In places, usually channels and headlands: ${F(5)}.` },
      ] },
      { label: "Sea", parts: [{ text: "Smooth to slight, locally moderate.", note: "Small waves, a little bigger where the breeze is strongest in the afternoon." }] },
      { label: "Weather", parts: [{ text: "Sunny.", note: "Settled summer weather: the daily sea-breeze cycle." }] },
    ],
    plan: "Ten miles from a bay on Šolta to Milna on Brač, then a night on the town quay.",
    best: "go",
    feedback: {
      go: "A classic summer day. Motor or sail gently in the morning, enjoy the breeze after lunch, and be in Milna by mid-afternoon.",
      wait: "No need: this is as good as it gets. Waiting only means arriving in the strongest part of the breeze.",
      change: "Nothing in this forecast breaks the plan. Keep it, and enjoy the sail.",
    },
  },
  {
    id: "B",
    area: "Aegean, Cyclades (example)",
    issued: "Thursday 06:00",
    lines: [
      { label: "Wind", parts: [
        { text: "North 6 to 7,", note: `The meltemi. ${cap(F(6))}, ${F(7)}.` },
        { text: "locally 8 in the afternoon,", note: `${cap(F(8))}: a gale, in places, at the hottest part of the day.` },
        { text: "gusts to 40 knots.", note: "Gusts well above the mean, especially in the lee of high islands and in the channels between them." },
      ] },
      { label: "Sea", parts: [{ text: "Rough to very rough.", note: "Short, steep waves, worse in the channels and off the headlands." }] },
      { label: "Outlook", parts: [{ text: "Little change for 3 days.", note: "The meltemi often blows for days. Waiting a day may not help; plan for it." }] },
    ],
    plan: "Twenty miles north, straight into the wind, to the next island, with a new crew who have not sailed before.",
    best: "change",
    feedback: {
      go: "Twenty miles upwind in force 6 to 7, gusting 40, with a new crew, is miserable at best and dangerous at worst.",
      wait: "Staying put is safe, but the outlook is little change for three days: you will need a new plan, not just a later start.",
      change: "Stay in harbour today, and rework the week so the longer legs go south, downwind, or in the calmer early mornings.",
    },
  },
  {
    id: "C",
    area: "Central Adriatic (example)",
    issued: "Friday 07:00",
    lines: [
      { label: "Wind", parts: [
        { text: "North-west 3 to 4,", note: "The usual afternoon breeze, for now." },
        { text: "tonight north-east 5 to 6,", note: `A change in the night: ${F(5)}, ${F(6)}, from the north-east.` },
        { text: "gusts 35 to 45 knots,", note: "Gusts far above the mean: the mark of a bora." },
        { text: "bora.", note: "The cold north-easterly that falls off the mountains. It can arrive suddenly, even under a clear sky." },
      ] },
      { label: "Sea", parts: [{ text: "Slight, becoming moderate tonight.", note: "Waves build fast where the bora has room; close under the coast it stays flatter but the gusts are worst." }] },
    ],
    plan: "Your planned last night is at anchor in a bay that is open to the north-east.",
    best: "change",
    feedback: {
      go: "That bay is open to the north-east: a bora would blow straight in, in the dark, with violent gusts.",
      wait: "Staying in that bay is exactly what to avoid. Move before evening.",
      change: "Spend the night in a harbour or a bay sheltered from the north-east, with good holding, and arrive in daylight.",
    },
  },
];
