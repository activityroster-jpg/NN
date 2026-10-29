// Figures shared by the notes, widgets, video and exercises of this lesson (ported from the Boaty Jobs lesson measuring-distance).
// Everything is computed from the practice-chart data so the text can
// never disagree with what the learner measures on the chart.

import { rhumbBearing, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { feature, km } from '@/lib/courses/navigation/practice-chart'

export const METRES_PER_NM = 1852
export const STATUTE_MILE_M = 1609.344

/** The practice chart's middle latitude, 49°46'N. */
export const KERRAN_LAT = 49 + 46 / 60
/** Length of one minute of longitude at 49°46'N, in nautical miles. */
export const LON_MINUTE_NM = Math.cos((KERRAN_LAT * Math.PI) / 180)

/** Miles in one minute of longitude at a latitude (degrees). */
export function lonMinuteNm(lat: number): number {
  return Math.cos((lat * Math.PI) / 180)
}

export function midpoint(a: LatLon, b: LatLon): LatLon {
  return { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 }
}

/** "1,852" — thousands separators without toLocaleString (server and browser agree). */
export function withCommas(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** One decimal place, as read off the latitude scale. */
export const nm1 = (d: number) => d.toFixed(1)

/** The worked example used in the notes, the video and the first widget pair. */
export const DEMO = {
  from: feature('kerran-approach'),
  to: feature('mew-rock'),
  distance: rhumbDistance(feature('kerran-approach').at, feature('mew-rock').at),
}

/** A route east-about from the harbour approach to the anchorage north of the island. */
export interface RoutePoint {
  id: string
  name: string
  at: LatLon
}

export const ROUTE: RoutePoint[] = [
  { id: 'kerran-approach', name: 'Kerran Approach buoy', at: feature('kerran-approach').at },
  { id: 'east-teeth', name: 'East Teeth buoy', at: feature('east-teeth').at },
  // A waypoint of the navigator's own choosing, in open water north-east of the island.
  { id: 'wp1', name: 'WP1', at: km(10.3, 6.0) },
  { id: 'anchorage', name: 'Kerran Roads anchorage', at: feature('anchorage').at },
]

export interface Leg {
  from: RoutePoint
  to: RoutePoint
  distance: number
  bearing: number
}

export const ROUTE_LEGS: Leg[] = ROUTE.slice(1).map((to, i) => ({
  from: ROUTE[i]!,
  to,
  distance: rhumbDistance(ROUTE[i]!.at, to.at),
  bearing: rhumbBearing(ROUTE[i]!.at, to.at),
}))

/** Total as a navigator would add it: each leg read to a tenth, then summed. */
export const ROUTE_TOTAL = ROUTE_LEGS.reduce((n, l) => n + Number(nm1(l.distance)), 0)

/** The long single leg used to demonstrate walking the dividers (leg 1 of the route). */
export const WALK_LEG = ROUTE_LEGS[0]!
