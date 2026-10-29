// Facts, rules of thumb and the practice cove for Lesson 9 (anchoring and
// mooring buoys). Pure and server-safe: the notes, widgets, video and
// exercises all use these numbers, so they always agree.
//
// The cove is FICTIONAL: a typical small Mediterranean bay, drawn in metres
// (x east, y south, north up), 400 m across, open to the south. There is no
// tide in it, as in most of the Mediterranean.

export interface P {
  x: number
  y: number
}

/* ------------------------------------------------------------------ */
/* Scope                                                                */
/* ------------------------------------------------------------------ */

export type Conditions = "settled" | "breezy" | "windy"

/** Rules of thumb for all-chain scope, as a multiple of the depth at the bow. */
export const SCOPE_RULES: Record<Conditions, { ratio: number; label: string; note: string }> = {
  settled: { ratio: 4, label: "Settled", note: "Light winds and a good forecast: four times the depth is the least to use." },
  breezy: { ratio: 5, label: "A breeze expected", note: "A sea breeze or a fresh night forecast: five times the depth." },
  windy: { ratio: 7, label: "Strong wind", note: "Strong wind or gusts off the hills: seven times or more, if the swinging room allows." },
};

/** A typical charter boat: about twelve metres long, drawing two metres, the bow roller a metre above the water. */
export const BOAT = { length: 12, draft: 2, bow: 1 };

/** The depth that scope is measured from: the water now, the tide still to rise, and the height of the bow roller. */
export function scopeDepth(depth: number, bow = BOAT.bow, tideToRise = 0): number {
  return depth + bow + tideToRise;
}

/** Chain to let out, rounded up to the next five metres (charter chain is usually marked every five or ten metres). */
export function chainFor(depth: number, ratio: number, bow = BOAT.bow, tideToRise = 0): number {
  return Math.ceil((scopeDepth(depth, bow, tideToRise) * ratio) / 5) * 5;
}

/** Radius of the swinging circle: the chain plus the boat's length (a little generous, which is the safe side). */
export function swingRadius(chain: number, boatLength = BOAT.length): number {
  return chain + boatLength;
}

/* ------------------------------------------------------------------ */
/* The practice cove                                                    */
/* ------------------------------------------------------------------ */

export const COVE_W = 400;
export const COVE_H = 300;

/** Land, clockwise: the hills along the top, a headland down each side. */
export const COVE_LAND: P[] = [
  { x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 190 }, { x: 372, y: 175 }, { x: 352, y: 150 }, { x: 340, y: 118 },
  { x: 328, y: 88 }, { x: 305, y: 66 }, { x: 270, y: 52 }, { x: 230, y: 46 }, { x: 190, y: 44 }, { x: 150, y: 46 },
  { x: 112, y: 54 }, { x: 86, y: 72 }, { x: 70, y: 100 }, { x: 60, y: 140 }, { x: 48, y: 185 }, { x: 34, y: 225 },
  { x: 18, y: 255 }, { x: 0, y: 268 },
];

/** The sandy beach at the head of the cove (the rest of the shore is rock). */
export const BEACH = { from: 112, to: 290 };

/** The buoyed swimming area off the beach: keep out. */
export const SWIM_ZONE: P[] = [
  { x: 118, y: 52 }, { x: 150, y: 46 }, { x: 190, y: 44 }, { x: 230, y: 46 }, { x: 270, y: 52 }, { x: 288, y: 60 },
  { x: 288, y: 80 }, { x: 118, y: 80 },
];

/** Meadows of Posidonia seagrass (ellipses): protected, and poor holding. */
export const SEAGRASS = [
  { cx: 150, cy: 150, rx: 44, ry: 26 },
  { cx: 272, cy: 192, rx: 48, ry: 28 },
  { cx: 205, cy: 262, rx: 62, ry: 22 },
  { cx: 108, cy: 232, rx: 32, ry: 22 },
  { cx: 330, cy: 250, rx: 30, ry: 20 },
];

/** Within this distance of a rocky shore the seabed is rock. */
const ROCK_BAND = 22;

/** Boats already at anchor: where their anchors are and how much chain each has out. */
export const OTHER_BOATS: Array<{ id: string; anchor: P; chain: number }> = [
  { id: "A", anchor: { x: 122, y: 118 }, chain: 30 },
  { id: "B", anchor: { x: 282, y: 124 }, chain: 30 },
  { id: "C", anchor: { x: 215, y: 232 }, chain: 45 },
];

export const r1 = (n: number) => Math.round(n * 10) / 10;

function insidePoly(p: P, poly: P[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function segDistance(p: P, a: P, b: P): { d: number; at: P } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  const at = { x: a.x + k * dx, y: a.y + k * dy };
  return { d: Math.hypot(p.x - at.x, p.y - at.y), at };
}

/** Distance in metres to the shore, ignoring the edges of the drawing, and the nearest shore point. */
function shore(p: P): { d: number; at: P } {
  let best = { d: Infinity, at: p };
  for (let i = 2; i < COVE_LAND.length - 1; i++) {
    const s = segDistance(p, COVE_LAND[i]!, COVE_LAND[i + 1]!);
    if (s.d < best.d) best = s;
  }
  return best;
}

export const isCoveLand = (p: P) => insidePoly(p, COVE_LAND);
export const inSwimZone = (p: P) => insidePoly(p, SWIM_ZONE);

/** Depth in metres (no tide). Land returns 0. */
export function coveDepth(p: P): number {
  if (isCoveLand(p)) return 0;
  return 14 * (1 - Math.exp(-shore(p).d / 110));
}

export type Seabed = "sand" | "seagrass" | "rock";

export const SEABED_TEXT: Record<Seabed, string> = {
  sand: "Sand: good holding",
  seagrass: "Posidonia seagrass: poor holding, and protected",
  rock: "Rock: the anchor may not dig in, or may jam",
};

export function seabedAt(p: P): Seabed {
  if (SEAGRASS.some((e) => ((p.x - e.cx) / e.rx) ** 2 + ((p.y - e.cy) / e.ry) ** 2 <= 1)) return "seagrass";
  const s = shore(p);
  const onBeach = s.at.y < 60 && s.at.x >= BEACH.from && s.at.x <= BEACH.to;
  if (!onBeach && s.d < ROCK_BAND) return "rock";
  return "sand";
}

/** The least depth inside a circle (sampled), for checking the whole swinging circle. */
export function leastDepthIn(c: P, r: number): number {
  let least = coveDepth(c);
  for (let ring = 1; ring <= 4; ring++) {
    const rr = (r * ring) / 4;
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      const q = { x: c.x + rr * Math.cos(a), y: c.y + rr * Math.sin(a) };
      if (q.x < 0 || q.x > COVE_W || q.y > COVE_H) continue;
      least = Math.min(least, coveDepth(q));
    }
  }
  return least;
}

/** Does a circle cross the swimming area? */
export function circleInSwimZone(c: P, r: number): boolean {
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    for (const rr of [r, r / 2]) if (inSwimZone({ x: c.x + rr * Math.cos(a), y: c.y + rr * Math.sin(a) })) return true;
  }
  return inSwimZone(c);
}

/* ------------------------------------------------------------------ */
/* Wind and the cove                                                    */
/* ------------------------------------------------------------------ */

export type Point8 = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export const POINTS: Point8[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const POINT_DEG: Record<Point8, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
export const POINT_WORD: Record<Point8, string> = {
  N: "north", NE: "north-east", E: "east", SE: "south-east", S: "south", SW: "south-west", W: "west", NW: "north-west",
};

/** How the cove (open to the south) suits a wind from each direction. */
export function coveShelter(wind: Point8): { ok: boolean; text: string } {
  if (wind === "S" || wind === "SE" || wind === "SW")
    return { ok: false, text: `A ${POINT_WORD[wind]}erly blows straight into the cove, with a swell behind it. No shelter: go somewhere else for the night.` };
  if (wind === "E" || wind === "W")
    return { ok: true, text: `A ${POINT_WORD[wind]}erly blows across the mouth. The ${wind === "E" ? "east" : "west"} headland gives some shelter, but expect a roll if it freshens.` };
  return { ok: true, text: `A ${POINT_WORD[wind]}erly blows off the land: flat water, though gusts can come down off the hills.` };
}

/** Where a boat lies: downwind of its anchor, a little inside the chain length, bow to the wind. */
export function boatPosition(anchor: P, chain: number, windFromDeg: number): P {
  const a = (windFromDeg * Math.PI) / 180;
  const d = chain * 0.85 + BOAT.length / 2;
  // A wind from `windFromDeg` pushes the boat the opposite way: x east, y south.
  return { x: anchor.x - Math.sin(a) * d, y: anchor.y + Math.cos(a) * d };
}

export interface SpotCheck {
  depth: number;
  chain: number;
  radius: number;
  seabed: Seabed;
  least: number;
  problems: string[];
  warnings: string[];
}

/** Everything wrong (problems) or worth a thought (warnings) about dropping the anchor at `p`. */
export function checkSpot(p: P, ratio: number, wind: Point8): SpotCheck {
  const depth = coveDepth(p);
  const chain = chainFor(depth, ratio);
  const radius = swingRadius(chain);
  const seabed = seabedAt(p);
  const least = leastDepthIn(p, radius);
  const problems: string[] = [];
  const warnings: string[] = [];
  if (isCoveLand(p)) problems.push("That is on land.");
  if (seabed === "seagrass") problems.push("You are over Posidonia seagrass: the anchor drags through it, and it is protected. Move to a sandy patch.");
  if (seabed === "rock") problems.push("Rock: the anchor may skid or jam. Move out onto the sand.");
  if (depth < BOAT.draft + 1) problems.push(`Only ${r1(depth)} metres here: too shallow for a two-metre keel.`);
  else if (least < BOAT.draft + 1) problems.push(`Your swinging circle reaches water ${r1(Math.max(0, least))} metres deep: you could swing onto the shallows or the rocks.`);
  if (circleInSwimZone(p, radius)) problems.push("Your swinging circle crosses the buoyed swimming area.");
  if (ratio < 4) problems.push(`Three times the depth is too little: the chain lifts and the anchor breaks out.`);
  for (const b of OTHER_BOATS) {
    const theirs = swingRadius(b.chain);
    const gap = Math.hypot(p.x - b.anchor.x, p.y - b.anchor.y);
    if (gap < Math.max(theirs, radius) + 5) problems.push(`Too close to boat ${b.id}: as you swing you could hit it, or lie over its chain.`);
    else if (gap < theirs + radius) warnings.push(`Your circle overlaps boat ${b.id}'s. Fine while you swing together, but a wind shift can bring you close.`);
  }
  if (depth > 12) warnings.push(`It is ${r1(depth)} metres deep here: you need ${chain} metres of chain. Check you carry that much.`);
  const shelter = coveShelter(wind);
  if (!shelter.ok) problems.push(shelter.text);
  return { depth, chain, radius, seabed, least, problems, warnings };
}

/** A good spot, used by the video and as the widget's "show me" answer. */
export const GOOD_SPOT: P = { x: 205, y: 150 };
