// Tidal-stream vector arithmetic for Modules 5 and 6: course to steer,
// leeway, and EPs with leeway. Every lesson that works a vector triangle
// computes its answers here so they agree.
//
// Conventions (UK / RYA):
//   • Bearings in °T unless stated; a stream's set is the direction it flows
//     TOWARDS; rates in knots, so one hour's drift = rate in miles.
//   • Water track = the yacht's path through the water (heading + leeway).
//     Ground track = water track + stream.
//   • Leeway pushes the yacht DOWNWIND of its heading. To make good a water
//     track, steer UP INTO THE WIND by the leeway angle.
//   • Flat-earth vector arithmetic in miles: exactly what's drawn on the
//     chart for passages of a few hours.

import { norm360, rhumbDestination, type LatLon } from '../geo'

export interface Stream {
  /** Direction the stream flows towards, °T. */
  set: number
  /** Knots (= miles of drift per hour). */
  rate: number
}

type Vec = { e: number; n: number }

const RAD = Math.PI / 180
const vec = (bearing: number, length: number): Vec => ({ e: length * Math.sin(bearing * RAD), n: length * Math.cos(bearing * RAD) })
const bearingOf = (v: Vec) => norm360(Math.atan2(v.e, v.n) / RAD)
const lengthOf = (v: Vec) => Math.hypot(v.e, v.n)

/** Sum of several streams (e.g. one per hour) as a single drift vector: set °T and total miles. */
export function addStreams(streams: Stream[]): Stream {
  const sum = streams.reduce((acc, s) => {
    const v = vec(s.set, s.rate)
    return { e: acc.e + v.e, n: acc.n + v.n }
  }, { e: 0, n: 0 })
  return { set: bearingOf(sum), rate: lengthOf(sum) }
}

export interface CourseToSteer {
  /** Water track to make good (before leeway), °T. */
  waterTrack: number
  /** Speed over the ground along the intended ground track, knots. */
  groundSpeed: number
  /** Angle between water track and ground track (how far "up-tide" you aim), degrees, + = to starboard of the track. */
  offset: number
}

/**
 * The vector triangle for one hour (or any period, with `stream` as the
 * total drift and `speed` as the distance through the water in that time):
 * the water track that, with the stream, keeps the yacht on `track`.
 * Null when the stream across the track is stronger than the boat speed.
 */
export function courseToSteer(track: number, speed: number, stream: Stream): CourseToSteer | null {
  const t = vec(stream.set, stream.rate)
  const along = { e: Math.sin(track * RAD), n: Math.cos(track * RAD) }
  const right = { e: along.n, n: -along.e } // unit vector 90° to starboard of the track
  const across = t.e * right.e + t.n * right.n // stream pushing to starboard (+) / port (−)
  if (Math.abs(across) > speed) return null
  const offset = Math.asin(-across / speed) / RAD
  const waterTrack = norm360(track + offset)
  const groundSpeed = speed * Math.cos(offset * RAD) + (t.e * along.e + t.n * along.n)
  if (groundSpeed <= 0) return null
  return { waterTrack, groundSpeed, offset }
}

/** Which side the wind is on for a yacht heading `heading` with the wind blowing FROM `windFrom` °T. */
export function windSide(heading: number, windFrom: number): 'port' | 'starboard' | 'ahead' | 'astern' {
  const rel = norm360(windFrom - heading)
  if (rel === 0) return 'ahead'
  if (rel === 180) return 'astern'
  return rel < 180 ? 'starboard' : 'port'
}

/**
 * Heading to steer so that leeway leaves you on `waterTrack`: steer up into
 * the wind by the leeway angle. (Wind on the starboard side pushes you to
 * port, so steer to starboard of the water track, and vice versa.)
 */
export function headingForWaterTrack(waterTrack: number, leeway: number, windFrom: number): number {
  const side = windSide(waterTrack, windFrom)
  if (side === 'starboard') return norm360(waterTrack + leeway)
  if (side === 'port') return norm360(waterTrack - leeway)
  return norm360(waterTrack)
}

/** The water track actually made good when steering `heading` with leeway: pushed downwind. */
export function waterTrackFromHeading(heading: number, leeway: number, windFrom: number): number {
  const side = windSide(heading, windFrom)
  if (side === 'starboard') return norm360(heading - leeway)
  if (side === 'port') return norm360(heading + leeway)
  return norm360(heading)
}

export interface EstimatedPosition {
  /** End of the water track (DR with leeway). */
  waterEnd: LatLon
  /** Estimated position: water track end plus the stream. */
  ep: LatLon
  waterTrack: number
  groundTrack: number
  groundSpeed: number
}

/** EP after `hours` steering `heading` at `speed`, with leeway and a stream (stream rate per hour). */
export function estimatedPosition(args: {
  from: LatLon
  heading: number
  speed: number
  hours: number
  stream: Stream
  leeway?: number
  windFrom?: number
}): EstimatedPosition {
  const waterTrack = args.leeway && args.windFrom !== undefined ? waterTrackFromHeading(args.heading, args.leeway, args.windFrom) : norm360(args.heading)
  const waterEnd = rhumbDestination(args.from, waterTrack, args.speed * args.hours)
  const ep = rhumbDestination(waterEnd, args.stream.set, args.stream.rate * args.hours)
  const total = (() => {
    const w = vec(waterTrack, args.speed * args.hours)
    const s = vec(args.stream.set, args.stream.rate * args.hours)
    return { e: w.e + s.e, n: w.n + s.n }
  })()
  return { waterEnd, ep, waterTrack, groundTrack: bearingOf(total), groundSpeed: lengthOf(total) / args.hours }
}

export interface MultiHourCourseToSteer {
  /** Water track (CTS before leeway), °T. */
  waterTrack: number
  /** Total hours the streams cover. */
  hours: number
  /** The streams added end to end: set °T and total miles of drift. */
  drift: Stream
  /** Miles made good along the ground track in that time. */
  groundDistance: number
  /** Average speed over the ground, knots. */
  groundSpeed: number
  offset: number
}

/**
 * Course to steer over several hours (Module 6): lay the hourly streams end
 * to end from the start, swing an arc of `hours × speed` and steer one course
 * for the whole passage. Each stream applies for `hours` (default 1; a part
 * hour at the end, e.g. 0.5). Null if the drift across the track is more than
 * the boat covers through the water.
 */
export function multiHourCourseToSteer(track: number, speed: number, streams: Array<Stream & { hours?: number }>): MultiHourCourseToSteer | null {
  const hours = streams.reduce((n, s) => n + (s.hours ?? 1), 0)
  if (hours <= 0) return null
  const drift = addStreams(streams.map((s) => ({ set: s.set, rate: s.rate * (s.hours ?? 1) })))
  const c = courseToSteer(track, speed * hours, drift)
  if (!c) return null
  return { waterTrack: c.waterTrack, hours, drift, groundDistance: c.groundSpeed, groundSpeed: c.groundSpeed / hours, offset: c.offset }
}
