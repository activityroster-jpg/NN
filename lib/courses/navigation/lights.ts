// Light characteristics as printed on charts ("Fl(3)10s28m15M",
// "Q(6)+LFl15s", "Oc 4s 6m 5M", "Fl G 5s") parsed into a rhythm the
// lessons can animate, plus a plain-English description.
//
// Timings are representative, not official: a flash ≈ 0.5 s, a long flash
// 2 s, quick 60 a minute, very quick 120 a minute, an occulting eclipse
// ≈ 1 s. The period and the pattern are exact.

export type LightColour = 'W' | 'R' | 'G' | 'Y' | 'Bu'

export interface Phase {
  on: boolean
  seconds: number
}

export interface LightCharacteristic {
  /** As printed. */
  text: string
  /** Abbreviation of the rhythm, e.g. "Fl(3)", "Q(6)+LFl", "Iso". */
  rhythm: string
  colour: LightColour
  /** Seconds for one full cycle (continuous Q/VQ: one flash cycle). */
  period: number
  phases: Phase[]
  /** Elevation above MHWS, metres. */
  height?: number
  /** Nominal range, nautical miles. */
  range?: number
}

const FLASH = 0.5
const LONG_FLASH = 2
const QUICK = 1 // one quick flash cycle (60 a minute)
const VERY_QUICK = 0.5 // 120 a minute
const ECLIPSE = 1

const COLOUR_NAMES: Record<LightColour, string> = { W: 'white', R: 'red', G: 'green', Y: 'yellow', Bu: 'blue' }

const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-',
  L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-',
  W: '.--', X: '-..-', Y: '-.--', Z: '--..',
}

function flashes(n: number, on: number, gap: number): Phase[] {
  const out: Phase[] = []
  for (let i = 0; i < n; i++) {
    out.push({ on: true, seconds: on })
    if (i < n - 1) out.push({ on: false, seconds: gap })
  }
  return out
}

/** Pad a pattern with darkness (or light, for occulting) to fill the period. */
function fill(phases: Phase[], period: number, on = false): Phase[] {
  const used = phases.reduce((n, p) => n + p.seconds, 0)
  const rest = Math.round((period - used) * 1000) / 1000
  return rest > 0 ? [...phases, { on, seconds: rest }] : phases
}

/**
 * Parse a characteristic. Accepts chart spacing variants ("Fl(2) R 5s",
 * "Fl.R.5s", "Fl(3)10s28m15M"). Throws on anything it doesn't know, so a
 * typo in a lesson fails its tests rather than flashing wrongly.
 */
export function parseLight(text: string): LightCharacteristic {
  const s = text.replace(/\./g, ' ').replace(/\s+/g, ' ').trim()
  const m = s.match(
    /^(F|Fl|LFl|Q|VQ|Iso|Oc|Mo)(?:\((\d+\+\d+|\d+|[A-Z])\))?(\+LFl)?\s*(W|R|G|Y|Bu)?\s*(?:(\d+(?:\.\d+)?)s)?\s*(?:(\d+)m)?\s*(?:(\d+)M)?$/,
  )
  if (!m) throw new Error(`Unrecognised light characteristic: ${text}`)
  const [, kind, groupRaw, plusLong, colourRaw, periodRaw, heightRaw, rangeRaw] = m
  const colour = (colourRaw ?? 'W') as LightColour
  const period = periodRaw ? Number(periodRaw) : undefined
  const group = groupRaw && /^\d+$/.test(groupRaw) ? Number(groupRaw) : undefined
  let phases: Phase[]
  let cycle: number

  switch (kind) {
    case 'F':
      cycle = 1
      phases = [{ on: true, seconds: 1 }]
      break
    case 'Fl': {
      cycle = period ?? 5
      const composite = groupRaw?.match(/^(\d+)\+(\d+)$/)
      phases = composite
        // Composite group flashing, e.g. Fl(2+1): the groups are separated by a longer eclipse.
        ? fill([...flashes(Number(composite[1]), FLASH, 1), { on: false, seconds: 2 }, ...flashes(Number(composite[2]), FLASH, 1)], cycle)
        : fill(flashes(group ?? 1, FLASH, 1), cycle)
      break
    }
    case 'LFl':
      cycle = period ?? 10
      phases = fill(flashes(1, LONG_FLASH, 0), cycle)
      break
    case 'Q':
    case 'VQ': {
      const unit = kind === 'Q' ? QUICK : VERY_QUICK
      const on = unit * 0.4
      if (!group && !period) {
        cycle = unit
        phases = [{ on: true, seconds: on }, { on: false, seconds: unit - on }]
      } else {
        cycle = period ?? unit
        const quick = flashes(group ?? 1, on, unit - on)
        phases = plusLong
          ? fill([...quick, { on: false, seconds: unit - on }, { on: true, seconds: LONG_FLASH }], cycle)
          : fill(quick, cycle)
      }
      break
    }
    case 'Iso':
      cycle = period ?? 4
      phases = [{ on: true, seconds: cycle / 2 }, { on: false, seconds: cycle / 2 }]
      break
    case 'Oc': {
      cycle = period ?? 4
      const n = group ?? 1
      const eclipses: Phase[] = []
      for (let i = 0; i < n; i++) {
        eclipses.push({ on: false, seconds: ECLIPSE })
        if (i < n - 1) eclipses.push({ on: true, seconds: 1 })
      }
      phases = fill(eclipses, cycle, true)
      break
    }
    case 'Mo': {
      const code = MORSE[groupRaw ?? '']
      if (!code) throw new Error(`Unknown Morse letter in ${text}`)
      cycle = period ?? 8
      const parts: Phase[] = []
      code.split('').forEach((c, i) => {
        if (i > 0) parts.push({ on: false, seconds: FLASH })
        parts.push({ on: true, seconds: c === '.' ? FLASH : FLASH * 3 })
      })
      phases = fill(parts, cycle)
      break
    }
    default:
      throw new Error(`Unrecognised light characteristic: ${text}`)
  }

  return {
    text,
    rhythm: `${kind}${groupRaw ? `(${groupRaw})` : ''}${plusLong ?? ''}`,
    colour,
    period: cycle,
    phases,
    height: heightRaw ? Number(heightRaw) : undefined,
    range: rangeRaw ? Number(rangeRaw) : undefined,
  }
}

/** Is the light showing `seconds` into its cycle? */
export function lightOn(light: LightCharacteristic, seconds: number): boolean {
  let t = ((seconds % light.period) + light.period) % light.period
  for (const p of light.phases) {
    if (t < p.seconds) return p.on
    t -= p.seconds
  }
  return light.phases[light.phases.length - 1]!.on
}

/** Plain English, e.g. "white, group flashing 3 every 10 seconds, 28 m above MHWS, range 15 miles". */
export function describeLight(light: LightCharacteristic): string {
  const g = light.rhythm.match(/\((\d+\+\d+|\d+|[A-Z])\)/)?.[1]
  const kind = light.rhythm.replace(/\(.*?\)/, '').replace('+LFl', '')
  const every = light.rhythm === 'Q' || light.rhythm === 'VQ' || kind === 'F' ? '' : ` every ${light.period} seconds`
  const what: Record<string, string> = {
    F: 'fixed (always on)',
    Fl: g?.includes('+') ? `composite group flashing, ${g.replace('+', ' + ')} flashes` : g ? `group flashing, ${g} flashes` : 'flashing (a single flash)',
    LFl: 'long flashing (a single flash of at least 2 seconds)',
    Q: g ? `quick flashing, groups of ${g}` : 'quick flashing, continuously',
    VQ: g ? `very quick flashing, groups of ${g}` : 'very quick flashing, continuously',
    Iso: 'isophase (equal light and dark)',
    Oc: g ? `group occulting, ${g} eclipses` : 'occulting (more light than dark)',
    Mo: `Morse code "${g}"`,
  }
  let base = what[kind] ?? kind
  if (light.rhythm.endsWith('+LFl')) base = `${kind === 'VQ' ? 'very quick' : 'quick'} flashing ${g} followed by a long flash`
  const parts = [`${COLOUR_NAMES[light.colour]}, ${base}${every}`]
  if (light.height !== undefined) parts.push(`${light.height} m above MHWS`)
  if (light.range !== undefined) parts.push(`range ${light.range} miles`)
  return parts.join(', ')
}
