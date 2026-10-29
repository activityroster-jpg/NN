// Lesson 7 data: the practice chart's lights, parsed once with parseLight,
// and helpers shared by the notes, widgets, scenes and exercises. Ported
// from the Boaty Jobs lesson on light characteristics. Every number about a
// light comes from its characteristic as printed. Plain TypeScript (no hooks).

import { parseLight, type LightCharacteristic, type LightColour } from '@/lib/courses/navigation/lights'
import { FEATURES, LEADING_LINE, feature } from '@/lib/courses/navigation/practice-chart'
import type { LatLon } from '@/lib/courses/geo'

export const COLOUR_NAME: Record<LightColour, string> = { W: 'white', R: 'red', G: 'green', Y: 'yellow', Bu: 'blue' }

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty']

/** Whole numbers in words for narration, e.g. 28 → "twenty-eight". */
export function words(n: number): string {
  if (n <= 20) return NUMBER_WORDS[n] ?? String(n)
  const t = Math.floor(n / 10)
  const u = n % 10
  return TENS[t] ? `${TENS[t]}${u ? `-${NUMBER_WORDS[u]}` : ''}` : String(n)
}

export function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Seconds, without a trailing ".0": 10 → "10", 2.5 → "2.5". */
export function sec(n: number): string {
  return String(Math.round(n * 100) / 100)
}

/* ------------------------------------------------------------------ */
/* Reading a parsed light                                              */
/* ------------------------------------------------------------------ */

export type Kind = 'F' | 'Fl' | 'LFl' | 'Q' | 'VQ' | 'Iso' | 'Oc' | 'Mo'

export function kindOf(l: LightCharacteristic): Kind {
  return (l.rhythm.match(/^[A-Za-z]+/)?.[0] ?? 'F') as Kind
}

/** The number in brackets: flashes in a group (or eclipses, for Oc). */
export function groupOf(l: LightCharacteristic): number | undefined {
  const m = l.rhythm.match(/\((\d+)\)/)
  return m ? Number(m[1]) : undefined
}

/** The two group sizes of a composite group-flashing light: Fl(2+1) → [2, 1]. */
export function compositeOf(l: LightCharacteristic): [number, number] | undefined {
  const m = l.rhythm.match(/\((\d+)\+(\d+)\)/)
  return m ? [Number(m[1]), Number(m[2])] : undefined
}

export function morseLetter(l: LightCharacteristic): string | undefined {
  return l.rhythm.match(/\(([A-Z])\)/)?.[1]
}

export function withLongFlash(l: LightCharacteristic): boolean {
  return l.rhythm.endsWith('+LFl')
}

/** Is the light continuous (fixed, or quick/very quick without groups)? */
export function isContinuous(l: LightCharacteristic): boolean {
  const k = kindOf(l)
  return k === 'F' || ((k === 'Q' || k === 'VQ') && !groupOf(l) && !withLongFlash(l))
}

/** Seconds of light in one period. */
export function onSeconds(l: LightCharacteristic): number {
  return l.phases.filter((p) => p.on).reduce((n, p) => n + p.seconds, 0)
}

/** Fraction of each period the light is showing (1 for a fixed light). */
export function lightFraction(l: LightCharacteristic): number {
  return kindOf(l) === 'F' ? 1 : onSeconds(l) / l.period
}

/** "less" / "equal" / "more": light compared with darkness in each period. */
export function lightVsDark(l: LightCharacteristic): 'less' | 'equal' | 'more' {
  const f = lightFraction(l)
  return Math.abs(f - 0.5) < 0.01 ? 'equal' : f < 0.5 ? 'less' : 'more'
}

/** Appearances of light (flashes) in one period. */
export function flashesPerPeriod(l: LightCharacteristic): number {
  return l.phases.filter((p) => p.on).length
}

/** Start time of each flash within the period. */
export function flashStarts(l: LightCharacteristic): number[] {
  const out: number[] = []
  let t = 0
  for (const p of l.phases) {
    if (p.on) out.push(t)
    t += p.seconds
  }
  return out
}

/** How many flashes of the current period have begun by `seconds`. */
export function flashesSoFar(l: LightCharacteristic, seconds: number): number {
  const into = ((seconds % l.period) + l.period) % l.period
  return flashStarts(l).filter((s) => s <= into).length
}

/** The rhythm in words, e.g. "group flashing: 3 flashes in each group". */
export function rhythmText(l: LightCharacteristic): string {
  const g = groupOf(l)
  switch (kindOf(l)) {
    case 'F': return 'fixed: a steady light that is on all the time'
    case 'Fl': {
      const c = compositeOf(l)
      if (c) return `composite group flashing: a group of ${c[0]}, then a group of ${c[1]}, in each period`
      return g ? `group flashing: ${g} flashes in each group` : 'flashing: a single short flash, less light than dark'
    }
    case 'LFl': return 'long flashing: a single flash lasting 2 seconds or more'
    case 'Q':
    case 'VQ': {
      const name = kindOf(l) === 'Q' ? 'quick' : 'very quick'
      const rate = kindOf(l) === 'Q' ? 'about one a second' : 'about two a second'
      if (withLongFlash(l)) return `${name} flashing: ${g} ${name} flashes, then a long flash`
      return g ? `group ${name}: ${g} ${name} flashes (${rate}) in each group` : `${name} flashing, continuously (${rate})`
    }
    case 'Iso': return 'isophase: equal periods of light and darkness'
    case 'Oc': return g ? `group occulting: ${g} eclipses in each period, more light than dark` : 'occulting: on for longer than it is off, blinking out once a period'
    case 'Mo': return `Morse code: flashes spelling the letter ${morseLetter(l)}`
  }
}

/** The rhythm's name, e.g. "Group flashing". */
export function rhythmName(l: LightCharacteristic): string {
  const g = groupOf(l)
  if (withLongFlash(l)) return kindOf(l) === 'Q' ? 'Quick, then a long flash' : 'Very quick, then a long flash'
  switch (kindOf(l)) {
    case 'F': return 'Fixed'
    case 'Fl': return compositeOf(l) ? 'Composite group flashing' : g ? 'Group flashing' : 'Flashing'
    case 'LFl': return 'Long flashing'
    case 'Q': return g ? 'Group quick' : 'Quick'
    case 'VQ': return g ? 'Group very quick' : 'Very quick'
    case 'Iso': return 'Isophase'
    case 'Oc': return g ? 'Group occulting' : 'Occulting'
    case 'Mo': return 'Morse code'
  }
}

export const RHYTHM_NAMES = [
  'Fixed', 'Flashing', 'Group flashing', 'Long flashing', 'Quick', 'Group quick', 'Very quick', 'Group very quick',
  'Isophase', 'Occulting', 'Group occulting', 'Morse code',
]

/** A plain-English description, e.g. "a white light flashing in groups of 3 every 10 seconds". */
export function sayLight(l: LightCharacteristic, withHeights = true): string {
  const c = COLOUR_NAME[l.colour]
  const g = groupOf(l)
  const every = `every ${sec(l.period)} seconds`
  let s: string
  switch (kindOf(l)) {
    case 'F': s = `a fixed ${c} light, on all the time`; break
    case 'Fl': {
      const cg = compositeOf(l)
      s = cg ? `a ${c} light giving ${cg[0]} flashes and then ${cg[1]}, ${every}` : g ? `a ${c} light flashing in groups of ${g}, ${every}` : `a ${c} light giving a single flash ${every}`
      break
    }
    case 'LFl': s = `a ${c} light giving one long flash (2 seconds or more) ${every}`; break
    case 'Q':
    case 'VQ': {
      const how = kindOf(l) === 'Q' ? 'quick' : 'very quick'
      if (withLongFlash(l)) s = `a ${c} light giving ${g} ${how} flashes and then a long flash, ${every}`
      else if (g) s = `a ${c} light giving groups of ${g} ${how} flashes, ${every}`
      else s = `a ${c} light flashing ${kindOf(l) === 'Q' ? 'quickly' : 'very quickly'} and continuously, ${kindOf(l) === 'Q' ? 'about once' : 'about twice'} a second`
      break
    }
    case 'Iso': s = `a ${c} light with equal light and darkness, ${sec(l.period / 2)} second${l.period === 2 ? '' : 's'} of each`; break
    case 'Oc': s = g ? `a ${c} light that is mostly on, blinking out in groups of ${g} ${every}` : `a ${c} light that is mostly on, blinking out once ${every}`; break
    case 'Mo': s = `a ${c} light flashing the Morse letter ${morseLetter(l)} ${every}`; break
  }
  if (withHeights && l.height !== undefined) s += `, ${l.height} m above MHWS`
  if (withHeights && l.range !== undefined) s += `, nominal range ${l.range} M`
  return s
}

/* ------------------------------------------------------------------ */
/* Checking a characteristic typed by a learner (or built at random)   */
/* ------------------------------------------------------------------ */

const ALLOWED_RHYTHMS = /^(F|Fl|Fl\([1-9]\)|Fl\([1-9]\+[1-9]\)|LFl|Q|Q\([1-9]\)|Q\([1-9]\)\+LFl|VQ|VQ\([1-9]\)|VQ\([1-9]\)\+LFl|Iso|Oc|Oc\([1-9]\)|Mo\([A-Z]\))$/

/**
 * Parse a characteristic and check it makes sense as a real light: a
 * period where one is needed, and a pattern that fits inside it.
 */
export function readLight(text: string): { light: LightCharacteristic; error?: undefined } | { light?: undefined; error: string } {
  const s = text.trim()
  if (!s) return { error: 'Type a characteristic, for example Fl(3)10s28m15M.' }
  if (/^Al\b/i.test(s.replace(/\./g, ' '))) {
    return { error: 'Al means alternating: the light changes colour. This simulator shows one colour at a time: see the alternating light in “Every rhythm side by side”, further down.' }
  }
  let light: LightCharacteristic
  try {
    light = parseLight(s)
  } catch {
    return { error: 'Not recognised. Write it in chart order — rhythm, colour, period, elevation, range — for example Fl(2) R 5s or Fl(3)10s28m15M.' }
  }
  if (!ALLOWED_RHYTHMS.test(light.rhythm)) return { error: `“${light.rhythm}” isn’t a rhythm this simulator knows. Use a group number from 1 to 9.` }
  const k = kindOf(light)
  const periodGiven = /\d(?:\.\d+)?\s*s(?![a-z])/.test(s.replace(/\./g, ' '))
  if (k === 'F' && periodGiven) return { error: 'A fixed light is on all the time, so it has no period. Write just F, or F R for red.' }
  if ((k === 'Q' || k === 'VQ') && !groupOf(light) && !withLongFlash(light) && periodGiven) {
    return { error: 'A continuous quick light has no period. For groups, write the number in brackets: Q(3)10s.' }
  }
  if (!isContinuous(light) && !periodGiven) {
    const eg = { F: 1, Fl: compositeOf(light) ? 10 : 5, LFl: 10, Q: withLongFlash(light) ? 15 : 10, VQ: 10, Iso: 4, Oc: 4, Mo: 8 }[k] * (k === 'Oc' && groupOf(light) ? 2 : 1)
    return { error: `Add the period in seconds, for example ${light.rhythm} ${eg}s.` }
  }
  if (light.period > 60) return { error: 'That period is longer than this simulator allows (60 seconds).' }
  const used = light.phases.reduce((n, p) => n + p.seconds, 0)
  if (used > light.period + 0.001) return { error: `That pattern doesn’t fit in ${sec(light.period)} seconds. Make the period longer.` }
  // A group must end with a clearly longer pause (an eclipse, or for Oc a stretch of light) than the gaps inside it.
  const grouped = (groupOf(light) ?? 1) > 1 || compositeOf(light) !== undefined || withLongFlash(light) || k === 'Mo'
  const last = light.phases[light.phases.length - 1]!
  if (grouped && (last.on !== (k === 'Oc') || last.seconds < 2 - 0.001)) {
    return { error: `That pattern doesn’t fit in ${sec(light.period)} seconds. Make the period longer.` }
  }
  if (k !== 'F' && (!light.phases.some((p) => p.on) || !light.phases.some((p) => !p.on))) {
    return { error: `That pattern doesn’t fit in ${sec(light.period)} seconds. Make the period longer.` }
  }
  // Flashing lights are lit for less time than they are dark; occulting lights for more.
  const lit = onSeconds(light) / light.period
  if ((k === 'Fl' || k === 'LFl' || k === 'Q' || k === 'VQ' || k === 'Mo') && lit >= 0.5) {
    return { error: `A ${rhythmName(light).toLowerCase().replace('morse', 'Morse')} light must be dark for longer than it is lit: make the period longer.` }
  }
  if (k === 'Oc' && lit <= 0.5) return { error: 'An occulting light is lit for longer than it is dark: make the period longer.' }
  return { light }
}

/** The pieces of a characteristic as written: rhythm, colour, period, elevation, range. */
export function piecesOf(text: string): { rhythm: string; colour?: string; period?: string; height?: string; range?: string } | null {
  const s = text.replace(/\./g, ' ').replace(/\s+/g, ' ').trim()
  const m = s.match(/^((?:F|Fl|LFl|Q|VQ|Iso|Oc|Mo)(?:\((?:\d+\+\d+|\d+|[A-Z])\))?(?:\+LFl)?)\s*(W|R|G|Y|Bu)?\s*(?:(\d+(?:\.\d+)?)s)?\s*(?:(\d+)m)?\s*(?:(\d+)M)?$/)
  if (!m) return null
  return { rhythm: m[1]!, colour: m[2], period: m[3] && `${m[3]}s`, height: m[4] && `${m[4]}m`, range: m[5] && `${m[5]}M` }
}

/* ------------------------------------------------------------------ */
/* The practice chart's lights                                         */
/* ------------------------------------------------------------------ */

export interface ChartLight {
  key: string
  name: string
  /** As printed on the chart. */
  text: string
  light: LightCharacteristic
  /** Chart feature ids (two for the leading lights). */
  ids: string[]
  at: LatLon
}

/** Every lit feature on the chart; the two leading lights (same characteristic) count as one. */
export const CHART_LIGHTS: ChartLight[] = FEATURES.filter((f) => f.light && f.id !== 'ldg-rear').map((f) =>
  f.id === 'ldg-front'
    ? { key: 'ldg', name: 'Port Kerran leading lights', text: LEADING_LINE.light, light: parseLight(LEADING_LINE.light), ids: ['ldg-front', 'ldg-rear'], at: f.at }
    : { key: f.id, name: f.name, text: f.light!, light: parseLight(f.light!), ids: [f.id], at: f.at },
)

export function chartLight(key: string): ChartLight {
  const c = CHART_LIGHTS.find((x) => x.key === key)
  if (!c) throw new Error(`no chart light ${key}`)
  return c
}

export const GULL = feature('gull-point-lt')
export const GULL_LIGHT = parseLight(GULL.light!)
export const KERRAN = feature('kerran-head-lt')
export const KERRAN_LIGHT = parseLight(KERRAN.light!)
export const FRONT_LIGHT = parseLight(feature('ldg-front').light!)
export const REAR_LIGHT = parseLight(feature('ldg-rear').light!)
export const MEW = chartLight('mew-rock')
export const EAST_TEETH = chartLight('east-teeth')
export const NO1 = chartLight('no1')

/** Short chart names for labels: "No 1 buoy" → "No 1". */
export function shortName(c: ChartLight): string {
  return c.name.replace(/ (buoy|beacon|lighthouse|light)$/, '')
}

function family(l: LightCharacteristic): string {
  const k = kindOf(l)
  return k === 'Fl' || k === 'Q' || k === 'VQ' ? 'short flashes' : k
}

/**
 * Could an observer reasonably mistake one light for the other by colour,
 * count and period alone? Group flashing and group quick lights with the
 * same count and period (Gull Point Fl(3)10s, East Teeth Q(3)10s) are
 * treated as alike: telling them apart needs the flash speed or a bearing.
 */
export function confusable(a: LightCharacteristic, b: LightCharacteristic): boolean {
  return (
    a.colour === b.colour &&
    Math.abs(a.period - b.period) < 0.5 &&
    family(a) === family(b) &&
    (groupOf(a) ?? 1) === (groupOf(b) ?? 1) &&
    withLongFlash(a) === withLongFlash(b)
  )
}

/** Chart lights matching a light by colour, rhythm and period. */
export function matchesOnChart(l: LightCharacteristic): ChartLight[] {
  return CHART_LIGHTS.filter((c) => c.light.colour === l.colour && c.light.rhythm === l.rhythm && Math.abs(c.light.period - l.period) < 0.01)
}

/* ------------------------------------------------------------------ */
/* Patterns for drawing (single-colour lights and the alternating one) */
/* ------------------------------------------------------------------ */

export interface Pattern {
  period: number
  phases: Array<{ on: boolean; seconds: number; colour: LightColour }>
}

export function patternOf(l: LightCharacteristic): Pattern {
  return { period: l.period, phases: l.phases.map((p) => ({ ...p, colour: l.colour })) }
}

/**
 * parseLight has no alternating lights, so the lesson draws its own: white
 * then red, 1.5 seconds each (representative, like all the timings here).
 */
export const ALTERNATING: Pattern & { text: string } = {
  text: 'Al WR',
  period: 3,
  phases: [{ on: true, seconds: 1.5, colour: 'W' }, { on: true, seconds: 1.5, colour: 'R' }],
}

/** The colour showing at `seconds`, or null in an eclipse. */
export function colourAt(p: Pattern, seconds: number): LightColour | null {
  let t = ((seconds % p.period) + p.period) % p.period
  for (const ph of p.phases) {
    if (t < ph.seconds) return ph.on ? ph.colour : null
    t -= ph.seconds
  }
  const last = p.phases[p.phases.length - 1]!
  return last.on ? last.colour : null
}

export interface RhythmExample {
  text: string
  name: string
  pattern: Pattern
  note: string
}

function example(text: string, name: string, note: string): RhythmExample {
  return { text, name, note, pattern: patternOf(parseLight(text)) }
}

/** One example of each rhythm, in teaching order. */
export const RHYTHMS: RhythmExample[] = [
  example('F', 'Fixed', 'Steady, never goes out'),
  example('Fl 5s', 'Flashing', 'Light shorter than dark'),
  example('LFl 10s', 'Long flashing', 'One flash of 2 s or more'),
  example('Fl(3) 10s', 'Group flashing', 'Flashes in groups'),
  example('Q', 'Quick', '50 to 79 a minute'),
  example('VQ', 'Very quick', '80 to 159 a minute'),
  example('Q(3) 10s', 'Group quick', 'Quick flashes in groups'),
  example('VQ(3) 5s', 'Group very quick', 'Very quick, in groups'),
  example('Iso 4s', 'Isophase', 'Equal light and dark'),
  example('Oc 4s', 'Occulting', 'Light longer than dark'),
  example('Oc(2) 8s', 'Group occulting', 'Eclipses in groups'),
  example('Mo(A) 6s', 'Morse code', 'A: short, long'),
  { text: ALTERNATING.text, name: 'Alternating', note: 'Changes colour', pattern: ALTERNATING },
]

export function rhythm(text: string): RhythmExample {
  const r = RHYTHMS.find((x) => x.text === text)
  if (!r) throw new Error(`no rhythm example ${text}`)
  return r
}

/* ------------------------------------------------------------------ */
/* The view ahead entering Port Kerran at night                        */
/* ------------------------------------------------------------------ */

const mid = (a: LatLon, b: LatLon): LatLon => ({ lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 })

export const LEADING = chartLight('ldg')
export const NO2 = chartLight('no2')
export const NO3 = chartLight('no3')
export const NO4 = chartLight('no4')
/** Between No 1 and No 2 buoys, looking up the channel (000°T). */
export const GATE_12 = mid(NO1.at, NO2.at)
