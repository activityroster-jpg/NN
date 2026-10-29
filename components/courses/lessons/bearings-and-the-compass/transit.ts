// Natural transits on the practice chart, from the Boaty Jobs transits
// lesson: two charted objects in line give a position line with no compass
// error. Both pass the line-of-sight rule in ./sight. Pure, safe on the server.

import { norm360, reciprocal, rhumbBearing, rhumbDestination, type LatLon } from "@/lib/courses/geo";
import { feature, type ChartFeature } from "@/lib/courses/navigation/practice-chart";
import { landInFront } from "./sight";

export interface Transit {
  front: ChartFeature;
  rear: ChartFeature;
  /** Bearing of the pair from seaward, as you see them in line (°T). */
  bearing: number;
}

function transit(front: ChartFeature, rear: ChartFeature): Transit {
  return { front, rear, bearing: rhumbBearing(front.at, rear.at) };
}

export const CHURCH = feature("church");
export const MAST = feature("mast");
export const GULL = feature("gull-point-lt");

/** The church spire in line with the radio mast, seen from seaward of Kerran Bay. */
export const SPIRE_TRANSIT = transit(CHURCH, MAST);
/** Gull Point lighthouse in line with the radio mast. */
export const MAST_TRANSIT = transit(GULL, MAST);

/** A point `nm` miles to seaward of a transit's front object, on the transit. */
export function onTransit(t: Transit, nm: number): LatLon {
  return rhumbDestination(t.front.at, reciprocal(t.bearing), nm);
}

/** How far the spire stands inland along its transit: the line reaches the sea this far from it (miles). */
export const SPIRE_INLAND = landInFront(onTransit(SPIRE_TRANSIT, 4), CHURCH.id);

const SIXTEEN = [
  "north", "north-north-east", "north-east", "east-north-east", "east", "east-south-east", "south-east", "south-south-east",
  "south", "south-south-west", "south-west", "west-south-west", "west", "west-north-west", "north-west", "north-north-west",
];
export function sixteenPoint(deg: number): string {
  return SIXTEEN[Math.round(norm360(deg) / 22.5) % 16]!;
}
