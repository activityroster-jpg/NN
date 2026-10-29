// Navigation lights and day shapes: the vessels, their lights and the
// geometry of what you can see from where. Shared by the notes, widgets,
// video and exercises so every part of the lesson agrees.
//
// Light positions are schematic (metres, roughly plausible, not any real
// vessel's plan), but every light's colour, arc and arrangement follows
// COLREGs Part C (Rules 20–30) and Annex I.

export type Colour = 'W' | 'R' | 'G' | 'Y'

export type LightKind = 'masthead' | 'starboard' | 'port' | 'stern' | 'towing' | 'allround' | 'tricolour'

export interface NavLight {
  kind: LightKind
  colour: Colour
  /** Metres forward of the vessel's middle (negative = aft). */
  f: number
  /** Metres to starboard of the centreline (negative = port). */
  s: number
  /** Metres above the waterline. */
  z: number
  /** Carried by the vessel being towed, not the tug. */
  tow?: boolean
  /** An anchor light (Rule 30). */
  anchor?: boolean
}

/** Identification answers: what she is (and, for towing, how long the tow is). */
export type Key =
  | 'power' | 'sail' | 'anchor' | 'aground' | 'nuc' | 'ram' | 'cbd'
  | 'trawl' | 'fishing' | 'tow-short' | 'tow-long' | 'pilot'

export const KEY_LABEL: Record<Key, string> = {
  power: 'Power-driven vessel under way',
  sail: 'Sailing vessel under way',
  anchor: 'Vessel at anchor',
  aground: 'Vessel aground',
  nuc: 'Vessel not under command',
  ram: 'Restricted in her ability to manoeuvre',
  cbd: 'Constrained by her draught',
  trawl: 'Vessel engaged in trawling',
  fishing: 'Fishing, but not trawling',
  'tow-short': 'Towing — tow 200 m or less',
  'tow-long': 'Towing — tow longer than 200 m',
  pilot: 'Pilot vessel on duty',
}

/**
 * The most confusable alternatives for each answer, best first. Never a label
 * that is also true of her: a tug, a trawler or a CBD ship is power-driven, and
 * a pilot vessel may be at anchor, so those labels are left out for them.
 */
export const CONFUSABLE: Record<Key, Key[]> = {
  power: ['sail', 'tow-short', 'pilot', 'cbd', 'anchor'],
  sail: ['power', 'fishing', 'pilot', 'trawl'],
  anchor: ['aground', 'power', 'nuc', 'sail'],
  aground: ['nuc', 'anchor', 'cbd', 'fishing'],
  nuc: ['aground', 'cbd', 'ram', 'fishing'],
  ram: ['nuc', 'cbd', 'pilot', 'fishing'],
  cbd: ['nuc', 'aground', 'ram', 'tow-short'],
  trawl: ['fishing', 'pilot', 'sail', 'nuc'],
  fishing: ['pilot', 'trawl', 'nuc', 'aground'],
  'tow-short': ['tow-long', 'cbd', 'ram', 'nuc'],
  'tow-long': ['tow-short', 'cbd', 'ram', 'nuc'],
  pilot: ['fishing', 'trawl', 'nuc', 'aground'],
}

export type HullKind = 'ship' | 'coaster' | 'workboat' | 'motorboat' | 'yacht' | 'big-yacht' | 'trawler' | 'fishing' | 'tug' | 'pilot'

export interface Body {
  /** Height of the deck edge above the waterline. */
  freeboard: number
  /** Deckhouse: [aft end, forward end, height above the waterline]. */
  house?: [number, number, number]
  /** Masts or posts the lights stand on (drawn in the outline). */
  masts: { f: number; z: number }[]
  /** The vessel being towed, drawn astern. */
  tow?: { f: number; length: number; beam: number; freeboard: number }
}

export interface Vessel {
  id: string
  key: Key
  /** Short name for menus. */
  name: string
  /** What the lights say, for feedback. */
  meaning: string
  rule: string
  length: number
  beam: number
  hull: HullKind
  body: Body
  lights: NavLight[]
  /** Shows sidelights or a sternlight, so you can tell which way she is heading. */
  directional: boolean
  /** Used in the random quiz (identifiable from the aspects the quiz chooses). */
  quiz: boolean
  /** Identifiable from astern too (not just a single white light). */
  astern: boolean
  /** Keep the quiz away from within 25° of right ahead or astern, where her lights line up confusingly. */
  avoidEnds?: boolean
}

/* ------------------------------------------------------------------ */
/* Light builders                                                       */
/* ------------------------------------------------------------------ */

const masthead = (f: number, z: number): NavLight => ({ kind: 'masthead', colour: 'W', f, s: 0, z })
const sternlight = (f: number, z: number, tow = false): NavLight => ({ kind: 'stern', colour: 'W', f, s: 0, z, tow })
const towingLight = (f: number, z: number): NavLight => ({ kind: 'towing', colour: 'Y', f, s: 0, z })
const allRound = (colour: Colour, f: number, z: number, anchor = false): NavLight => ({ kind: 'allround', colour, f, s: 0, z, anchor })
const tricolour = (f: number, z: number): NavLight => ({ kind: 'tricolour', colour: 'W', f, s: 0, z })
function sidelights(f: number, half: number, z: number, tow = false): NavLight[] {
  return [
    { kind: 'starboard', colour: 'G', f, s: half, z, tow },
    { kind: 'port', colour: 'R', f, s: -half, z, tow },
  ]
}
/** All-round lights in a vertical line, listed top to bottom, `gap` metres apart. */
function stack(colours: Colour[], f: number, top: number, gap: number): NavLight[] {
  return colours.map((c, i) => allRound(c, f, top - i * gap))
}

/* ------------------------------------------------------------------ */
/* Bodies                                                               */
/* ------------------------------------------------------------------ */

const SHIP_BODY: Body = { freeboard: 7, house: [-38, -18, 16], masts: [{ f: 36, z: 20 }, { f: -24, z: 30 }] }
const YACHT_BODY: Body = { freeboard: 1, house: [-2.6, 1.6, 1.6], masts: [{ f: 0.5, z: 15 }] }
const TUG_BODY = (top: number): Body => ({
  freeboard: 2.5, house: [-3, 7, 7], masts: [{ f: 5, z: top }, { f: -13.8, z: 5.5 }],
  tow: { f: -58.8, length: 30, beam: 10, freeboard: 2 },
})
const TOW_LIGHTS: NavLight[] = [
  ...sidelights(3, 4, 6),
  sternlight(-13.8, 3),
  towingLight(-13.8, 5.5),
  ...sidelights(-44.5, 5, 2.5, true),
  sternlight(-73.5, 2.5, true),
]

/* ------------------------------------------------------------------ */
/* The vessels                                                          */
/* ------------------------------------------------------------------ */

export const VESSELS: Vessel[] = [
  {
    id: 'power-small', key: 'power', name: 'Power-driven vessel, under 50 m', rule: 'Rule 23',
    meaning: 'A power-driven vessel under way: one white masthead light, sidelights and a sternlight. Under 50 m she need not show a second masthead light.',
    length: 40, beam: 8, hull: 'coaster', directional: true, quiz: true, astern: false,
    body: { freeboard: 3, house: [-10, 4, 8], masts: [{ f: 6, z: 13 }] },
    lights: [masthead(6, 13), ...sidelights(3, 4, 8), sternlight(-19.5, 5)],
  },
  {
    id: 'power-large', key: 'power', name: 'Power-driven vessel, 50 m or more', rule: 'Rule 23',
    meaning: 'A power-driven vessel of 50 m or more under way: two white masthead lights, the after one higher, plus sidelights and a sternlight.',
    // Head-on her masthead lights are in a vertical line, like a tug's: not quizzed from right ahead.
    length: 100, beam: 16, hull: 'ship', directional: true, quiz: true, astern: false, avoidEnds: true,
    body: SHIP_BODY,
    lights: [masthead(36, 20), masthead(-24, 30), ...sidelights(-22, 8, 16), sternlight(-49.5, 7)],
  },
  {
    id: 'motorboat', key: 'power', name: 'Motor boat under 12 m', rule: 'Rule 23(d)',
    meaning: 'A power-driven vessel under 12 m may show an all-round white light and sidelights instead of a masthead light and sternlight.',
    length: 8, beam: 2.8, hull: 'motorboat', directional: true, quiz: true, astern: false,
    body: { freeboard: 0.9, house: [-2.5, 1.5, 2], masts: [{ f: -1.5, z: 3.4 }] },
    lights: [allRound('W', -1.5, 3.4), ...sidelights(3.4, 0.12, 1.2)],
  },
  {
    id: 'motorsail', key: 'power', name: 'Yacht under engine (motor-sailing)', rule: 'Rules 23 and 25(e)',
    meaning: 'A sailing yacht with her engine driving her is a power-driven vessel: masthead (“steaming”) light, sidelights and sternlight — and no tricolour.',
    length: 11, beam: 3.6, hull: 'yacht', directional: true, quiz: true, astern: false,
    body: YACHT_BODY,
    lights: [masthead(0.8, 8.5), ...sidelights(5, 0.12, 1), sternlight(-5.4, 0.9)],
  },
  {
    id: 'sail-deck', key: 'sail', name: 'Sailing vessel: sidelights and sternlight', rule: 'Rule 25(a)',
    meaning: 'A sailing vessel under way: sidelights and a sternlight, and no masthead light.',
    length: 11, beam: 3.6, hull: 'yacht', directional: true, quiz: true, astern: false,
    body: YACHT_BODY,
    lights: [...sidelights(5, 0.12, 1), sternlight(-5.4, 0.9)],
  },
  {
    id: 'sail-tricolour', key: 'sail', name: 'Sailing vessel: tricolour', rule: 'Rule 25(b)',
    meaning: 'A sailing vessel under 20 m may combine her sidelights and sternlight in one tricolour lantern at or near the top of the mast.',
    length: 11, beam: 3.6, hull: 'yacht', directional: true, quiz: true, astern: false,
    body: YACHT_BODY,
    lights: [tricolour(0.5, 15.2)],
  },
  {
    id: 'sail-redgreen', key: 'sail', name: 'Sailing vessel: red over green', rule: 'Rule 25(c)',
    meaning: 'A sailing vessel may add all-round red over green at the masthead (“red over green, sailing machine”) to her sidelights and sternlight — but never with a tricolour.',
    length: 24, beam: 5.6, hull: 'big-yacht', directional: true, quiz: true, astern: true,
    body: { freeboard: 1.8, house: [-5, 1, 3], masts: [{ f: 2, z: 28 }] },
    lights: [...stack(['R', 'G'], 2, 27.5, 3), ...sidelights(4, 2.6, 2), sternlight(-11.8, 1.8)],
  },
  {
    id: 'anchor-large', key: 'anchor', name: 'At anchor, 50 m or more', rule: 'Rule 30(a)',
    meaning: 'A vessel at anchor: an all-round white light forward and, if she is 50 m or more, a second, lower one aft. No sidelights or sternlight.',
    length: 90, beam: 15, hull: 'ship', directional: false, quiz: true, astern: true, avoidEnds: true,
    body: { freeboard: 6, house: [-38, -26, 14], masts: [{ f: 42, z: 14 }, { f: -44, z: 9 }] },
    lights: [allRound('W', 42, 14, true), allRound('W', -44, 9, true)],
  },
  {
    id: 'anchor-small', key: 'anchor', name: 'At anchor, under 50 m (a yacht)', rule: 'Rule 30(b)',
    meaning: 'A vessel under 50 m at anchor may show a single all-round white light where it can best be seen — here at a yacht’s masthead. From a distance it looks just like a sternlight.',
    length: 11, beam: 3.6, hull: 'yacht', directional: false, quiz: false, astern: false,
    body: YACHT_BODY,
    lights: [allRound('W', 0.5, 15.2, true)],
  },
  {
    id: 'aground', key: 'aground', name: 'Aground', rule: 'Rule 30(d)',
    meaning: 'A vessel aground: her anchor lights plus two all-round red lights in a vertical line. Keep well clear — the water there is too shallow for her.',
    length: 90, beam: 15, hull: 'ship', directional: false, quiz: true, astern: true, avoidEnds: true,
    body: { freeboard: 6, house: [-38, -26, 14], masts: [{ f: 42, z: 14 }, { f: -44, z: 9 }, { f: -30, z: 24 }] },
    lights: [allRound('W', 42, 14, true), allRound('W', -44, 9, true), ...stack(['R', 'R'], -30, 24, 3)],
  },
  {
    id: 'nuc-way', key: 'nuc', name: 'Not under command, making way', rule: 'Rule 27(a)',
    meaning: 'Not under command: two all-round red lights in a vertical line (“red over red, the captain is dead”). Making way, she adds sidelights and a sternlight — but no masthead light.',
    length: 90, beam: 15, hull: 'ship', directional: true, quiz: true, astern: true,
    body: { freeboard: 6, house: [-38, -20, 15], masts: [{ f: 34, z: 18 }, { f: -30, z: 24 }] },
    lights: [...stack(['R', 'R'], -30, 24, 3), ...sidelights(-28, 7.5, 15), sternlight(-44.5, 7)],
  },
  {
    id: 'nuc-stopped', key: 'nuc', name: 'Not under command, not making way', rule: 'Rule 27(a)',
    meaning: 'Not under command and not making way through the water: just two all-round red lights in a vertical line.',
    length: 90, beam: 15, hull: 'ship', directional: false, quiz: true, astern: true,
    body: { freeboard: 6, house: [-38, -20, 15], masts: [{ f: 34, z: 18 }, { f: -30, z: 24 }] },
    lights: [...stack(['R', 'R'], -30, 24, 3)],
  },
  {
    id: 'ram-way', key: 'ram', name: 'Restricted in ability to manoeuvre, making way', rule: 'Rule 27(b)',
    meaning: 'Restricted in her ability to manoeuvre — perhaps laying cable or servicing a buoy: all-round red, white, red. Making way, she also shows a masthead light, sidelights and a sternlight.',
    length: 45, beam: 10, hull: 'workboat', directional: true, quiz: true, astern: true,
    body: { freeboard: 3, house: [-4, 9, 9], masts: [{ f: 9, z: 20 }, { f: 2, z: 16 }] },
    lights: [masthead(9, 20), ...stack(['R', 'W', 'R'], 2, 16, 3), ...sidelights(0, 5, 7), sternlight(-22, 4)],
  },
  {
    id: 'ram-stopped', key: 'ram', name: 'Restricted in ability to manoeuvre, not making way', rule: 'Rule 27(b)',
    meaning: 'Restricted in her ability to manoeuvre and not making way through the water: all-round red, white, red in a vertical line.',
    length: 45, beam: 10, hull: 'workboat', directional: false, quiz: true, astern: true,
    body: { freeboard: 3, house: [-4, 9, 9], masts: [{ f: 9, z: 20 }, { f: 2, z: 16 }] },
    lights: [...stack(['R', 'W', 'R'], 2, 16, 3)],
  },
  {
    id: 'cbd', key: 'cbd', name: 'Constrained by her draught', rule: 'Rule 28',
    meaning: 'Constrained by her draught: a power-driven vessel’s lights plus three all-round red lights in a vertical line. Showing them is optional — the ship may or may not.',
    length: 100, beam: 16, hull: 'ship', directional: true, quiz: true, astern: true,
    body: SHIP_BODY,
    lights: [masthead(36, 20), masthead(-24, 30), ...stack(['R', 'R', 'R'], 36, 16, 3), ...sidelights(-22, 8, 16), sternlight(-49.5, 7)],
  },
  {
    id: 'trawl-way', key: 'trawl', name: 'Trawling, making way', rule: 'Rule 26(b)',
    meaning: 'Trawling: all-round green over white (“green over white, trawling at night”). Making way, she adds sidelights and a sternlight.',
    length: 24, beam: 7, hull: 'trawler', directional: true, quiz: true, astern: true,
    body: { freeboard: 2, house: [-3, 5, 5], masts: [{ f: 4, z: 10.5 }] },
    lights: [...stack(['G', 'W'], 4, 10.5, 2), ...sidelights(2, 3.5, 4), sternlight(-11.8, 3)],
  },
  {
    id: 'trawl-stopped', key: 'trawl', name: 'Trawling, not making way', rule: 'Rule 26(b)',
    meaning: 'Trawling and not making way through the water: all-round green over white only.',
    length: 24, beam: 7, hull: 'trawler', directional: false, quiz: true, astern: true,
    body: { freeboard: 2, house: [-3, 5, 5], masts: [{ f: 4, z: 10.5 }] },
    lights: [...stack(['G', 'W'], 4, 10.5, 2)],
  },
  {
    id: 'trawl-large', key: 'trawl', name: 'Trawling, 50 m or more', rule: 'Rule 26(b)',
    meaning: 'A trawler of 50 m or more must also show a masthead light abaft of and higher than the green (a smaller one may). Here she is making way, so she shows sidelights and a sternlight too.',
    length: 60, beam: 13, hull: 'trawler', directional: true, quiz: true, astern: true,
    body: { freeboard: 3, house: [-12, 2, 9], masts: [{ f: 14, z: 13 }, { f: -6, z: 17 }] },
    lights: [...stack(['G', 'W'], 14, 13, 2), masthead(-6, 17), ...sidelights(-8, 6.5, 6), sternlight(-29.5, 4)],
  },
  {
    id: 'fishing-way', key: 'fishing', name: 'Fishing (not trawling), making way', rule: 'Rule 26(c)',
    meaning: 'Fishing other than trawling — with nets or lines: all-round red over white (“red over white, fishing at night”). Making way, she adds sidelights and a sternlight.',
    length: 18, beam: 5.5, hull: 'fishing', directional: true, quiz: true, astern: true,
    body: { freeboard: 1.6, house: [-2, 4, 4], masts: [{ f: 3, z: 8 }] },
    lights: [...stack(['R', 'W'], 3, 8, 1.5), ...sidelights(1.5, 2.6, 3.2), sternlight(-8.8, 2.4)],
  },
  {
    id: 'fishing-stopped', key: 'fishing', name: 'Fishing (not trawling), not making way', rule: 'Rule 26(c)',
    meaning: 'Fishing other than trawling, not making way through the water: all-round red over white only.',
    length: 18, beam: 5.5, hull: 'fishing', directional: false, quiz: true, astern: true,
    body: { freeboard: 1.6, house: [-2, 4, 4], masts: [{ f: 3, z: 8 }] },
    lights: [...stack(['R', 'W'], 3, 8, 1.5)],
  },
  {
    id: 'tow-short', key: 'tow-short', name: 'Towing, tow 200 m or less', rule: 'Rule 24',
    meaning: 'Towing with a tow of 200 m or less: two masthead lights in a vertical line, sidelights, a sternlight and a yellow towing light above it. The tow shows sidelights and a sternlight — never pass between them.',
    // From astern only the towing light shows, which can't tell you the tow's length: not quizzed from there.
    // Head-on, two masthead lights in a vertical line look like a large ship's in line: not quizzed from right ahead.
    length: 28, beam: 8, hull: 'tug', directional: true, quiz: true, astern: false, avoidEnds: true,
    body: TUG_BODY(12.5),
    lights: [masthead(5, 12.5), masthead(5, 10.5), ...TOW_LIGHTS],
  },
  {
    id: 'tow-long', key: 'tow-long', name: 'Towing, tow longer than 200 m', rule: 'Rule 24',
    meaning: 'Towing with a tow longer than 200 m: three masthead lights in a vertical line, sidelights, a sternlight and a yellow towing light above it. By day, tug and tow each show a diamond.',
    length: 28, beam: 8, hull: 'tug', directional: true, quiz: true, astern: false,
    body: TUG_BODY(14.5),
    lights: [masthead(5, 14.5), masthead(5, 12.5), masthead(5, 10.5), ...TOW_LIGHTS],
  },
  {
    id: 'pilot-way', key: 'pilot', name: 'Pilot vessel on duty, under way', rule: 'Rule 29',
    meaning: 'A pilot vessel on duty: all-round white over red at or near the masthead (“white over red, pilot ahead”). Under way, she adds sidelights and a sternlight.',
    length: 16, beam: 5, hull: 'pilot', directional: true, quiz: true, astern: true,
    body: { freeboard: 1.6, house: [-3, 3, 3.5], masts: [{ f: 1, z: 7.5 }] },
    lights: [...stack(['W', 'R'], 1, 7.5, 1), ...sidelights(0, 2.4, 3), sternlight(-7.8, 2)],
  },
  {
    id: 'pilot-anchor', key: 'pilot', name: 'Pilot vessel on duty, at anchor', rule: 'Rules 29 and 30',
    meaning: 'A pilot vessel on duty at anchor: white over red, plus her anchor light. No sidelights or sternlight.',
    length: 16, beam: 5, hull: 'pilot', directional: false, quiz: true, astern: true,
    body: { freeboard: 1.6, house: [-3, 3, 3.5], masts: [{ f: 1, z: 7.5 }, { f: 6.5, z: 3 }] },
    lights: [...stack(['W', 'R'], 1, 7.5, 1), allRound('W', 6.5, 3, true)],
  },
]

export const VESSEL: Record<string, Vessel> = Object.fromEntries(VESSELS.map((v) => [v.id, v]))
export const vessel = (id: string): Vessel => {
  const v = VESSEL[id]
  if (!v) throw new Error(`Unknown vessel ${id}`)
  return v
}

/* ------------------------------------------------------------------ */
/* What you can see from where                                         */
/* ------------------------------------------------------------------ */

/** 0 ≤ a < 360. */
export function norm(a: number): number {
  return ((a % 360) + 360) % 360
}

/**
 * Degrees either side of right ahead in which both sidelights show. Annex I
 * lets sidelights fade out between 1° and 3° beyond right ahead, so head-on
 * you see both.
 */
export const HEAD_ON = 1

/**
 * Whether a light of this kind shows to an observer whose relative bearing
 * from the vessel's bow (clockwise) is `aspect` — Rule 21.
 */
export function shows(kind: LightKind, aspect: number): boolean {
  const a = norm(aspect)
  switch (kind) {
    case 'allround':
    case 'tricolour':
      return true
    case 'masthead':
      return a <= 112.5 || a >= 247.5
    case 'starboard':
      return a <= 112.5 || a >= 360 - HEAD_ON
    case 'port':
      return a >= 247.5 || a <= HEAD_ON
    case 'stern':
    case 'towing':
      return a >= 112.5 && a <= 247.5
  }
}

/** The colour(s) a tricolour lantern shows from this aspect. */
export function tricolourColours(aspect: number): Colour[] {
  const a = norm(aspect)
  if (a <= HEAD_ON || a >= 360 - HEAD_ON) return ['G', 'R']
  if (a < 112.5) return ['G']
  if (a > 247.5) return ['R']
  return ['W']
}

export interface Seen {
  light: NavLight
  colours: Colour[]
}

/** The lights you can see from `aspect` (relative bearing of you from her bow). */
export function seenLights(v: Vessel, aspect: number): Seen[] {
  return v.lights
    .filter((l) => shows(l.kind, aspect))
    .map((l) => ({ light: l, colours: l.kind === 'tricolour' ? tricolourColours(aspect) : [l.colour] }))
}

/**
 * Horizontal position of a point as you see it, in metres to your right of
 * the vessel's middle, looking at her from `aspect`. Seen head-on, her
 * starboard side is on your left.
 */
export function screenX(p: { f: number; s: number }, aspect: number): number {
  const r = (norm(aspect) * Math.PI) / 180
  return -p.s * Math.cos(r) + p.f * Math.sin(r)
}

/** Distance of a point towards you, in metres, from the vessel's middle. */
export function towardsYou(p: { f: number; s: number }, aspect: number): number {
  const r = (norm(aspect) * Math.PI) / 180
  return p.f * Math.cos(r) + p.s * Math.sin(r)
}

export type Heading = 'towards' | 'right' | 'left' | 'away' | 'none'

/** Which way she is heading, as you see her, judged only from her lights. */
export function headingOf(v: Vessel, aspect: number): Heading {
  if (!v.directional) return 'none'
  const a = norm(aspect)
  if (a <= HEAD_ON || a >= 360 - HEAD_ON) return 'towards'
  if (a < 112.5) return 'right'
  if (a > 247.5) return 'left'
  return 'away'
}

export const HEADING_LABEL: Record<Heading, string> = {
  towards: 'Heading towards you — end-on',
  right: 'Heading to your right — you see her starboard side',
  left: 'Heading to your left — you see her port side',
  away: 'Heading away from you — you see her stern',
  none: 'Not making way — no sidelights or sternlight',
}

/** Why: one sentence explaining the heading answer. */
export function headingReason(v: Vessel, aspect: number): string {
  const h = headingOf(v, aspect)
  const big = v.lights.filter((l) => l.kind === 'masthead' && !l.tow)
  const range = big.length === 2 && big[0]!.f !== big[1]!.f
  switch (h) {
    case 'towards':
      return `You can see both her sidelights${range ? ', and her two masthead lights are in line' : ''}, so she is heading straight at you.`
    case 'right':
      return `You can see her green (starboard) side${v.lights.some((l) => l.kind === 'tricolour') ? ' — the tricolour shows green' : ''}, so her bow is pointing to your right${range ? '; her lower, forward masthead light is to the right of the higher one' : ''}.`
    case 'left':
      return `You can see her red (port) side${v.lights.some((l) => l.kind === 'tricolour') ? ' — the tricolour shows red' : ''}, so her bow is pointing to your left${range ? '; her lower, forward masthead light is to the left of the higher one' : ''}.`
    case 'away':
      return v.lights.some((l) => l.kind === 'stern' || l.kind === 'tricolour')
        ? 'You can see only her stern light(s) and none of her forward lights, so you are more than 22.5° abaft her beam and she is heading away from you.'
        : 'You can see her all-round white light but neither sidelight, so you are more than 22.5° abaft her beam and she is heading away from you. (From here, on its own, that light could also be a small vessel at anchor.)'
    case 'none':
      return v.key === 'anchor' || v.key === 'aground' || v.id === 'pilot-anchor'
        ? 'She is not under way, so she shows no sidelights or sternlight.'
        : 'She shows no sidelights or sternlight, so she is not making way through the water.'
  }
}

/* ------------------------------------------------------------------ */
/* Words                                                                */
/* ------------------------------------------------------------------ */

const COLOUR_WORD: Record<Colour, string> = { W: 'white', R: 'red', G: 'green', Y: 'yellow' }

function listWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

const NUMBER_WORD = ['no', 'one', 'two', 'three', 'four']

/** "all-round red over white", "two all-round red lights in a vertical line"… */
function stackWords(colours: Colour[]): string {
  if (colours.length === 1) return `an all-round ${COLOUR_WORD[colours[0]!]} light`
  if (colours.every((c) => c === colours[0])) return `${NUMBER_WORD[colours.length]} all-round ${COLOUR_WORD[colours[0]!]} lights in a vertical line`
  if (colours.length === 2) return `all-round ${COLOUR_WORD[colours[0]!]} over ${COLOUR_WORD[colours[1]!]}`
  return `all-round ${colours.map((c) => COLOUR_WORD[c]).join(', ')} in a vertical line`
}

/** Plain-English list of the lights you can see, e.g. "a masthead light and her red sidelight". */
export function describeSeen(v: Vessel, aspect: number): string {
  const seen = seenLights(v, aspect)
  const own = seen.filter((s) => !s.light.tow)
  const parts: string[] = []

  // All-round signal lights, grouped by where they stand (excluding anchor lights).
  const signal = own.filter((s) => s.light.kind === 'allround' && !s.light.anchor)
  const groups = new Map<string, Colour[]>()
  for (const s of [...signal].sort((a, b) => b.light.z - a.light.z)) {
    const k = `${s.light.f}`
    groups.set(k, [...(groups.get(k) ?? []), s.light.colour])
  }
  for (const g of groups.values()) parts.push(stackWords(g))

  const anchors = own.filter((s) => s.light.anchor)
  if (anchors.length === 1) parts.push('an all-round white anchor light')
  if (anchors.length === 2) parts.push('two all-round white anchor lights (the forward one higher)')

  const mast = own.filter((s) => s.light.kind === 'masthead')
  if (mast.length === 1) parts.push('a white masthead light')
  if (mast.length > 1) {
    const vertical = mast.every((m) => m.light.f === mast[0]!.light.f)
    parts.push(vertical ? `${NUMBER_WORD[mast.length]} white masthead lights in a vertical line` : `${NUMBER_WORD[mast.length]} white masthead lights (the after one higher)`)
  }

  const tri = own.find((s) => s.light.kind === 'tricolour')
  if (tri) parts.push(tri.colours.length === 2 ? 'a tricolour showing red and green' : `a tricolour showing ${COLOUR_WORD[tri.colours[0]!]}`)

  const g = own.some((s) => s.light.kind === 'starboard')
  const r = own.some((s) => s.light.kind === 'port')
  if (g && r) parts.push('both sidelights')
  else if (g) parts.push('her green sidelight')
  else if (r) parts.push('her red sidelight')

  const stern = own.some((s) => s.light.kind === 'stern')
  const towing = own.some((s) => s.light.kind === 'towing')
  if (towing) parts.push('a yellow towing light above her white sternlight')
  else if (stern) parts.push('her white sternlight')

  const tow = seen.filter((s) => s.light.tow)
  if (tow.length) {
    const tg = tow.some((s) => s.light.kind === 'starboard')
    const tr = tow.some((s) => s.light.kind === 'port')
    const ts = tow.some((s) => s.light.kind === 'stern')
    const what = tg && tr ? 'sidelights' : tg ? 'green sidelight' : tr ? 'red sidelight' : ts ? 'white sternlight' : ''
    if (what) parts.push(`the tow’s ${what} astern of her`)
  }
  return listWords(parts)
}

/** Neutral alt text: colours from top to bottom, with rough left/right position. */
export function altText(v: Vessel, aspect: number): string {
  const seen = seenLights(v, aspect)
  const xs = seen.map((s) => screenX(s.light, aspect))
  const span = Math.max(1, ...xs.map(Math.abs))
  const items = seen
    .map((s, i) => ({ s, x: xs[i]! }))
    .sort((a, b) => b.s.light.z - a.s.light.z)
    .map(({ s, x }) => {
      const where = x < -span * 0.3 ? ' (left)' : x > span * 0.3 ? ' (right)' : ''
      return `${s.colours.map((c) => COLOUR_WORD[c]).join(' and ')}${where}`
    })
  return `Lights seen at night, from highest to lowest: ${items.join('; ')}.`
}

/** Where you are, seen from her: "on her starboard bow" (the course’s rough sectors). */
export function whereYouAre(aspect: number): string {
  const a = norm(Math.round(aspect))
  const d = a <= 180 ? a : 360 - a
  const side = a < 180 ? 'starboard' : 'port'
  if (d <= 3) return 'right ahead of her'
  if (d >= 177) return 'right astern of her'
  if (d < 30) return `fine on her ${side} bow`
  if (d <= 60) return `on her ${side} bow`
  if (d < 80) return `broad on her ${side} bow`
  if (d <= 100) return `abeam of her, on her ${side} side`
  if (d < 120) return `broad on her ${side} quarter`
  if (d <= 150) return `on her ${side} quarter`
  return `fine on her ${side} quarter`
}

/** Aspect in Red/Green from her bow: "Green 060", "Red 120". */
export function redGreen(aspect: number): string {
  const a = norm(Math.round(aspect))
  if (a === 0) return 'right ahead'
  if (a === 180) return 'right astern'
  const pad = (n: number) => String(n).padStart(3, '0')
  return a < 180 ? `Green ${pad(a)}` : `Red ${pad(360 - a)}`
}

/* ------------------------------------------------------------------ */
/* Random aspects for the quiz and practice                            */
/* ------------------------------------------------------------------ */

/** Aspects (relative bearing of you from her bow) that read clearly: well away from the arc boundaries. */
export function sampleAspect(rng: () => number, opts: { astern?: boolean; headOn?: boolean; avoidEnds?: boolean } = {}): number {
  const { astern = true, headOn = true, avoidEnds = false } = opts
  if (headOn && !avoidEnds && rng() < 0.15) return 0
  // At least 12.5° from the 112.5° and 247.5° arc boundaries.
  const zones: [number, number][] = avoidEnds
    ? [[30, 100], [260, 330], ...(astern ? ([[130, 155], [205, 230]] as [number, number][]) : [])]
    : [[25, 100], [260, 335], ...(astern ? ([[130, 230]] as [number, number][]) : [])]
  const zone = zones[Math.floor(rng() * zones.length)]!
  const steps = Math.floor((zone[1] - zone[0]) / 5)
  return zone[0] + Math.floor(rng() * (steps + 1)) * 5
}

/* ------------------------------------------------------------------ */
/* Rule 18 and friends                                                  */
/* ------------------------------------------------------------------ */

export type Own = 'power' | 'sail'
export type Duty = 'give-way' | 'stand-on' | 'not-impede' | 'both-starboard'

export const DUTY_LABEL: Record<Duty, string> = {
  'give-way': 'You keep out of her way',
  'stand-on': 'She keeps out of your way',
  'not-impede': 'You avoid impeding her safe passage',
  'both-starboard': 'You both alter course to starboard',
}

/**
 * Rule 18 between vessels in sight of one another in open water, when
 * neither is overtaking (Rule 13) and no narrow channel or traffic
 * separation scheme applies (Rules 9 and 10). Null where Rule 18 alone
 * doesn't settle it.
 */
export function rule18(own: Own, other: Key): Duty | null {
  if (other === 'nuc' || other === 'ram' || other === 'trawl' || other === 'fishing') return 'give-way'
  if (other === 'cbd') return 'not-impede'
  if (own === 'power' && other === 'sail') return 'give-way'
  if (own === 'sail' && other === 'power') return 'stand-on'
  return null
}

