// Chart symbols drawn for this lesson, in the same style as the practice
// chart. Pure SVG with no hooks, so the server-rendered notes, the client
// widgets, the video and the exercises can all use them.

import type { ReactNode } from 'react'
import type { LatLon } from '@/lib/courses/geo'
import { feature, km } from '@/lib/courses/navigation/practice-chart'
import { BANK_AT, BANK_LEAST, DRYING, GULL_ELEVATION, HILL_HEIGHT, MEW_DRIES, OFFSHORE, WRECK_DEPTH, m1 } from './data'

// The practice chart's palette (PracticeChart.tsx is a client module, so
// its CHART_COLOURS can't be imported into server-rendered notes).
export const INK = '#1d2731'
export const MAGENTA = '#b5267a'
export const LAND = '#f1deb0'
export const COAST = '#3b3a36'
export const DRYING_GREEN = '#c4d8a0'
export const SHALLOW = '#b6daf1'
export const MID = '#daedf8'
export const CONTOUR = '#5f88ad'

/** Whole metres and the decimetre digit of a charted figure. */
export function splitFigure(depth: number): { whole: number; tenth: number } {
  const v = Math.abs(depth)
  const whole = Math.floor(v + 1e-9)
  return { whole, tenth: Math.round((v - whole) * 10) }
}

/**
 * A charted figure in SVG — "13₉" for a sounding, underlined "0̲₆" for a
 * drying height (negative depth). (x, y) is the baseline centre.
 */
export function Fig({ x, y, depth, size = 20, fill = INK, anchor = 'middle' }: {
  x: number; y: number; depth: number; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'
}) {
  const { whole, tenth } = splitFigure(depth)
  const showTenth = tenth > 0 || (depth < 0 && whole === 0)
  const w = String(whole).length * size * 0.56 + (showTenth ? size * 0.45 : 0)
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x
  return (
    <g>
      <text x={left} y={y} fontSize={size} fill={fill} fontStyle="italic">
        {whole}
        {showTenth && <tspan fontSize={size * 0.72} dx={size * 0.04} dy={size * 0.3}>{tenth}</tspan>}
      </text>
      {depth < 0 && <line x1={left - size * 0.05} x2={left + w + size * 0.08} y1={y + size * 0.42} y2={y + size * 0.42} stroke={fill} strokeWidth={Math.max(1, size * 0.07)} />}
    </g>
  )
}

/** The same figure inline in HTML text. */
export function FigHtml({ depth }: { depth: number }) {
  const { whole, tenth } = splitFigure(depth)
  const showTenth = tenth > 0 || (depth < 0 && whole === 0)
  return (
    <span className={`whitespace-nowrap font-serif italic ${depth < 0 ? 'underline decoration-1 underline-offset-[5px]' : ''}`}>
      {whole}
      {showTenth && <sub className="text-[0.75em]">{tenth}</sub>}
    </span>
  )
}

/** Dotted danger line used round rocks, wrecks and obstructions. */
function DangerLine({ rx = 18, ry = 18 }: { rx?: number; ry?: number }) {
  return <ellipse cx={24} cy={24} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={1.1} strokeDasharray="1.6 2.4" />
}

function Flare({ x, y, s = 1.4 }: { x: number; y: number; s?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 0 q 5 -5 13 -17 q 2 -1 1 2 q -7 11 -14 15 z" fill={MAGENTA} opacity={0.85} />
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  // Five-point star; coordinates rounded so server and browser agree.
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45
    const a = (Math.PI * i) / 5 - Math.PI / 2
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`)
  }
  return <polygon points={pts.join(' ')} fill={INK} />
}

export type SymbolId =
  | 'sounding' | 'drying' | 'contour'
  | 'rock-nc' | 'rock-cu' | 'rock-awash' | 'rock-uw'
  | 'wreck-danger' | 'wreck-known' | 'obstruction'
  | 'spot-height' | 'church' | 'mast' | 'tower'
  | 'light' | 'buoys' | 'anchorage'
  | 'seabed-sand' | 'seabed-weed' | 'seabed-rock' | 'seabed-mud'

/** A symbol drawn in a 48 × 48 box. */
export function SymbolGlyph({ id }: { id: SymbolId }) {
  switch (id) {
    case 'sounding':
      return <Fig x={24} y={30} depth={OFFSHORE.depth} size={22} />
    case 'drying':
      return <Fig x={24} y={28} depth={DRYING.depth} size={22} />
    case 'contour':
      return (
        <g>
          <path d="M0 0 H48 V17 Q36 11 24 17 T0 15 Z" fill="#fff" />
          <path d="M0 15 Q12 19 24 17 T48 17 V31 Q36 25 24 31 T0 29 Z" fill={MID} />
          <path d="M0 29 Q12 33 24 31 T48 31 V48 H0 Z" fill={SHALLOW} />
          <g fill="none" stroke={CONTOUR} strokeWidth={1.2}>
            <path d="M0 15 Q12 19 24 17 T48 17" />
            <path d="M0 29 Q12 33 24 31 T48 31" />
          </g>
          <text x={8} y={13} fontSize={10} fontWeight={600} fill={CONTOUR}>10</text>
          <text x={8} y={27} fontSize={10} fontWeight={600} fill={CONTOUR}>5</text>
        </g>
      )
    case 'rock-nc':
      return (
        <g>
          <path d="M6 27 q-2 -10 8 -13 q10 -3 13 4 q3 9 -6 12 q-11 3 -15 -3 z" fill={LAND} stroke={COAST} strokeWidth={1.3} />
          <text x={29} y={30} fontSize={14} fill={INK}>(4)</text>
        </g>
      )
    case 'rock-cu':
      // As Mew Rock is drawn on the practice chart: the asterisk, with the
      // underlined drying height printed just below and to the left of it.
      return (
        <g>
          <g stroke={INK} strokeWidth={1.5} strokeLinecap="round">
            <line x1={20} x2={38} y1={19} y2={19} /><line x1={29} x2={29} y1={10} y2={28} />
            <line x1={22.6} x2={35.4} y1={12.6} y2={25.4} /><line x1={22.6} x2={35.4} y1={25.4} y2={12.6} />
          </g>
          <Fig x={16} y={37} depth={-MEW_DRIES} size={17} />
        </g>
      )
    case 'rock-awash':
      return (
        <g fill={INK}>
          <g stroke={INK} strokeWidth={1.8} strokeLinecap="round"><line x1={11} x2={37} y1={24} y2={24} /><line x1={24} x2={24} y1={11} y2={37} /></g>
          <circle cx={17.5} cy={17.5} r={2.1} /><circle cx={30.5} cy={17.5} r={2.1} />
          <circle cx={17.5} cy={30.5} r={2.1} /><circle cx={30.5} cy={30.5} r={2.1} />
        </g>
      )
    case 'rock-uw':
      return (
        <g>
          <DangerLine rx={18} ry={18} />
          <g stroke={INK} strokeWidth={1.8} strokeLinecap="round"><line x1={15} x2={33} y1={24} y2={24} /><line x1={24} x2={24} y1={15} y2={33} /></g>
        </g>
      )
    case 'wreck-danger':
      return (
        <g>
          <DangerLine rx={22} ry={13} />
          <g stroke={INK} strokeWidth={1.7} strokeLinecap="round">
            <line x1={9} x2={39} y1={24} y2={24} />
            <line x1={24} x2={24} y1={16} y2={32} />
            <line x1={16.5} x2={16.5} y1={19.5} y2={28.5} />
            <line x1={31.5} x2={31.5} y1={19.5} y2={28.5} />
          </g>
        </g>
      )
    case 'wreck-known':
      return (
        <g>
          <DangerLine rx={22.5} ry={14} />
          <Fig x={15} y={29} depth={WRECK_DEPTH} size={16} />
          <text x={34} y={29} fontSize={12.5} fill={INK} textAnchor="middle">Wk</text>
        </g>
      )
    case 'obstruction':
      return (
        <g>
          <DangerLine rx={22.5} ry={14} />
          <text x={24} y={28.5} fontSize={12.5} fill={INK} textAnchor="middle">Obstn</text>
        </g>
      )
    case 'spot-height':
      return (
        <g>
          <circle cx={11} cy={25} r={2.6} fill={INK} />
          <text x={17} y={31} fontSize={18} fill={INK}>{HILL_HEIGHT}</text>
        </g>
      )
    case 'church':
      return (
        <g stroke={INK} strokeWidth={1.6} fill="none">
          <circle cx={24} cy={33} r={4.5} /><line x1={24} x2={24} y1={28.5} y2={12} /><line x1={19} x2={29} y1={18} y2={18} />
        </g>
      )
    case 'mast':
      return (
        <g stroke={INK} strokeWidth={1.6} fill="none">
          <circle cx={24} cy={36} r={3.5} /><line x1={24} x2={24} y1={32.5} y2={10} />
          <line x1={19} x2={24} y1={17} y2={10} /><line x1={29} x2={24} y1={17} y2={10} />
        </g>
      )
    case 'tower':
      return (
        <g>
          <rect x={18.5} y={18} width={11} height={15} fill="none" stroke={INK} strokeWidth={1.6} />
          <circle cx={24} cy={33} r={2.2} fill={INK} />
        </g>
      )
    case 'light':
      return (
        <g>
          <Flare x={20} y={32} />
          <Star cx={20} cy={32} r={9} />
        </g>
      )
    case 'buoys':
      return (
        <g>
          <Flare x={15} y={34} s={1.1} />
          <polygon points="9,34 21,34 15,19" fill="#1f9d55" stroke={INK} strokeWidth={1} />
          <circle cx={15} cy={34} r={2} fill="#fff" stroke={INK} strokeWidth={1} />
          <Flare x={34} y={34} s={1.1} />
          <rect x={29} y={21} width={10} height={13} fill="#d9342b" stroke={INK} strokeWidth={1} />
          <circle cx={34} cy={34} r={2} fill="#fff" stroke={INK} strokeWidth={1} />
        </g>
      )
    case 'seabed-sand':
    case 'seabed-weed':
    case 'seabed-rock':
    case 'seabed-mud':
      return (
        <text x={24} y={31} fontSize={18} fontStyle="italic" fill={INK} textAnchor="middle">
          {{ 'seabed-sand': 'S', 'seabed-weed': 'Wd', 'seabed-rock': 'R', 'seabed-mud': 'M' }[id]}
        </text>
      )
    case 'anchorage':
      return (
        <g stroke={MAGENTA} strokeWidth={2} fill="none" strokeLinecap="round" transform="translate(24 25) scale(1.9)">
          <circle cx={0} cy={-7} r={1.8} /><line x1={0} x2={0} y1={-5} y2={6} />
          <line x1={-4} x2={4} y1={-2} y2={-2} /><path d="M-6 1 q 1 6 6 6 q 5 0 6 -6" />
        </g>
      )
  }
}

/** A symbol as a standalone SVG image. */
export function SymbolImage({ id, size = 48, label, className }: { id: SymbolId; size?: number; label?: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={className}>
      <rect width={48} height={48} rx={4} fill="#fff" />
      <g fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"><SymbolGlyph id={id} /></g>
    </svg>
  )
}

export interface SymbolInfo {
  id: SymbolId
  name: string
  group: 'Depths' | 'Rocks' | 'Wrecks and obstructions' | 'Seabed' | 'Land and landmarks' | 'Lights, buoys and anchorages'
  /** What the symbol means and how it is drawn. */
  meaning: ReactNode
  /** Where it appears on the practice chart, if it does. */
  onChart?: { at: LatLon; widthNm: number; note: ReactNode; features?: string[] }
}

export const SYMBOLS: SymbolInfo[] = [
  {
    id: 'sounding', name: 'Sounding', group: 'Depths',
    meaning: <>A depth below chart datum, in metres. The small figure set lower down is decimetres, so <FigHtml depth={OFFSHORE.depth} /> means {m1(OFFSHORE.depth)} m. In deeper water only whole metres are printed.</>,
    onChart: { at: OFFSHORE.at, widthNm: 3.6, note: <>North of the old tower: <FigHtml depth={OFFSHORE.depth} /> = {m1(OFFSHORE.depth)} m below chart datum.</> },
  },
  {
    id: 'drying', name: 'Drying height', group: 'Depths',
    meaning: <>An underlined figure: the height of ground that uncovers at low water, measured <strong>up</strong> from chart datum. <FigHtml depth={DRYING.depth} /> means it dries {m1(-DRYING.depth)} m.</>,
    onChart: { at: DRYING.at, widthNm: 2.8, note: <>The foreshore north of the old tower dries {m1(-DRYING.depth)} m. Drying areas are tinted green.</> },
  },
  {
    id: 'contour', name: 'Depth contour', group: 'Depths',
    meaning: <>A line joining points of equal depth, labelled in metres. This chart has contours at 2, 5, 10 and 20 m. The tints change at the drying line, at 5 m and at 10 m.</>,
    onChart: { at: BANK_AT, widthNm: 6, note: <>Brennan Bank: rings of 20, 10 and 5 m contours round a least depth of <FigHtml depth={BANK_LEAST} /> ({m1(BANK_LEAST)} m).</> },
  },
  {
    id: 'rock-nc', name: 'Rock that never covers', group: 'Rocks',
    meaning: <>Above water even at high water springs. Drawn as a tiny island in the land colour, with its height above MHWS printed beside it (often in brackets).</>,
  },
  {
    id: 'rock-cu', name: 'Rock that covers and uncovers', group: 'Rocks',
    meaning: <>Dries at low water and is covered at high water. An asterisk, with its drying height — underlined, like every drying height — printed beside it. Admiralty charts often put that figure in brackets.</>,
    onChart: { at: feature('mew-rock').at, widthNm: 3.5, features: ['mew-rock'], note: <>Mew Rock: the asterisk, with <FigHtml depth={-MEW_DRIES} /> printed beside it — it dries {m1(MEW_DRIES)} m. A beacon (an isolated danger mark: Lesson 6) stands on it.</> },
  },
  {
    id: 'rock-awash', name: 'Rock awash at chart datum', group: 'Rocks',
    meaning: <>Its top is at about chart datum, so it only uncovers (or is awash) at the very lowest tides. The rest of the time it is covered, often by very little water. A cross with a dot in each corner.</>,
    onChart: { at: feature('teeth').at, widthNm: 3.5, features: ['teeth'], note: <>The Teeth, east of Gull Point, ringed by a dotted danger line. A cardinal buoy guards their eastern side.</> },
  },
  {
    id: 'rock-uw', name: 'Underwater rock', group: 'Rocks',
    meaning: <>A rock that never uncovers: a plain cross. When it is considered dangerous to surface navigation it is ringed by a dotted danger line; if its least depth is known, that depth is printed inside the line.</>,
  },
  {
    id: 'wreck-danger', name: 'Dangerous wreck', group: 'Wrecks and obstructions',
    meaning: <>A wreck whose depth is not known but which is considered dangerous to surface navigation: a long line crossed by three short strokes, inside a dotted danger line.</>,
  },
  {
    id: 'wreck-known', name: 'Wreck with known depth', group: 'Wrecks and obstructions',
    meaning: <>The least depth over the wreck at chart datum, with the abbreviation Wk, inside a dotted danger line. <FigHtml depth={WRECK_DEPTH} /> Wk: {m1(WRECK_DEPTH)} m over the wreck.</>,
    onChart: { at: feature('wreck').at, widthNm: 3.5, features: ['wreck'], note: <>South-west of the island, in otherwise deep water: {m1(WRECK_DEPTH)} m over it at chart datum.</> },
  },
  {
    id: 'obstruction', name: 'Obstruction', group: 'Wrecks and obstructions',
    meaning: <>Something on the seabed that could damage or foul a boat but isn’t a rock or a wreck. Labelled Obstn in a dotted danger line, with its least depth when known.</>,
  },
  {
    id: 'seabed-sand', name: 'Sand (S)', group: 'Seabed',
    meaning: <>The seabed is sand: good holding, and the best place to drop the anchor. Often printed as S, or fS for fine sand.</>,
  },
  {
    id: 'seabed-mud', name: 'Mud (M)', group: 'Seabed',
    meaning: <>A mud bottom. Usually good holding once the anchor has dug in, though very soft mud can let it drag.</>,
  },
  {
    id: 'seabed-weed', name: 'Weed (Wd)', group: 'Seabed',
    meaning: <>Weed, which in the Mediterranean is usually seagrass. Poor holding: the anchor skids over the top. Seagrass is also protected in many areas, so anchor on sand instead.</>,
  },
  {
    id: 'seabed-rock', name: 'Rock (R)', group: 'Seabed',
    meaning: <>A rocky bottom: poor holding, and an anchor can jam in a crack. Fine for a lunch stop on a buoy, not for the night at anchor.</>,
  },
  {
    id: 'spot-height', name: 'Spot height', group: 'Land and landmarks',
    meaning: <>A dot with the height of a hilltop, in metres above mean high water springs (MHWS).</>,
    onChart: { at: feature('beacon-hill').at, widthNm: 4, features: ['beacon-hill'], note: <>Beacon Hill, the island’s summit: {HILL_HEIGHT} m above MHWS.</> },
  },
  {
    id: 'church', name: 'Church spire', group: 'Land and landmarks',
    meaning: <>A church. Spires and towers stand out from seaward, so they make excellent landmarks for taking bearings.</>,
    onChart: { at: feature('church').at, widthNm: 4, features: ['church'], note: <>The spire inland from Port Kerran: a conspicuous landmark.</> },
  },
  {
    id: 'mast', name: 'Radio mast', group: 'Land and landmarks',
    meaning: <>A tall mast. “(R Lts)” beside it means it shows red lights at night.</>,
    onChart: { at: feature('mast').at, widthNm: 4, features: ['mast'], note: <>The radio mast north-west of Beacon Hill, with red lights.</> },
  },
  {
    id: 'tower', name: 'Tower', group: 'Land and landmarks',
    meaning: <>A tower that can be seen from seaward — another landmark for bearings.</>,
    onChart: { at: feature('tower').at, widthNm: 4, features: ['tower'], note: <>The old tower on the north-east of the island.</> },
  },
  {
    id: 'light', name: 'Lighthouse', group: 'Lights, buoys and anchorages',
    meaning: <>A star with a magenta flare marks a light. Its characteristic is printed beside it; the figure in metres is the light’s height above MHWS. Lesson 7 decodes the rest.</>,
    onChart: { at: feature('gull-point-lt').at, widthNm: 4, features: ['gull-point-lt'], note: <>Gull Point: {feature('gull-point-lt').light} — the light is {GULL_ELEVATION} m above MHWS.</> },
  },
  {
    id: 'buoys', name: 'Buoys', group: 'Lights, buoys and anchorages',
    meaning: <>Buoys are drawn by shape and colour: here a green cone and a red can. A magenta flare means the buoy is lit. Lessons 5 and 6 cover buoyage.</>,
    onChart: { at: km(4.15, 11.5), widthNm: 3, features: ['no1', 'no2', 'no3', 'no4'], note: <>Numbers 1 to 4 buoys mark the channel into Port Kerran.</> },
  },
  {
    id: 'anchorage', name: 'Anchorage', group: 'Lights, buoys and anchorages',
    meaning: <>A magenta anchor marks an anchorage.</>,
    onChart: { at: feature('anchorage').at, widthNm: 4, features: ['anchorage'], note: <>Kerran Roads, north of the island, sheltered from southerly winds.</> },
  },
]

export function symbolInfo(id: SymbolId): SymbolInfo {
  return SYMBOLS.find((s) => s.id === id)!
}
