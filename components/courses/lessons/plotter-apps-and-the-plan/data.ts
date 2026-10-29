// Figures shared by the notes, widgets, video and exercises of Lesson 12.
// Pure and server-safe (no React). Ported in part from the Boaty Jobs
// electronic-navigation lesson (AIS closest approach, good and bad
// waypoints), with the tidal-stream material left out: charter skippers
// meet currents and leeway, so heading and course over the ground are
// worked out here from a simple current.

import { norm360, rhumbDestination, rhumbDistance, type LatLon } from "@/lib/courses/geo";
import { feature, km } from "@/lib/courses/navigation/practice-chart";
import type { CruisingGuide, LonLat } from "@/lib/cruising/types";

const RAD = Math.PI / 180;

export const one = (n: number) => (Math.round(n * 10 + 1e-9) / 10).toFixed(1);

/** "2 h 20 min", "45 min". */
export function hm(minutes: number): string {
  const m = Math.round(Math.abs(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${String(r).padStart(2, "0")} min`;
}

/** "1030" from minutes after midnight. */
export function clock(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Heading and course over the ground                                   */
/* ------------------------------------------------------------------ */

export interface Current {
  /** Direction the water flows TOWARDS, °T. */
  set: number;
  /** Knots. */
  rate: number;
}

/**
 * Where the boat actually goes: heading and speed through the water,
 * plus leeway (degrees, positive pushes the track to starboard of the
 * heading) and a current. Returns course and speed over the ground.
 */
export function overGround(heading: number, speed: number, current: Current, leeway = 0): { cog: number; sog: number } {
  const wt = heading + leeway;
  const e = speed * Math.sin(wt * RAD) + current.rate * Math.sin(current.set * RAD);
  const n = speed * Math.cos(wt * RAD) + current.rate * Math.cos(current.set * RAD);
  const sog = Math.hypot(e, n);
  return { cog: sog < 1e-6 ? norm360(wt) : norm360(Math.atan2(e, n) / RAD), sog };
}

/** The example in the video and notes: heading east at six knots, a one-and-a-half-knot current setting south. */
export const DEMO_HEADING = 90;
export const DEMO_SPEED = 6;
export const DEMO_CURRENT: Current = { set: 180, rate: 1.5 };
export const DEMO = overGround(DEMO_HEADING, DEMO_SPEED, DEMO_CURRENT);

/* ------------------------------------------------------------------ */
/* AIS: closest point of approach (ported)                              */
/* ------------------------------------------------------------------ */

export interface Motion {
  /** Course over the ground, °T. */
  course: number;
  /** Speed over the ground, knots. */
  speed: number;
}

export interface AisTarget extends Motion {
  /** True bearing of the target from you, °T. */
  bearing: number;
  /** Range in miles. */
  range: number;
}

export interface Cpa {
  /** Closest point of approach, miles (the present range if the target is already opening). */
  cpa: number;
  /** Minutes to CPA; negative = CPA has passed; null = no relative motion. */
  tcpa: number | null;
  /** Target position relative to you now, miles east/north. */
  rel: { e: number; n: number };
  /** Relative velocity (target − own), knots east/north. */
  vel: { e: number; n: number };
}

const vec = (bearing: number, length: number) => ({ e: length * Math.sin(bearing * RAD), n: length * Math.cos(bearing * RAD) });

/** CPA and TCPA from two straight-line tracks, as an AIS display works them out: assumes neither alters course or speed. */
export function closestApproach(own: Motion, target: AisTarget): Cpa {
  const rel = vec(target.bearing, target.range);
  const vo = vec(own.course, own.speed);
  const vt = vec(target.course, target.speed);
  const vel = { e: vt.e - vo.e, n: vt.n - vo.n };
  const v2 = vel.e * vel.e + vel.n * vel.n;
  if (v2 < 1e-9) return { cpa: target.range, tcpa: null, rel, vel };
  const hours = -(rel.e * vel.e + rel.n * vel.n) / v2;
  if (hours <= 0) return { cpa: target.range, tcpa: hours * 60, rel, vel };
  return { cpa: Math.hypot(rel.e + vel.e * hours, rel.n + vel.n * hours), tcpa: hours * 60, rel, vel };
}

/** True bearing and range of the target after `minutes`, both holding course and speed. */
export function bearingAfter(own: Motion, target: AisTarget, minutes: number): { bearing: number; range: number } {
  const { rel, vel } = closestApproach(own, target);
  const h = minutes / 60;
  const e = rel.e + vel.e * h;
  const n = rel.n + vel.n * h;
  return { bearing: norm360(Math.atan2(e, n) / RAD), range: Math.hypot(e, n) };
}

/** The ferry used in the video and notes: crossing from the north-east, a steady bearing, CPA near zero. */
export const AIS_OWN: Motion = { course: 0, speed: 6 };
export const AIS_FERRY: AisTarget = { bearing: 50, range: 5, course: 245, speed: 18 };
export const AIS_FERRY_CPA = closestApproach(AIS_OWN, AIS_FERRY);

/* ------------------------------------------------------------------ */
/* Good and bad waypoints on the practice chart (ported)                */
/* ------------------------------------------------------------------ */

export interface WaypointCandidate {
  id: string;
  at: LatLon;
  label: string;
  good: boolean;
  why: string;
}

const WEST_LEDGE = feature("w-ledge");
const HEAD_LEDGE = feature("head-ledge");
const SB = feature("s-brennan");
const ET = feature("east-teeth");
const TEETH = feature("teeth");
const MEW = feature("mew-rock");
const WRECK = feature("wreck");
const APPROACH = feature("kerran-approach");

const EAST_OF_WL = rhumbDestination(WEST_LEDGE.at, 90, 0.3);
const BETWEEN_TEETH = { lat: (ET.at.lat + TEETH.at.lat) / 2, lon: (ET.at.lon + TEETH.at.lon) / 2 };

export const APPROACH_WP = rhumbDestination(APPROACH.at, 180, 0.3);

export const CANDIDATES: WaypointCandidate[] = [
  {
    id: "ka-south", at: APPROACH_WP, label: "0.3 miles south of the Kerran Approach buoy", good: true,
    why: "A safe water mark has navigable water all round it, and this waypoint is set 0.3 miles off it, in deep water, rather than on the buoy itself. A good start for the harbour approach.",
  },
  {
    id: "mew", at: MEW.at, label: "On Mew Rock beacon", good: false,
    why: `Mew Rock dries ${MEW.dries} m. A waypoint on a hazard takes you, and anyone else using it, straight onto the danger: satellite positions are accurate enough to do exactly that.`,
  },
  {
    id: "wl-on", at: WEST_LEDGE.at, label: "On the West Ledge buoy", good: false,
    why: "Never on a mark. With a good position you would arrive on top of the buoy, and every other boat aiming for the same mark converges on the same spot.",
  },
  {
    id: "wl-west", at: rhumbDestination(WEST_LEDGE.at, 270, 0.5), label: "0.5 miles west of the West Ledge buoy", good: true,
    why: "A west cardinal has its safe water to the west. Half a mile west of it is clear, deep water, on the safe side.",
  },
  {
    id: "wl-east", at: EAST_OF_WL, label: "0.3 miles east of the West Ledge buoy", good: false,
    why: `East of a west cardinal is the side the danger is on: this point is only ${one(rhumbDistance(EAST_OF_WL, HEAD_LEDGE.at))} miles from Head Ledge.`,
  },
  {
    id: "wreck", at: WRECK.at, label: "On the wreck", good: false,
    why: `The wreck has only ${WRECK.depth} m over it at chart datum, and wrecks snag anchors and lines. Pass well clear, with the waypoint in open water.`,
  },
  {
    id: "sb-south", at: rhumbDestination(SB.at, 180, 0.4), label: "0.4 miles south of the South Brennan buoy", good: true,
    why: "A south cardinal has its safe water to the south. This waypoint is 0.4 miles south of it, well clear of Brennan Bank.",
  },
  {
    id: "teeth", at: BETWEEN_TEETH, label: "Between the East Teeth buoy and The Teeth", good: false,
    why: "An east cardinal has its safe water to the east. This point is on its west side, between the buoy and the rocks it guards.",
  },
];

/** A route round the west of the practice island (ported): Port Kerran approach to Kerran Roads. */
export const ROUTE: Array<{ name: string; at: LatLon }> = [
  { name: "WP1", at: APPROACH_WP },
  { name: "WP2", at: km(4.2, 19.9) },
  { name: "WP3", at: km(9.4, 19.9) },
  { name: "WP4", at: km(10.6, 14.0) },
];

/** The track a boat left coming out of Port Kerran down the buoyed channel. */
export const TRACK: LatLon[] = [km(5.25, 11.42), km(4.9, 11.48), km(4.4, 11.52), km(3.8, 11.47), km(3.1, 11.53), km(2.5, 11.5), APPROACH_WP];

/* ------------------------------------------------------------------ */
/* The week: built from our cruising guides                             */
/* ------------------------------------------------------------------ */

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export interface WeekLeg {
  day: string;
  from: string;
  to: string;
  nm: number;
  /** Straight-line miles from the base marina to tonight's stop. */
  fromBase: number;
}

export interface Week {
  id: string;
  name: string;
  country: string;
  base: string;
  baseMarina: string;
  legs: WeekLeg[];
  total: number;
}

function straightNm(a: LonLat, b: LonLat): number {
  const k = Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  return Math.hypot((b[0] - a[0]) * k * 60, (b[1] - a[1]) * 60);
}

/** A guide's six sailing days, Sunday to Friday, with how far each night's stop is from the base. */
export function weekOf(g: CruisingGuide): Week {
  const legs = g.legs.map((l, i) => {
    const port = g.ports.find((p) => l.to.startsWith(p.name) || l.to.includes(p.name));
    const at = i === g.legs.length - 1 ? g.baseMarina.at : (port?.at ?? l.route[l.route.length - 1]!);
    return { day: DAYS[i] ?? `Day ${l.day}`, from: l.from, to: l.to, nm: l.nm, fromBase: Math.round(straightNm(g.baseMarina.at, at)) };
  });
  return { id: g.id, name: g.name, country: g.country, base: g.base, baseMarina: g.baseMarina.name, legs, total: legs.reduce((n, l) => n + l.nm, 0) };
}

export interface PlannedDay {
  day: string;
  /** Indices into week.legs sailed today (empty = staying put). */
  legs: number[];
  nm: number;
  stay: boolean;
  /** Where the boat ends the day. */
  at: string;
}

/**
 * Lay the guide's legs over the six days, with some days spent in port
 * (a rest day or a weather day). A day in port pushes its leg on to the
 * next sailing day; days in port at the end of the week pull the
 * remaining legs back onto the last sailing day. The combined miles are
 * the longest it could be: going direct and skipping a stop is often
 * shorter.
 */
export function planWeek(week: Week, stay: boolean[]): PlannedDay[] {
  const sailing = DAYS.map((_, i) => !stay[i]);
  const lastSail = sailing.lastIndexOf(true);
  const out: PlannedDay[] = DAYS.map((d) => ({ day: d, legs: [], nm: 0, stay: true, at: "" }));
  if (lastSail === -1) {
    return out.map((d) => ({ ...d, at: week.base }));
  }
  let carry: number[] = [];
  week.legs.forEach((_, i) => {
    carry.push(i);
    const day = i < DAYS.length ? i : DAYS.length - 1;
    if (sailing[day] || day > lastSail) {
      const target = day > lastSail ? lastSail : day;
      out[target]!.legs.push(...carry);
      carry = [];
    }
  });
  if (carry.length) out[lastSail]!.legs.push(...carry);
  let at = week.base;
  return out.map((d, i) => {
    const nm = d.legs.reduce((n, k) => n + week.legs[k]!.nm, 0);
    if (d.legs.length) at = week.legs[d.legs[d.legs.length - 1]!]!.to;
    return { ...d, nm, stay: !sailing[i], at };
  });
}

/** Rough guide used by the planner: over this, the day is long for a holiday crew. */
export const LONG_DAY_NM = 25;
