// Lesson 6 data: the four cardinal marks and the other IALA marks
// (isolated danger, safe water, special, emergency wreck), ported from the
// Boaty Jobs lessons "cardinal-marks" and "other-marks". Marks are described
// with the shared MARK_INFO and parseLight, so every lesson agrees, and the
// practice chart's marks are computed from its data and checked when this
// module loads: a mark in the wrong quadrant, a wrong light, or a "safe
// side" that is not clear of its danger throws, so the tests fail.

import { norm360, rhumbBearing, rhumbDestination, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { describeLight, lightOn, parseLight, type LightCharacteristic, type LightColour } from '@/lib/courses/navigation/lights'
import { BANK, depthAt, feature, isLand, km, type ChartFeature } from '@/lib/courses/navigation/practice-chart'
import { shuffle, type Rng } from '@/lib/courses/random'
import { MARK_INFO, type MarkType } from '../../marks'

export type Cardinal = 'north' | 'east' | 'south' | 'west'
export const CARDINALS: Cardinal[] = ['north', 'east', 'south', 'west']

export interface CardinalInfo {
  letter: 'N' | 'E' | 'S' | 'W'
  name: string
  short: string
  /** "a north cardinal", "an east cardinal". */
  aName: string
  colours: string
  topmark: string
  lightText: string
  /** Characteristics: quick and very quick versions. */
  quick: string
  veryQuick: string
  /** Flashes in a group, or 0 for continuous (north). */
  flashes: number
  clock: string
  /** True direction of the named side. */
  dir: number
  /** Quadrant of the danger: true bearings from it, [from, to). */
  quadrant: [number, number]
  cones: string
  /** Where the black is: the cones point to it. */
  black: string
  /** Memory aid for the topmark. */
  aid: string
}

const info = (t: Cardinal) => MARK_INFO[t]

export const CARD: Record<Cardinal, CardinalInfo> = {
  north: {
    letter: 'N', name: info('north').name, short: 'North cardinal', aName: 'a north cardinal', colours: info('north').colours, topmark: info('north').topmark,
    lightText: info('north').light, quick: 'Q', veryQuick: 'VQ', flashes: 0, clock: '12 o’clock', dir: 0, quadrant: [315, 45],
    cones: 'both pointing up', black: 'the top half', aid: 'points up, as north is up.',
  },
  east: {
    letter: 'E', name: info('east').name, short: 'East cardinal', aName: 'an east cardinal', colours: info('east').colours, topmark: info('east').topmark,
    lightText: info('east').light, quick: 'Q(3)10s', veryQuick: 'VQ(3)5s', flashes: 3, clock: '3 o’clock', dir: 90, quadrant: [45, 135],
    cones: 'base to base', black: 'the top and bottom', aid: 'base to base makes an egg shape: E for east (and egg).',
  },
  south: {
    letter: 'S', name: info('south').name, short: 'South cardinal', aName: 'a south cardinal', colours: info('south').colours, topmark: info('south').topmark,
    lightText: info('south').light, quick: 'Q(6)+LFl15s', veryQuick: 'VQ(6)+LFl10s', flashes: 6, clock: '6 o’clock', dir: 180, quadrant: [135, 225],
    cones: 'both pointing down', black: 'the bottom half', aid: 'points down, as south is down.',
  },
  west: {
    letter: 'W', name: info('west').name, short: 'West cardinal', aName: 'a west cardinal', colours: info('west').colours, topmark: info('west').topmark,
    lightText: info('west').light, quick: 'Q(9)15s', veryQuick: 'VQ(9)10s', flashes: 9, clock: '9 o’clock', dir: 270, quadrant: [225, 315],
    cones: 'point to point', black: 'the band in the middle', aid: 'point to point makes a wine-glass shape: W for west (and wine glass).',
  },
}

/** Parsed lights (parseLight throws on a typo, so the tests catch it). */
export const LIGHTS: Record<Cardinal, { quick: LightCharacteristic; veryQuick: LightCharacteristic }> = Object.fromEntries(
  CARDINALS.map((c) => [c, { quick: parseLight(CARD[c].quick), veryQuick: parseLight(CARD[c].veryQuick) }]),
) as Record<Cardinal, { quick: LightCharacteristic; veryQuick: LightCharacteristic }>

/** Which quadrant of a danger a true bearing FROM the danger falls in. */
export function quadrantOf(bearingFromDanger: number): Cardinal {
  const b = norm360(bearingFromDanger)
  if (b >= 315 || b < 45) return 'north'
  if (b < 135) return 'east'
  if (b < 225) return 'south'
  return 'west'
}

/** "045°–135°T": a quadrant's bounding bearings. */
export function quadrantText(c: Cardinal): string {
  const [a, b] = CARD[c].quadrant
  const f = (n: number) => `${String(n).padStart(3, '0')}°`
  return `${f(a)}–${f(b)}T`
}

/** Plain English for a cardinal light, e.g. "white, quick flashing in groups of 6 followed by a long flash, repeated every 15 seconds". */
export function lightWords(characteristic: string): string {
  const l = parseLight(characteristic)
  const speed = l.rhythm.startsWith('VQ') ? 'very quick' : 'quick'
  const group = l.rhythm.match(/\((\d+)\)/)?.[1]
  if (!group) return `white, ${speed} flashing without a break`
  const long = l.rhythm.endsWith('+LFl') ? ' followed by a long flash' : ''
  return `white, ${speed} flashing in groups of ${group}${long}, repeated every ${l.period} seconds`
}

/** Which cardinal a characteristic belongs to (or null). */
export function cardinalForLight(characteristic: string): Cardinal | null {
  return CARDINALS.find((c) => CARD[c].quick === characteristic || CARD[c].veryQuick === characteristic) ?? null
}

/** How far `p` lies beyond `from` in the named direction, in miles (negative: on the other side). */
export function beyond(p: LatLon, from: LatLon, c: Cardinal): number {
  const dLat = (p.lat - from.lat) * 60
  const dLon = (p.lon - from.lon) * 60 * Math.cos((((p.lat + from.lat) / 2) * Math.PI) / 180)
  return c === 'north' ? dLat : c === 'south' ? -dLat : c === 'east' ? dLon : -dLon
}

export function opposite(c: Cardinal): Cardinal {
  return ({ north: 'south', south: 'north', east: 'west', west: 'east' } as const)[c]
}

/* ------------------------------------------------------------------ */
/* The practice chart's cardinals                                       */
/* ------------------------------------------------------------------ */

const toMin = (p: LatLon): [number, number] => [(p.lat - 49 - 40 / 60) * 60, (-p.lon - 4) * 60]

/** Charted depth at a position (m below chart datum), or null on land. */
export function depthHere(p: LatLon): number | null {
  return depthAt(toMin(p))
}

/** Radius of the dotted danger line drawn round rocks awash on the chart. */
export const ROCK_RADIUS = 0.2
/** Depth contour treated as the edge of Brennan Bank's shallows. */
export const BANK_SHALLOW = 5

export interface ChartCardinal {
  id: string
  type: Cardinal
  mark: ChartFeature
  name: string
  dangerName: string
  /** "lie" for The Teeth, "lies" otherwise. */
  lies: string
  danger: LatLon
  kind: 'rocks' | 'bank'
  /** True bearing and distance of the mark from the danger. */
  bearing: number
  distance: number
  what: string
}

function chartCardinal(id: string, type: Cardinal, dangerName: string, danger: LatLon, kind: ChartCardinal['kind'], what: string): ChartCardinal {
  const mark = feature(id)
  return {
    id, type, mark, name: mark.name, dangerName, lies: dangerName === 'The Teeth' ? 'lie' : 'lies', danger, kind,
    bearing: rhumbBearing(danger, mark.at), distance: rhumbDistance(danger, mark.at), what,
  }
}

export const BANK_CENTRE = km(BANK.centre[0], BANK.centre[1])

export const CHART_CARDINALS: ChartCardinal[] = [
  chartCardinal('n-teeth', 'north', 'The Teeth', feature('teeth').at, 'rocks', 'rocks awash at chart datum'),
  chartCardinal('east-teeth', 'east', 'The Teeth', feature('teeth').at, 'rocks', 'rocks awash at chart datum'),
  chartCardinal('s-brennan', 'south', 'Brennan Bank', BANK_CENTRE, 'bank', `a shoal with a least depth of ${BANK.least} m`),
  chartCardinal('w-ledge', 'west', 'Head Ledge', feature('head-ledge').at, 'rocks', 'a ledge of rocks awash at chart datum'),
]

export function chartMark(id: string): ChartCardinal {
  const c = CHART_CARDINALS.find((x) => x.id === id)
  if (!c) throw new Error(`not a chart cardinal: ${id}`)
  return c
}

/** Is a position inside the danger (on the rocks' danger line, or over the bank's shallows)? */
export function inDanger(c: ChartCardinal, p: LatLon): boolean {
  if (c.kind === 'rocks') return rhumbDistance(p, c.danger) < ROCK_RADIUS
  const d = depthHere(p)
  return d !== null && d < BANK_SHALLOW && rhumbDistance(p, c.danger) < 1.2
}

/** A track past the mark on its named side: `offset` miles beyond it, `half` miles either way. */
export function passTrack(c: ChartCardinal, offset = 0.3, half = 0.5): [LatLon, LatLon] {
  const dir = CARD[c.type].dir
  const abeam = rhumbDestination(c.mark.at, dir, offset)
  return [rhumbDestination(abeam, norm360(dir - 90), half), rhumbDestination(abeam, norm360(dir + 90), half)]
}

interface PassCheck { clearance: number; minDepth: number }

function checkPass(c: ChartCardinal): PassCheck {
  const track = passTrack(c)
  let clearance = Infinity
  let minDepth = Infinity
  for (let i = 0; i <= 60; i++) {
    const f = i / 60
    const p = { lat: track[0].lat + (track[1].lat - track[0].lat) * f, lon: track[0].lon + (track[1].lon - track[0].lon) * f }
    if (isLand(p)) throw new Error(`${c.id}: the safe-side track crosses land`)
    clearance = Math.min(clearance, rhumbDistance(p, c.danger))
    minDepth = Math.min(minDepth, depthHere(p) ?? -Infinity)
  }
  return { clearance, minDepth }
}

// Verify the chart agrees with the lesson.
for (const c of CHART_CARDINALS) {
  if (quadrantOf(c.bearing) !== c.type) throw new Error(`${c.id} is not in the ${c.type} quadrant of ${c.dangerName}`)
  if (cardinalForLight(c.mark.light ?? '') !== c.type) throw new Error(`${c.id} light ${c.mark.light} is not a ${c.type} cardinal light`)
  if (c.mark.kind !== `cardinal-${c.type}`) throw new Error(`${c.id} is charted as ${c.mark.kind}`)
  const pass = checkPass(c)
  if (pass.clearance < c.distance) throw new Error(`${c.id}: the safe side passes closer to ${c.dangerName} than the mark`)
  if (pass.minDepth < 10) throw new Error(`${c.id}: only ${pass.minDepth.toFixed(1)} m on the safe side`)
}

/* ------------------------------------------------------------------ */
/* Small text helpers                                                  */
/* ------------------------------------------------------------------ */

export const cables = (nm: number) => (Math.round(nm * 100) / 10).toFixed(1).replace(/\.0$/, '')
export const miles = (nm: number) => {
  const r = Math.round(nm * 100) / 100
  return r < 1 ? r.toFixed(2) : r.toFixed(1)
}
export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

const EIGHT = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
export function eightPoint(deg: number): string {
  return EIGHT[Math.round(norm360(deg) / 45) % 8]!
}

/* ------------------------------------------------------------------ */
/* The other marks on the practice chart                                */
/* ------------------------------------------------------------------ */

export const MEW = feature('mew-rock')
export const APPROACH = feature('kerran-approach')
export const OUTFALL = feature('outfall')
export const GULL = feature('gull-point-lt')
export const HARBOUR = feature('harbour')

function from(a: LatLon, b: LatLon) {
  const brg = rhumbBearing(a, b)
  return { dist: rhumbDistance(a, b), brg, dir: eightPoint(brg) }
}

export const MEW_FROM_HARBOUR = from(HARBOUR.at, MEW.at)
export const APPROACH_FROM_HARBOUR = from(HARBOUR.at, APPROACH.at)
export const OUTFALL_FROM_GULL = from(GULL.at, OUTFALL.at)

/* ------------------------------------------------------------------ */
/* Lights                                                              */
/* ------------------------------------------------------------------ */

export interface LightPattern {
  text: string
  describe: string
  period: number
  /** The parsed characteristic, when the shared parser knows it. */
  light?: LightCharacteristic
  /** One cycle; colour null = dark. */
  phases: Array<{ colour: LightColour | null; seconds: number }>
}

export function pattern(text: string): LightPattern {
  const light = parseLight(text)
  return {
    text,
    describe: describeLight(light),
    period: light.period,
    light,
    phases: light.phases.map((p) => ({ colour: p.on ? light.colour : null, seconds: p.seconds })),
  }
}

/** Emergency wreck marking buoy: alternating blue and yellow flashes (timing representative). */
export const ALTERNATING: LightPattern = {
  text: 'Al Bu Y',
  describe: 'flashing blue and yellow alternately',
  period: 3,
  phases: [{ colour: 'Bu', seconds: 1 }, { colour: null, seconds: 0.5 }, { colour: 'Y', seconds: 1 }, { colour: null, seconds: 0.5 }],
}

/** The colour showing `seconds` into the pattern, or null when dark. */
export function colourAt(p: LightPattern, seconds: number): LightColour | null {
  if (p.light) return lightOn(p.light, seconds) ? p.light.colour : null
  let t = ((seconds % p.period) + p.period) % p.period
  for (const ph of p.phases) {
    if (t < ph.seconds) return ph.colour
    t -= ph.seconds
  }
  return p.phases[p.phases.length - 1]!.colour
}

/** The marks this lesson teaches: the same in IALA Regions A and B. */
export type OtherMark = Exclude<MarkType, 'port' | 'starboard' | 'preferred-channel-to-port' | 'preferred-channel-to-starboard'>
export const LESSON_TYPES: OtherMark[] = ['north', 'east', 'south', 'west', 'isolated-danger', 'safe-water', 'special', 'emergency-wreck']

/** Typical lights for every mark in this lesson (any of them is correct for its mark). */
export const MARK_LIGHTS: Record<OtherMark, LightPattern[]> = {
  north: ['Q', 'VQ'].map(pattern),
  east: ['Q(3)10s', 'VQ(3)5s'].map(pattern),
  south: ['Q(6)+LFl15s', 'VQ(6)+LFl10s'].map(pattern),
  west: ['Q(9)15s', 'VQ(9)10s'].map(pattern),
  'isolated-danger': ['Fl(2)5s', 'Fl(2)10s'].map(pattern),
  'safe-water': ['LFl10s', 'Iso 4s', 'Oc 4s', 'Mo(A)10s'].map(pattern),
  special: ['Fl Y 5s', 'Fl(4) Y 10s'].map(pattern),
  'emergency-wreck': [ALTERNATING],
}

export const MEW_PATTERN = pattern(MEW.light!)
export const APPROACH_PATTERN = pattern(APPROACH.light!)
export const OUTFALL_PATTERN = pattern(OUTFALL.light!)

/** The four safe-water rhythms, shown on the same time scale. */
export const SAFE_WATER_RHYTHMS = [
  { label: 'Iso', name: 'Isophase', note: 'Equal light and dark', p: pattern('Iso') },
  { label: 'Oc', name: 'Occulting', note: 'More light than dark', p: pattern('Oc') },
  { label: 'LFl 10s', name: 'Long flash', note: 'One flash of 2 s or more, every 10 s', p: pattern('LFl10s') },
  { label: 'Mo(A)', name: 'Morse A', note: 'Short, then long', p: pattern('Mo(A)') },
]

/* ------------------------------------------------------------------ */
/* What each mark asks you to do                                        */
/* ------------------------------------------------------------------ */

export type ActionKey = 'north' | 'east' | 'south' | 'west' | 'either-berth' | 'either' | 'special' | 'wreck'

export const ACTION_TEXT: Record<ActionKey, string> = {
  north: 'Pass to the north of it',
  east: 'Pass to the east of it',
  south: 'Pass to the south of it',
  west: 'Pass to the west of it',
  'either-berth': 'Pass either side, giving it a good berth',
  either: 'Pass either side: there is no danger at the mark',
  special: 'Check the chart or pilot book for what it marks, and keep clear of that',
  wreck: 'Keep well clear: it marks a new wreck not yet on the charts',
}

const ALL_ACTIONS = Object.keys(ACTION_TEXT) as ActionKey[]

export const MARK_ACTION: Record<OtherMark, { key: ActionKey; why: string }> = {
  north: { key: 'north', why: 'A cardinal mark is named after the side the safe water is on: pass to the north of a north cardinal mark.' },
  east: { key: 'east', why: 'A cardinal mark is named after the side the safe water is on: pass to the east of an east cardinal mark.' },
  south: { key: 'south', why: 'A cardinal mark is named after the side the safe water is on: pass to the south of a south cardinal mark.' },
  west: { key: 'west', why: 'A cardinal mark is named after the side the safe water is on: pass to the west of a west cardinal mark.' },
  'isolated-danger': {
    key: 'either-berth',
    why: 'There is a danger right beneath it, with navigable water all round: pass on either side, but well off. The mark shows where the danger is, not how far it spreads.',
  },
  'safe-water': {
    key: 'either',
    why: 'There is navigable water all round it. It marks a place, such as a landfall, a channel entrance or the middle of a channel, not a danger.',
  },
  special: {
    key: 'special',
    why: 'It marks a special area or feature: in the Med most often a swimming area or a fish farm, sometimes an outfall, a cable or a racing mark. The chart or pilot book tells you which, and so what to do.',
  },
  'emergency-wreck': {
    key: 'wreck',
    why: 'It marks a new wreck that is not yet on the charts. Keep well clear and listen for the navigational warnings.',
  },
}

/** Marks easily mistaken for each other: the trainer's and the exercises' distractors. */
export const CONFUSE: Record<OtherMark, [OtherMark, OtherMark, OtherMark]> = {
  north: ['south', 'east', 'west'],
  east: ['west', 'isolated-danger', 'north'],
  south: ['north', 'west', 'east'],
  west: ['east', 'south', 'special'],
  'isolated-danger': ['safe-water', 'east', 'special'],
  'safe-water': ['isolated-danger', 'emergency-wreck', 'special'],
  special: ['emergency-wreck', 'west', 'safe-water'],
  'emergency-wreck': ['special', 'safe-water', 'isolated-danger'],
}

/** Actions that are not the taught answer for a mark but would not be unsafe either, so never offered as wrong answers. */
const NOT_WRONG: Partial<Record<OtherMark, ActionKey[]>> = {
  special: ['either', 'either-berth', 'wreck'],
  'emergency-wreck': ['either-berth', 'special'],
  'safe-water': ['either-berth'],
  'isolated-danger': ['wreck', 'special'],
}

/** The right action plus three clearly wrong ones, shuffled. */
export function actionChoices(rng: Rng, type: OtherMark): ActionKey[] {
  const right = MARK_ACTION[type].key
  const skip = NOT_WRONG[type] ?? []
  const pool = [...CONFUSE[type].map((t) => MARK_ACTION[t].key), ...shuffle(rng, ALL_ACTIONS)]
  const out: ActionKey[] = [right]
  for (const k of pool) {
    if (out.length === 4) break
    if (!out.includes(k) && !skip.includes(k)) out.push(k)
  }
  return shuffle(rng, out)
}

export function lightText(type: OtherMark): string {
  if (type === 'special') return 'Yellow, any rhythm not used by cardinal, isolated danger or safe water marks'
  return MARK_INFO[type].light
}

export function shapeText(type: OtherMark): string {
  const shape = MARK_INFO[type].shape
  return shape === 'Optional' ? 'Shape optional' : shape
}

/** What you see by day, without naming the mark. */
export function dayDescription(type: MarkType): string {
  const i = MARK_INFO[type]
  return `A mark coloured ${lowerFirst(i.colours)}; shape: ${lowerFirst(i.shape)}; topmark: ${lowerFirst(i.topmark)}`
}
