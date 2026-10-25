import { guideSentences, short, spokenText } from "./narration";
import type { CruisingGuide, LonLat } from "./types";

// Checks a cruising guide before it ships: the week's shape, the map (no route
// over land), and the narration text (nothing that splits a sentence wrongly or
// that the voice would read out literally). Returns a list of problems; empty
// means good. Used by tests/cruising.test.ts and scripts/cruising/check.mjs.

const NM_PER_DEG_LAT = 60;

function nm(a: LonLat, b: LonLat): number {
  const k = Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  return Math.hypot((b[0] - a[0]) * k * NM_PER_DEG_LAT, (b[1] - a[1]) * NM_PER_DEG_LAT);
}

function inside(p: LonLat, ring: LonLat[]): boolean {
  const [x, y] = p;
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j]!;
    const [x2, y2] = ring[i]!;
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) c = !c;
  }
  return c;
}

/** Patterns that break sentence splitting or are read out literally by the voice. */
export const TEXT_RULES: [RegExp, string][] = [
  [/\b(e\.g|i\.e|etc|St|Mt|No|Nr|approx|vs|Dr|Mr|Mrs|Ms|Capt|Ft|ca)\./i, "abbreviation with a full stop (splits the sentence): write it out"],
  [/\d\s?(nm|NM|km|kn|kts|m)\b/, "unit abbreviation after a number: write 'miles', 'knots', 'metres'"],
  [/[°%&@#*_|<>{}[\]~^=+]/, "symbol the voice would read out: write it in words"],
  [/\.\.\.|…/, "ellipsis"],
  [/\b[A-Z]{2,}\b/, "all-capitals word (read letter by letter or shouted): write it normally or add to speak"],
  [/\s[-–—]\s/, "dash used as punctuation: use a comma or a new sentence"],
  [/[‘’“”"]/, "curly or straight quotes: leave them out"],
];

export function validateGuide(g: CruisingGuide): string[] {
  const problems: string[] = [];
  const p = (m: string) => problems.push(m);
  const rings = g.map.land.map((l) => ({ name: l.name ?? "unnamed land", shape: l.shape }));
  const onLand = (pt: LonLat) => rings.filter((r) => inside(pt, r.shape)).map((r) => r.name);

  // The week
  if (g.months.length !== 12) p("months must have 12 entries");
  if (g.legs.length !== 6) p(`expected 6 sailing days (Sunday to Friday), found ${g.legs.length}`);
  g.legs.forEach((l, i) => {
    if (l.day !== i + 1) p(`leg ${i + 1} has day ${l.day}`);
    if (l.route.length < 2) p(`day ${l.day}: route needs at least two points`);
    if (l.todo.length < 2 || l.todo.length > 4) p(`day ${l.day}: give two to four things to do`);
    const next = g.legs[i + 1];
    if (next && nm(l.route[l.route.length - 1]!, next.route[0]!) > 0.6) p(`day ${l.day} ends ${nm(l.route[l.route.length - 1]!, next.route[0]!).toFixed(1)} miles from where day ${next.day} starts`);
    const len = l.route.slice(1).reduce((n, pt, k) => n + nm(l.route[k]!, pt), 0);
    if (len < l.nm * 0.6 || len > l.nm * 1.5) p(`day ${l.day}: stated ${l.nm} miles but the drawn route is ${len.toFixed(1)} miles`);
    if (!g.ports.some((pt) => l.to.startsWith(pt.name) || l.to.includes(pt.name))) p(`day ${l.day}: no port entry matches "${l.to}"`);
  });
  const first = g.legs[0]?.route[0];
  const lastLeg = g.legs[g.legs.length - 1];
  const last = lastLeg?.route[lastLeg.route.length - 1];
  if (first && nm(first, g.baseMarina.at) > 1.5) p(`the week must start at the base marina (${g.baseMarina.name}); day 1 starts ${nm(first, g.baseMarina.at).toFixed(1)} miles away`);
  if (last && nm(last, g.baseMarina.at) > 1.5) p(`the week must end at the base marina on Friday; day 6 ends ${nm(last, g.baseMarina.at).toFixed(1)} miles away`);
  if (lastLeg && !g.baseMarina.name.includes(short(lastLeg.to)) && !short(lastLeg.to).includes(short(g.baseMarina.name).replace(/^Marina /, ""))) p(`Friday should finish at the base ("${g.baseMarina.name}"), not "${lastLeg.to}"`);

  // The map
  const [w, s, e, n] = g.map.bounds;
  const k = Math.cos((((s + n) / 2) * Math.PI) / 180);
  const aspect = ((e - w) * k) / (n - s);
  if (aspect < 1.45 || aspect > 2.1) p(`map bounds should be about 16:9 for the video frame (now ${aspect.toFixed(2)}:1)`);
  const inBounds = (pt: LonLat) => pt[0] >= w && pt[0] <= e && pt[1] >= s && pt[1] <= n;
  for (const l of g.legs) {
    for (let i = 1; i < l.route.length; i++) {
      const a = l.route[i - 1]!;
      const b = l.route[i]!;
      const hits = new Set<string>();
      for (let t = 1; t < 40; t++) for (const h of onLand([a[0] + ((b[0] - a[0]) * t) / 40, a[1] + ((b[1] - a[1]) * t) / 40])) hits.add(h);
      if (hits.size) p(`day ${l.day}: segment [${a}] → [${b}] crosses land (${[...hits].join(", ")})`);
      if (!inBounds(b)) p(`day ${l.day}: route point [${b}] is outside the map`);
    }
  }
  for (const pt of g.ports) {
    const h = onLand(pt.at);
    if (h.length) p(`port ${pt.name} [${pt.at}] is on land (${h.join(", ")}): move the marker just offshore`);
    if (!inBounds(pt.at)) p(`port ${pt.name} is outside the map`);
  }
  if (onLand(g.baseMarina.at).length) p(`base marina marker is on land`);
  if (g.baseMarina.alsoMain && onLand(g.baseMarina.alsoMain.at).length) p(`second base marker is on land`);

  // The narration
  const sentences = guideSentences(g);
  for (const sentence of sentences) {
    const spoken = spokenText(g, sentence);
    for (const [re, why] of TEXT_RULES) if (re.test(spoken)) p(`narration "${sentence.slice(0, 70)}": ${why}`);
    if (/\//.test(spoken)) p(`narration "${sentence.slice(0, 70)}": slash would be read as "slash": add a speak entry`);
    const words = sentence.split(/\s+/).length;
    if (words < 3 && !/^(Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday)\.$/.test(sentence) && !/^[A-Z][\w\s,'’-]+\.$/.test(sentence)) p(`narration fragment "${sentence}": too short, likely a bad sentence split`);
    if (sentence.length > 260) p(`narration "${sentence.slice(0, 50)}…" is ${sentence.length} characters: split it`);
    if (!/[.!?]$/.test(sentence)) p(`narration "${sentence.slice(0, 70)}" does not end with a full stop`);
  }
  for (const key of Object.keys(g.speak ?? {})) if (!sentences.some((x) => x.includes(key))) p(`speak entry "${key}" is not used in the narration`);
  return problems;
}
