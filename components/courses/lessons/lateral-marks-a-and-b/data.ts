// Facts and chart data for Lesson 5 (lateral marks in IALA Regions A and B).
// Ported from the Boaty Jobs lesson "lateral-marks" and extended with the
// second region. Everything about the practice chart comes from FEATURES, so
// the notes, widgets, scenes and exercises always agree with what is drawn.
// The practice chart itself is laid out in Region A; Region B examples use a
// schematic channel (B_BUOYS) that is clearly not a real place.

import { rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { feature, km } from '@/lib/courses/navigation/practice-chart'
import { parseLight, type LightCharacteristic } from '@/lib/courses/navigation/lights'

export type Region = 'A' | 'B'
export const REGIONS: Region[] = ['A', 'B']
export type Dir = 'in' | 'out'
export type Side = 'port' | 'starboard'
export type LateralType = 'port' | 'starboard' | 'preferred-channel-to-port' | 'preferred-channel-to-starboard'
export type Hue = 'R' | 'G'

/* ------------------------------------------------------------------ */
/* Colours by region                                                    */
/* ------------------------------------------------------------------ */

/** The colour of a plain port- or starboard-hand mark in a region. */
export function sideColour(side: Side, region: Region): Hue {
  const red = region === 'A' ? 'port' : 'starboard'
  return side === red ? 'R' : 'G'
}

/** The side a lateral type is treated as (preferred channel marks are modified lateral marks). */
export function treatAs(type: LateralType): Side {
  return type === 'port' || type === 'preferred-channel-to-starboard' ? 'port' : 'starboard'
}

/** Can for port-hand (and its preferred-channel variant), cone for starboard-hand: the same in both regions. */
export const isCan = (type: LateralType) => treatAs(type) === 'port'
export const shapeWord = (type: LateralType) => (isCan(type) ? 'can' : 'cone')

/** Main body colour (and the light's colour) of a mark in a region. */
export const mainHue = (type: LateralType, region: Region): Hue => sideColour(treatAs(type), region)
/** The broad band on a preferred channel mark: the other colour. */
export const bandHue = (type: LateralType, region: Region): Hue | null =>
  type === 'port' || type === 'starboard' ? null : mainHue(type, region) === 'R' ? 'G' : 'R'

export const hueWord = (h: Hue) => (h === 'R' ? 'red' : 'green')
export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** The side to keep a mark, going in (with the direction of buoyage) or out. */
export function sideToKeep(type: Side, dir: Dir): Side {
  if (dir === 'in') return type
  return type === 'port' ? 'starboard' : 'port'
}

export const opposite = (s: Side): Side => (s === 'port' ? 'starboard' : 'port')

/* ------------------------------------------------------------------ */
/* Mark descriptions                                                   */
/* ------------------------------------------------------------------ */

export const LATERAL_TYPES: LateralType[] = ['port', 'starboard', 'preferred-channel-to-port', 'preferred-channel-to-starboard']

export const SHORT_NAME: Record<LateralType, string> = {
  port: 'Port-hand mark',
  starboard: 'Starboard-hand mark',
  'preferred-channel-to-port': 'Preferred channel to port',
  'preferred-channel-to-starboard': 'Preferred channel to starboard',
}

/** Colours in words, e.g. "Red with one broad green band". */
export function coloursText(type: LateralType, region: Region): string {
  const main = capital(hueWord(mainHue(type, region)))
  const band = bandHue(type, region)
  return band ? `${main} with one broad ${hueWord(band)} band` : main
}

export function shapeText(type: LateralType): string {
  return isCan(type) ? 'Can (flat-topped), pillar or spar' : 'Cone (pointed), pillar or spar'
}

export function topmarkText(type: LateralType, region: Region): string {
  const c = hueWord(mainHue(type, region))
  return isCan(type) ? `Single ${c} can` : `Single ${c} cone, point up`
}

export function lightText(type: LateralType, region: Region): string {
  const c = capital(hueWord(mainHue(type, region)))
  return type === 'port' || type === 'starboard' ? `${c}, any rhythm except Fl(2+1)` : `${c}, Fl(2+1)`
}

/** What each mark asks you to do, going with the direction of buoyage (the same in both regions). */
export const MEANING: Record<LateralType, string> = {
  port: 'Marks the port side of the channel. Going with the direction of buoyage, keep it on your port side; leaving harbour, it passes down your starboard side.',
  starboard: 'Marks the starboard side of the channel. Going with the direction of buoyage, keep it on your starboard side; leaving harbour, it passes down your port side.',
  'preferred-channel-to-port': 'Where the channel divides, the preferred (main) channel is to port. To follow it, treat this as a starboard-hand mark and keep it on your starboard side.',
  'preferred-channel-to-starboard': 'Where the channel divides, the preferred (main) channel is to starboard. To follow it, treat this as a port-hand mark and keep it on your port side.',
}

/** One-line description by day, e.g. "red, can-shaped, with a red can topmark". */
export function dayLook(type: LateralType, region: Region): string {
  return `${coloursText(type, region).toLowerCase()}, ${shapeWord(type)}-shaped, with a ${hueWord(mainHue(type, region))} ${shapeWord(type)} topmark`
}

/* ------------------------------------------------------------------ */
/* Lights                                                              */
/* ------------------------------------------------------------------ */

/** Example Fl(2+1) light for a preferred channel mark (an example 10-second period). */
export function pcLight(type: LateralType, region: Region): LightCharacteristic {
  return parseLight(`Fl(2+1) ${mainHue(type, region)} 10s`)
}

/** An example light for each lateral type in a region. */
export function exampleLight(type: LateralType, region: Region): LightCharacteristic {
  if (type === 'port' || type === 'starboard') return parseLight(`Fl ${mainHue(type, region)} 5s`)
  return pcLight(type, region)
}

/** "Fl(2) R 5s" → "red: groups of two flashes every 5 seconds" (only the rhythms this lesson uses). */
export function sayLight(l: LightCharacteristic): string {
  const colour = l.colour === 'R' ? 'red' : l.colour === 'G' ? 'green' : 'white'
  if (l.rhythm === 'Fl(2+1)') return `${colour}: two flashes, then one, every ${l.period} seconds`
  if (l.rhythm === 'Q') return `${colour}: quick flashing, about once a second, without a break`
  const n = Number(l.rhythm.match(/^Fl\((\d)\)$/)?.[1] ?? (l.rhythm === 'Fl' ? 1 : NaN))
  if (n === 1) return `${colour}: one flash every ${l.period} seconds`
  if (n > 1) return `${colour}: groups of ${['', 'one', 'two', 'three', 'four'][n] ?? n} flashes every ${l.period} seconds`
  return `${colour}, ${l.text}`
}

/* ------------------------------------------------------------------ */
/* Channels: Port Kerran (Region A, on the practice chart) and a        */
/* schematic Region B channel                                           */
/* ------------------------------------------------------------------ */

export interface Buoy {
  id: string
  /** "No 1" as printed on the chart. */
  name: string
  number: number
  type: Side
  /** Light characteristic as printed, e.g. "Fl(2) R 5s". */
  light: string
  /** 1: the outer pair; 2: the inner pair. */
  gate: 1 | 2
}

export interface KerranBuoy extends Buoy {
  at: LatLon
}

export type KerranId = 'no1' | 'no2' | 'no3' | 'no4'
export const KERRAN_IDS: KerranId[] = ['no1', 'no2', 'no3', 'no4']

export const BUOYS: Record<KerranId, KerranBuoy> = Object.fromEntries(
  KERRAN_IDS.map((id) => {
    const f = feature(id)
    const n = Number(id.slice(2))
    return [id, { id, name: f.name.replace(/ buoy$/, ''), number: n, type: f.kind === 'port-mark' ? 'port' : 'starboard', light: f.light!, at: f.at, gate: n <= 2 ? 1 : 2 }]
  }),
) as Record<KerranId, KerranBuoy>

/**
 * The Region B example channel: as in the Americas, green port-hand marks
 * carry odd numbers and red starboard-hand marks even ones, counting up from
 * seaward. Lights are typical examples, not a real harbour's.
 */
export type BId = 'b1' | 'b2' | 'b3' | 'b4'
export const B_IDS: BId[] = ['b1', 'b2', 'b3', 'b4']
export const B_BUOYS: Record<BId, Buoy> = {
  b1: { id: 'b1', name: 'No 1', number: 1, type: 'port', light: 'Fl G 4s', gate: 1 },
  b2: { id: 'b2', name: 'No 2', number: 2, type: 'starboard', light: 'Fl R 4s', gate: 1 },
  b3: { id: 'b3', name: 'No 3', number: 3, type: 'port', light: 'Q G', gate: 2 },
  b4: { id: 'b4', name: 'No 4', number: 4, type: 'starboard', light: 'Q R', gate: 2 },
}

export function channelBuoys(region: Region): Buoy[] {
  return region === 'A' ? KERRAN_IDS.map((id) => BUOYS[id]) : B_IDS.map((id) => B_BUOYS[id])
}

export function buoyById(id: string): Buoy {
  const b = (BUOYS as Record<string, Buoy>)[id] ?? (B_BUOYS as Record<string, Buoy>)[id]
  if (!b) throw new Error(`unknown buoy ${id}`)
  return b
}

/** Buoys in the order a boat meets them: entering, gate 1 then 2; leaving, 2 then 1. */
export function inOrder(region: Region, dir: Dir): Buoy[] {
  const all = channelBuoys(region)
  const g1 = all.filter((b) => b.gate === 1)
  const g2 = all.filter((b) => b.gate === 2)
  return dir === 'in' ? [...g1, ...g2] : [...g2, ...g1]
}

/** The first or second buoy you keep on a given side, entering or leaving. */
export function nthKeptTo(region: Region, dir: Dir, side: Side, nth: 0 | 1): Buoy {
  return inOrder(region, dir).filter((b) => sideToKeep(b.type, dir) === side)[nth]!
}

export const APPROACH = feature('kerran-approach')

/** Miles to cables, one decimal ("5.4"). */
const cables = (nm: number) => (Math.round(nm * 100) / 10).toFixed(1).replace(/\.0$/, '')

/** Width of the channel between each Kerran pair, and the distance between pairs, in cables (text). */
export const GATE_1_CABLES = cables(rhumbDistance(BUOYS.no1.at, BUOYS.no2.at))
export const GATE_2_CABLES = cables(rhumbDistance(BUOYS.no3.at, BUOYS.no4.at))
export const GATES_APART_CABLES = cables(rhumbDistance(BUOYS.no1.at, BUOYS.no3.at))

/** Where the practice chart's channel is (for scene and widget framing). */
export const CHANNEL_LON_W = 11.5
/** A point on the channel's centre line, `latMin` minutes north of 49°40'N. */
export const onChannel = (latMin: number): LatLon => km(latMin, CHANNEL_LON_W)

/* ------------------------------------------------------------------ */
/* IALA regions and our charter areas                                   */
/* ------------------------------------------------------------------ */

export const REGION_TEXT: Record<Region, string> = {
  A: 'Europe and the Mediterranean, Africa, most of Asia, Australia and New Zealand',
  B: 'North, Central and South America and the Caribbean, Japan, South Korea and the Philippines',
}

export interface CharterArea {
  id: string
  name: string
  /** The charter base or area most people start from. */
  base: string
  region: Region
  note: string
}

/** Every area in our cruising guides, with its buoyage region. */
export const CHARTER_AREAS: CharterArea[] = [
  { id: 'croatia', name: 'Croatia', base: 'Kaštela, near Split', region: 'A', note: 'Region A, like the rest of the Adriatic. Marked channels are short; most marks you meet guard rocks and shoals off headlands and islands.' },
  { id: 'saronic', name: 'Greece: the Saronic', base: 'Alimos, Athens', region: 'A', note: 'Region A. Harbour entrances and narrow passages such as the Poros channel are where you meet lateral marks.' },
  { id: 'ionian', name: 'Greece: the Ionian', base: 'Lefkas', region: 'A', note: 'Region A. The Lefkas canal is narrow and shallow outside its marked channel, so read every mark.' },
  { id: 'sardinia', name: 'Sardinia', base: 'Portisco', region: 'A', note: 'Region A, like all of Italy.' },
  { id: 'sicily', name: 'Sicily: the Aeolian Islands', base: 'Portorosa', region: 'A', note: 'Region A, like all of Italy.' },
  { id: 'corsica', name: 'Corsica', base: 'Ajaccio', region: 'A', note: 'Region A, like the rest of France.' },
  { id: 'mallorca', name: 'Mallorca', base: 'Palma', region: 'A', note: 'Region A, like the rest of Spain.' },
  { id: 'montenegro', name: 'Montenegro', base: 'Tivat', region: 'A', note: 'Region A, like the rest of the Adriatic.' },
  { id: 'turkey', name: 'Turkey', base: 'Göcek', region: 'A', note: 'Region A, like the rest of the Mediterranean.' },
  { id: 'seychelles', name: 'The Seychelles', base: 'Baie Sainte Anne, Praslin', region: 'A', note: 'Region A, like Africa and most of the Indian Ocean. Reef passes may be marked by beacons rather than buoys.' },
  { id: 'phuket', name: 'Thailand: Phuket', base: 'Ao Po', region: 'A', note: 'Region A, like most of Asia.' },
  { id: 'bvi', name: 'The British Virgin Islands', base: 'Road Town, Tortola', region: 'B', note: 'Region B, like all the Caribbean and the Americas, even though the islands are British. Red right returning, for example on the marked channel through the reef to Anegada.' },
]

export const REGION_A_PLACES = CHARTER_AREAS.filter((a) => a.region === 'A').map((a) => a.name)
export const REGION_B_PLACES = ['the British Virgin Islands', 'the USA', 'the Bahamas', 'Antigua', 'Brazil', 'Japan', 'the Philippines']
