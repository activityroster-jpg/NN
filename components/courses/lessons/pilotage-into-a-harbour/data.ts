// Numbers for the pilotage lesson, all computed from the practice chart:
// the plan into Port Kerran up its leading line, a clearing bearing on the
// church spire for the arrival, and the checks along the way. Ported from
// the Boaty Jobs pilotage lesson without the tidal working: on a
// Mediterranean charter the tide is too small to change the plan, so the
// depths here are the charted ones. Pure functions and constants, so the
// server-rendered notes, the widgets, the scenes and the exercises agree.

import { formatBearing, norm360, reciprocal, rhumbBearing, rhumbDistance, type LatLon } from "@/lib/courses/geo";
import { LEADING_LINE, depthAt, feature } from "@/lib/courses/navigation/practice-chart";
import {
  MEW_CLEAR, VAR, VAR_EXACT_TEXT, VAR_TEXT, WRECK_BY_MEW_LINE, assess, cables, clearingBearing, limitText, say, signedDiff, sixteenPoint,
  toMagnetic, toTrue, type Limit,
} from "./transits";

export { MEW_CLEAR, VAR, VAR_EXACT_TEXT, VAR_TEXT, WRECK_BY_MEW_LINE, assess, cables, limitText, say, signedDiff, sixteenPoint, toMagnetic, toTrue };
export type { Limit };

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

export const round1 = (n: number) => Math.round(n * 10) / 10;
export const T = (b: number) => formatBearing(b, "T");
export const M = (b: number) => formatBearing(b, "M");
/** Cables as text without a trailing ".0": "6.5", "5". */
export const cab = (nm: number) => cables(nm).replace(/\.0$/, "");

/** Relative bearing of a mark from the bow: "about 10° on the starboard bow". */
export function onTheBow(heading: number, bearing: number): string {
  const rel = signedDiff(bearing, heading);
  const deg = Math.max(5, Math.round(Math.abs(rel) / 5) * 5);
  if (Math.abs(rel) < 3) return "dead ahead";
  return `about ${deg}° on the ${rel > 0 ? "starboard" : "port"} bow`;
}

/* ------------------------------------------------------------------ */
/* The boat and the marks                                              */
/* ------------------------------------------------------------------ */

/** The course yacht's draught (m): a typical 40 to 45 foot charter yacht. */
export const DRAUGHT = 2.0;
/** Speed under engine for the approach (knots). */
export const SPEED = 5;

export const KA = feature("kerran-approach");
export const NO1 = feature("no1");
export const NO2 = feature("no2");
export const NO3 = feature("no3");
export const NO4 = feature("no4");
export const FRONT = feature("ldg-front");
export const REAR = feature("ldg-rear");
export const HARBOUR = feature("harbour");
export const CHURCH = feature("church");
export const MEW = feature("mew-rock");
export const WRECK = feature("wreck");

export const LEAD_BRG = LEADING_LINE.bearing;
const LINE_LON = LEADING_LINE.from.lon;
/** The point on the leading line at a mark's latitude (the line runs due north). */
export const onLine = (p: LatLon): LatLon => ({ lat: p.lat, lon: LINE_LON });

/** Where the plan crosses the line between each pair of buoys, and where it ends, off the harbour. */
export const GATE12 = onLine({ lat: (NO1.at.lat + NO2.at.lat) / 2, lon: 0 });
export const GATE34 = onLine({ lat: (NO3.at.lat + NO4.at.lat) / 2, lon: 0 });
export const END = onLine(HARBOUR.at);

export const PAIR12_WIDTH = rhumbDistance(NO1.at, NO2.at);
export const PAIR34_WIDTH = rhumbDistance(NO3.at, NO4.at);

/* ------------------------------------------------------------------ */
/* The legs                                                            */
/* ------------------------------------------------------------------ */

export interface Leg {
  id: string;
  n: number;
  from: LatLon;
  to: LatLon;
  fromName: string;
  toName: string;
  /** Course along the leg, °T and °M (whole degrees). */
  trueCourse: number;
  magnetic: number;
  distance: number;
  minutes: number;
  /** Minutes from the Approach buoy to the end of this leg. */
  cumulative: number;
}

function course(a: LatLon, b: LatLon): number {
  return Math.round(norm360(rhumbBearing(a, b))) % 360;
}

const LEG_DEFS = [
  { id: "leg1", from: KA.at, to: GATE12, fromName: "Kerran Approach buoy", toName: "No 1 and No 2" },
  { id: "leg2", from: GATE12, to: GATE34, fromName: "No 1 and No 2", toName: "No 3 and No 4" },
  { id: "leg3", from: GATE34, to: END, fromName: "No 3 and No 4", toName: "off the harbour" },
];

export const LEGS: Leg[] = (() => {
  let run = 0;
  return LEG_DEFS.map((d, i) => {
    const distance = rhumbDistance(d.from, d.to);
    const before = Math.round((60 * run) / SPEED);
    run += distance;
    const cumulative = Math.round((60 * run) / SPEED);
    const trueCourse = course(d.from, d.to);
    return { ...d, n: i + 1, trueCourse, magnetic: toMagnetic(trueCourse), distance, minutes: cumulative - before, cumulative };
  });
})();

export const TOTAL_DISTANCE = LEGS.reduce((n, l) => n + l.distance, 0);
export const TOTAL_MINUTES = LEGS[LEGS.length - 1]!.cumulative;

/** The way out: back down the leading line with the lights in line astern. */
export const ABORT_TRUE = reciprocal(LEAD_BRG);
export const ABORT_MAG = toMagnetic(ABORT_TRUE);

/** Bearings of each buoy from the start of the leg that leads to it (°T). */
export const BUOY_BEARINGS = {
  no1: rhumbBearing(KA.at, NO1.at),
  no2: rhumbBearing(KA.at, NO2.at),
  no3: rhumbBearing(GATE12, NO3.at),
  no4: rhumbBearing(GATE12, NO4.at),
};

/** Mew Rock beacon due west of the line: the point level with it, and the beam bearing. */
export const MEW_ABEAM = onLine(MEW.at);
export const MEW_ABEAM_TRUE = Math.round(rhumbBearing(MEW_ABEAM, MEW.at));
export const MEW_ABEAM_MAG = toMagnetic(MEW_ABEAM_TRUE);
export const MEW_ABEAM_PAST12 = rhumbDistance(GATE12, MEW_ABEAM);
export const MEW_ABEAM_TO34 = rhumbDistance(MEW_ABEAM, GATE34);
export const MEW_FROM_KA = { bearing: rhumbBearing(KA.at, MEW.at), distance: rhumbDistance(KA.at, MEW.at) };
export const WRECK_FROM_KA = { bearing: rhumbBearing(KA.at, WRECK.at), distance: rhumbDistance(KA.at, WRECK.at) };

/** The church spire stands almost on the line: a back-up check bearing on it, whole degrees magnetic. */
const SPIRE_FROM = [KA.at, GATE12, GATE34].map((p) => rhumbBearing(p, CHURCH.at));
export const SPIRE_CHECK_MAG = Math.round(toMagnetic(SPIRE_FROM.reduce((a, b) => a + b, 0) / SPIRE_FROM.length));

/* ------------------------------------------------------------------ */
/* Depths along the line (charted)                                     */
/* ------------------------------------------------------------------ */

const latMin = (p: LatLon) => (p.lat - 49 - 40 / 60) * 60;
const lonMinW = (p: LatLon) => (-p.lon - 4) * 60;

/** Where the charted depth on the leading line first falls below each contour, going north from the Approach buoy. */
export const CONTOUR_ON_LINE: Record<number, LatLon> = (() => {
  const out: Record<number, LatLon> = {};
  const w = lonMinW(KA.at);
  for (let m = latMin(KA.at); m < latMin(FRONT.at); m += 0.002) {
    const d = depthAt([m, w]);
    if (d === null) break;
    for (const c of [20, 10, 5, 2, 0]) if (!(c in out) && d < c) out[c] = { lat: 49 + (40 + m) / 60, lon: LINE_LON };
  }
  return out;
})();

/** The plan's depth limits: legs 1 and 2 stay in more than 20 m; in the inlet, the 5 m contour is the warning line. */
export const DEEP_CONTOUR = 20;
export const WARN_CONTOUR = 5;
export const C20_PAST34 = rhumbDistance(GATE34, CONTOUR_ON_LINE[DEEP_CONTOUR]!);
export const C10_PAST34 = rhumbDistance(GATE34, CONTOUR_ON_LINE[10]!);

/* ------------------------------------------------------------------ */
/* The western limit on arrival: a clearing bearing on the church spire */
/* ------------------------------------------------------------------ */

export const SPIRE_LIMIT: Limit = "NMT";
/** Clearing bearing on the spire that passes the wreck with a 4-cable margin, and so Mew Rock too. */
export const SPIRE_CLEAR = clearingBearing(WRECK.at, CHURCH.at, SPIRE_LIMIT);
export const SPIRE_CLEAR_MAG = toMagnetic(SPIRE_CLEAR);
export const WRECK_TO_SPIRE = { bearing: rhumbBearing(WRECK.at, CHURCH.at), distance: rhumbDistance(WRECK.at, CHURCH.at) };
export const MEW_TO_SPIRE = { bearing: rhumbBearing(MEW.at, CHURCH.at), distance: rhumbDistance(MEW.at, CHURCH.at) };
export const CLEARS_WRECK = assess(WRECK.at, CHURCH.at, SPIRE_LIMIT, SPIRE_CLEAR).distance;
export const CLEARS_MEW = assess(MEW.at, CHURCH.at, SPIRE_LIMIT, SPIRE_CLEAR).distance;

export interface ClearingCase {
  id: string;
  label: string;
  limit: Limit;
  /** °T */
  value: number;
  dangers: Array<{ name: string; at: LatLon }>;
}

export const CLEARING_CASES: ClearingCase[] = [
  { id: "both", label: `This plan: ${limitText(SPIRE_LIMIT, SPIRE_CLEAR)}`, limit: SPIRE_LIMIT, value: SPIRE_CLEAR, dangers: [{ name: "the wreck", at: WRECK.at }, { name: "Mew Rock", at: MEW.at }] },
  { id: "mew", label: `Drawn for Mew Rock only: ${limitText(MEW_CLEAR.limit, MEW_CLEAR.bearing)}`, limit: MEW_CLEAR.limit, value: MEW_CLEAR.bearing, dangers: [{ name: "Mew Rock", at: MEW.at }, { name: "the wreck", at: WRECK.at }] },
];

/** Is a spire bearing (°T) on the safe side of the clearing bearing? */
export function spireSafe(limit: Limit, value: number, observedTrue: number): boolean {
  const s = signedDiff(observedTrue, value);
  return limit === "NMT" ? s <= 0 : s >= 0;
}

/* ------------------------------------------------------------------ */
/* What you should see next                                            */
/* ------------------------------------------------------------------ */

export type ViewMarkType = "safe-water" | "starboard" | "port" | "isolated-danger";

export interface SeenMark {
  id: string;
  type: ViewMarkType;
  label: string;
  at: LatLon;
}

export const SEEN: Record<string, SeenMark> = {
  ka: { id: "ka", type: "safe-water", label: "Kerran App", at: KA.at },
  no1: { id: "no1", type: "starboard", label: "No 1", at: NO1.at },
  no2: { id: "no2", type: "port", label: "No 2", at: NO2.at },
  no3: { id: "no3", type: "starboard", label: "No 3", at: NO3.at },
  no4: { id: "no4", type: "port", label: "No 4", at: NO4.at },
  mew: { id: "mew", type: "isolated-danger", label: "Mew Rock", at: MEW.at },
};

/** An illustrative arrival from the south-west, sailing in towards the Approach buoy, well inside the clearing line. */
export const ARRIVAL_TRACK: LatLon[] = [
  { lat: 49 + 40.15 / 60, lon: -(4 + 13.2 / 60) },
  { lat: 49 + 40.95 / 60, lon: -(4 + 15.1 / 60) },
  { lat: 49 + 41.6 / 60, lon: -(4 + 12.7 / 60) },
  KA.at,
];

/** A mile south of the Approach buoy, on the line extended. */
export const ARRIVAL_POINT: LatLon = { lat: KA.at.lat - 1 / 60, lon: LINE_LON };

/** Clock times at each point of the plan, for an arrival at the Approach buoy at 1530. */
export const START_MINUTES = 15 * 60 + 30;
const clock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}`;
export const TIMES = {
  ka: clock(START_MINUTES),
  gate12: clock(START_MINUTES + LEGS[0]!.cumulative),
  gate34: clock(START_MINUTES + LEGS[1]!.cumulative),
  end: clock(START_MINUTES + LEGS[2]!.cumulative),
};

export interface NextRound {
  id: string;
  at: LatLon;
  where: string;
  options: string[];
  answer: number;
  explain: string;
  show: string[];
  lights: boolean;
}

const desc = {
  ka: "red and white vertical stripes, a red ball on top, LFl10s",
  no1: `green cone, ${NO1.light}`,
  no2: `red can, ${NO2.light}`,
  no3: `green cone, ${NO3.light}`,
  no4: `red can, ${NO4.light}`,
};
const L0 = LEGS[0]!;
const L1 = LEGS[1]!;
const L2 = LEGS[2]!;

export const NEXT_ROUNDS: NextRound[] = [
  {
    id: "arrive",
    at: ARRIVAL_POINT,
    where: `Arriving from the south, a mile south of the Approach buoy, heading ${M(toMagnetic(LEAD_BRG))}.`,
    options: [
      `The Kerran Approach buoy (${desc.ka}) almost dead ahead, a mile off`,
      `Mew Rock beacon (black with a red band, two black balls, ${MEW.light}) dead ahead`,
      "A green cone and a red can side by side, dead ahead, a mile off",
      "A yellow buoy with a yellow X on top, fine on the starboard bow",
    ],
    answer: 0,
    explain: `The safe water mark comes first: navigable water all round it, and the leading line runs north from it. Mew Rock beacon is well off to the north-west (${T(rhumbBearing(ARRIVAL_POINT, MEW.at))}), and No 1 and No 2 lie ${L0.distance.toFixed(1)} miles beyond the Approach buoy.`,
    show: ["ka", "mew"],
    lights: true,
  },
  {
    id: "ka",
    at: KA.at,
    where: `At the Kerran Approach buoy, the leading lights in line, heading ${M(toMagnetic(LEAD_BRG))}.`,
    options: [
      `No 1 (${desc.no1}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no1)} and No 2 (${desc.no2}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no2)}, ${L0.distance.toFixed(1)} miles ahead`,
      `No 1 (green cone, ${NO1.light}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no2)} and No 2 (red can, ${NO2.light}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no1)}, ${L0.distance.toFixed(1)} miles ahead`,
      `No 3 (green cone, ${NO3.light}) and No 4 (red can, ${NO4.light}), about 10° either side of the bow, ${L0.distance.toFixed(1)} miles ahead`,
      "A single red can dead ahead, with the leading lights in line just to the right of it",
    ],
    answer: 0,
    explain: `Port Kerran is in IALA Region A, the Mediterranean system: going in, green cones to starboard and red cans to port. From the Approach buoy No 1 bears ${T(BUOY_BEARINGS.no1)} and No 2 ${T(BUOY_BEARINGS.no2)}, each about ${Math.round(Math.abs(signedDiff(BUOY_BEARINGS.no1, LEAD_BRG)))}° either side of the line.`,
    show: ["no1", "no2"],
    lights: true,
  },
  {
    id: "gate12",
    at: GATE12,
    where: `Passing between No 1 and No 2, on the leading line. Tick them off: ${TIMES.gate12}.`,
    options: [
      `No 3 (${desc.no3}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no3)} and No 4 (${desc.no4}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no4)}, ${cab(L1.distance)} cables ahead`,
      `No 3 (green cone, ${NO1.light}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no3)} and No 4 (red can, ${NO2.light}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no4)}, ${cab(L1.distance)} cables ahead`,
      `Mew Rock beacon (black with a red band, ${MEW.light}) fine on the port bow, ${cab(L1.distance)} cables ahead`,
      `No 3 (green cone, ${NO3.light}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no4)} and No 4 (red can, ${NO4.light}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no3)}, ${cab(L1.distance)} cables ahead`,
    ],
    answer: 0,
    explain: `The inner pair flash twice, Fl(2), so you can tell them from No 1 and No 2 at dusk as well as by their numbers. They are ${cab(L1.distance)} cables on, about ${L1.minutes} minutes at ${SPEED} knots. Mew Rock beacon is well off to the west: it comes abeam (${M(MEW_ABEAM_MAG)}) ${cab(MEW_ABEAM_PAST12)} cables after No 1 and No 2.`,
    show: ["no3", "no4"],
    lights: true,
  },
  {
    id: "gate34",
    at: GATE34,
    where: `Passing between No 3 and No 4, on the leading line. Tick them off: ${TIMES.gate34}.`,
    options: [
      "No more buoys: the inlet narrowing ahead, the leading lights close ahead with the rear one above the front, and the depth starting to fall",
      "No 5 (green cone) and No 6 (red can) at the harbour entrance, with the leading lights close ahead",
      "No more buoys: the inlet widening ahead and the depth increasing again to over 30 m",
      "The Kerran Approach buoy dead ahead, with the leading lights in line astern",
    ],
    answer: 0,
    explain: `No 3 and No 4 are the last buoys. The last leg runs ${cab(L2.distance)} cables up the inlet to the harbour, and the depth falls from over ${DEEP_CONTOUR} m to between the 10 m and 5 m contours. A No 5 would mean you have misidentified something: stop and check.`,
    show: [],
    lights: true,
  },
];

/* ------------------------------------------------------------------ */
/* Steps of the plan (the step-through widget)                         */
/* ------------------------------------------------------------------ */

export interface PlanStep {
  id: string;
  title: string;
  short: string;
  heading?: { t: number; m: number };
  distance?: number;
  minutes?: number;
  see: string[];
  depth: string;
  check: string;
  highlight: string[];
}

export const PLAN_STEPS: PlanStep[] = [
  {
    id: "arrive",
    title: "Arrival from the south-west",
    short: "Arrival",
    see: [`Kerran Approach buoy: ${desc.ka}`, `Mew Rock beacon (${MEW.light}) and the wreck, off to the west`, "The church spire above the head of Kerran Bay"],
    depth: `Over ${DEEP_CONTOUR} m charted all the way to the Approach buoy`,
    check: `Western limit: church spire ${limitText(SPIRE_LIMIT, SPIRE_CLEAR_MAG, "M")} (${limitText(SPIRE_LIMIT, SPIRE_CLEAR)}) while you sail in towards the buoy.`,
    highlight: ["kerran-approach", "church", "wreck", "mew-rock"],
  },
  ...LEGS.map((l, i): PlanStep => ({
    id: l.id,
    title: `Leg ${l.n}: ${l.fromName} to ${l.toName}`,
    short: `Leg ${l.n}`,
    heading: { t: l.trueCourse, m: l.magnetic },
    distance: l.distance,
    minutes: l.minutes,
    see: [
      [
        `No 1 (${desc.no1}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no1)}; No 2 (${desc.no2}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no2)}`,
        `No 3 (${desc.no3}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no3)}; No 4 (${desc.no4}) ${onTheBow(LEAD_BRG, BUOY_BEARINGS.no4)}`,
        "The inlet narrowing; no more buoys",
      ][i]!,
      [
        `Leading lights (${LEADING_LINE.light}) in line ahead, rear above front`,
        `Mew Rock beacon abeam to the west (${M(MEW_ABEAM_MAG)}) ${cab(MEW_ABEAM_PAST12)} cables after No 1 and No 2`,
        "Leading lights close ahead; the harbour opening up",
      ][i]!,
    ],
    depth: [
      `Over ${DEEP_CONTOUR} m charted`,
      `Over ${DEEP_CONTOUR} m charted`,
      `Falling: the ${DEEP_CONTOUR} m contour ${cab(C20_PAST34)} cables past No 3 and No 4, the harbour between the 10 m and 5 m contours. Under ${WARN_CONTOUR} m on the sounder: stop and check`,
    ][i]!,
    check: [
      `Decision point here: marks and lights identified? If not, stay in the deep water round the buoy. Tick off No 1 and No 2 at ${TIMES.gate12}.`,
      `All as planned at No 1 and No 2? If not, turn back on ${M(ABORT_MAG)}. Tick off No 3 and No 4 at ${TIMES.gate34}.`,
      `Last easy turn at No 3 and No 4: beyond, the inlet narrows. Fenders and lines ready, off the harbour at ${TIMES.end}.`,
    ][i]!,
    highlight: [["no1", "no2"], ["no3", "no4"], ["ldg-front", "ldg-rear"]][i]!,
  })),
  {
    id: "abort",
    title: "The way out",
    short: "Way out",
    heading: { t: ABORT_TRUE, m: ABORT_MAG },
    see: ["Leading lights in line astern", "Kerran Approach buoy ahead: deep water all round it"],
    depth: "Increasing: over 20 m once outside No 3 and No 4",
    check: "Use it whenever something does not match the plan: a mark you cannot identify, a depth that is wrong, or the lights not in line.",
    highlight: ["kerran-approach"],
  },
];

/** The view ahead from a position heading up the line: each mark's bearing relative to the bow and its distance. */
export function viewAhead(at: LatLon, ids: string[]): Array<{ mark: SeenMark; rel: number; distance: number }> {
  return ids.map((id) => {
    const mark = SEEN[id]!;
    return { mark, rel: signedDiff(rhumbBearing(at, mark.at), LEAD_BRG), distance: rhumbDistance(at, mark.at) };
  });
}

/** Lights' bearing offset (rear relative to front) seen from a point: zero on the line. */
export function lightsOffset(at: LatLon): number {
  return signedDiff(rhumbBearing(at, REAR.at), rhumbBearing(at, FRONT.at));
}

export { say as sayBearing };
