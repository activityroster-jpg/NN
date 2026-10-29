// Drawings for the pilotage lesson, ported from the Boaty Jobs pilotage
// lesson: the view ahead from the boat, the pilotage card sketch, a pilot
// book page and the plan on the chart. Pure components (no hooks), safe in
// the server-rendered notes; computed coordinates are rounded with r2.

import { formatBearing, reciprocal, rhumbDestination, type LatLon } from '@/lib/courses/geo'
import { r2, viewAround } from '@/lib/courses/navigation/chart-geometry'
import { LEADING_LINE } from '@/lib/courses/navigation/practice-chart'
import { IalaMark } from '../../marks'
import PracticeChart, { CHART_COLOURS, ChartLine, ChartText } from '../../PracticeChart'
import { ClearingSides, KeepOut } from './transit-art'
import {
  ABORT_MAG, CHURCH, DEEP_CONTOUR, GATE12, KA, LEGS, MEW, MEW_ABEAM_MAG, MEW_ABEAM_PAST12,
  NO1, NO2, NO3, NO4, SPIRE_CLEAR, SPIRE_CLEAR_MAG, SPIRE_LIMIT, TIMES, WARN_CONTOUR, WRECK, cab, lightsOffset, limitText,
  viewAhead,
} from './data'

const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"

/* ------------------------------------------------------------------ */
/* The view ahead from the boat                                        */
/* ------------------------------------------------------------------ */

export const AHEAD_W = 800
export const AHEAD_H = 340
const HORIZON = 206
/** Degrees across the view. */
const FOV = 90
const xFor = (rel: number) => r2(AHEAD_W / 2 + (rel * AHEAD_W) / FOV)

/**
 * What you see looking ahead up the leading line from `at`: the marks in
 * `ids`, each at its bearing relative to the bow and sized by distance, and
 * (optionally) the leading lights. Heights and sizes are exaggerated.
 */
export function ViewAhead({ at, ids, lights = true, box, title, markScale = 1 }: {
  at: LatLon; ids: string[]; lights?: boolean
  /** Enlarge the marks (scenes shown small on phones). */
  markScale?: number
  /** Position inside a parent SVG (scenes); otherwise the view fills its container's width. */
  box?: { x: number; y: number; w: number; h: number }
  title?: string
}) {
  const marks = viewAhead(at, ids).filter((m) => Math.abs(m.rel) < FOV / 2 - 3).sort((a, b) => b.distance - a.distance)
  const offset = lightsOffset(at)
  const fx = AHEAD_W / 2
  const rx = r2(fx + Math.max(-60, Math.min(60, offset * 120)))
  return (
    <svg
      viewBox={`0 0 ${AHEAD_W} ${AHEAD_H}`}
      fontFamily={FONT}
      {...(box ? { x: box.x, y: box.y, width: box.w, height: box.h } : { className: 'block h-auto w-full rounded-lg', role: 'img', 'aria-label': title ?? 'The view ahead from the boat' })}
    >
      <rect width={AHEAD_W} height={HORIZON} fill="#cfe3f2" />
      <path d={`M0 ${HORIZON} L0 176 Q 120 150 250 168 T 470 150 T 640 162 T ${AHEAD_W} 172 L${AHEAD_W} ${HORIZON} Z`} fill="#9bb38a" />
      <path d={`M300 ${HORIZON} Q 360 182 400 186 Q 440 182 500 ${HORIZON} Z`} fill="#86a0b5" opacity={0.55} />
      <rect y={HORIZON} width={AHEAD_W} height={AHEAD_H - HORIZON} fill="#3d6f93" />
      {lights && (
        <g>
          {/* Rear structure: further off, taller, so its light shows above the front one. */}
          <rect x={rx - 3} y={128} width={6} height={HORIZON - 128 - 18} fill="#f8fafc" stroke="#475569" strokeWidth={1} />
          <circle cx={rx} cy={126} r={5} fill="#fff7d6" stroke="#475569" strokeWidth={1} />
          <rect x={fx - 5} y={164} width={10} height={HORIZON - 164} fill="#f8fafc" stroke="#475569" strokeWidth={1} />
          <circle cx={fx} cy={162} r={6} fill="#fff7d6" stroke="#475569" strokeWidth={1} />
          {!marks.some((m) => Math.abs(m.rel) < 4) && <text x={fx} y={108} fontSize={22} fontWeight={700} fill="#1d2731" textAnchor="middle">Ldg Lts</text>}
        </g>
      )}
      {marks.map(({ mark, rel, distance }) => {
        const scale = r2(markScale * Math.max(0.16, Math.min(0.85, 0.62 / Math.pow(distance, 0.7))))
        const y = r2(Math.min(AHEAD_H - 40, HORIZON + 30 / Math.max(0.3, distance)))
        const x = xFor(rel)
        return (
          <g key={mark.id}>
            <IalaMark type={mark.type} x={x} y={y} scale={scale} />
            <text x={Math.max(70 * markScale, Math.min(AHEAD_W - 70 * markScale, x))} y={r2(y + 34 * markScale)} fontSize={r2(26 * markScale)} fontWeight={700} textAnchor="middle" fill="#fff" stroke="#1d2731" strokeWidth={3} paintOrder="stroke">{mark.label}</text>
          </g>
        )
      })}
      <line x1={fx} x2={fx} y1={AHEAD_H - 16} y2={AHEAD_H} stroke="#fff" strokeWidth={4} />
      <text x={fx} y={AHEAD_H - 22} fontSize={18} textAnchor="middle" fill="#fff">ahead</text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* The pilotage card: a sketch with arrows, bearings and notes          */
/* ------------------------------------------------------------------ */

const CARD_W = 600
const CARD_H = 940
const LX = 150 // x of the leading line in the sketch
const Y_KA = 770
const Y_END = 200
const PX_PER_NM = (Y_KA - Y_END) / (LEGS.reduce((n, l) => n + l.distance, 0))
const yAt = (milesFromKA: number) => r2(Y_KA - milesFromKA * PX_PER_NM)
const Y12 = yAt(LEGS[0]!.distance)
const Y34 = yAt(LEGS[0]!.distance + LEGS[1]!.distance)

function Can({ x, y }: { x: number; y: number }) {
  return <rect x={x - 11} y={y - 24} width={22} height={24} fill="#d9342b" stroke="#1d2731" strokeWidth={2} />
}
function Cone({ x, y }: { x: number; y: number }) {
  return <polygon points={`${x - 13},${y} ${x + 13},${y} ${x},${y - 28}`} fill="#1f9d55" stroke="#1d2731" strokeWidth={2} />
}
function Tick({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y - 20} width={22} height={22} rx={3} fill="#fff" stroke="#1d2731" strokeWidth={2} />
      <text x={x + 32} y={y} fontSize={22} fill="#1d2731">{label}</text>
    </g>
  )
}

/** The Port Kerran plan as a skipper might draw it: not to scale across, legs to scale along. */
export function PilotageCardSketch() {
  const legNote = (i: number, extra?: string) => {
    const l = LEGS[i]!
    const mid = r2((yAt(LEGS.slice(0, i).reduce((n, x) => n + x.distance, 0)) + yAt(LEGS.slice(0, i + 1).reduce((n, x) => n + x.distance, 0))) / 2)
    return (
      <g key={l.id}>
        <text x={290} y={mid - 14} fontSize={36} fontWeight={800} fill="#0b5563">{formatBearing(l.magnetic, 'M')}</text>
        <text x={290} y={mid + 16} fontSize={22} fill="#1d2731">{`${l.distance < 1 ? `${cab(l.distance)} ca` : `${l.distance.toFixed(1)} M`} · ${l.minutes} min`}</text>
        {extra && <text x={290} y={mid + 44} fontSize={20} fill="#475569">{extra}</text>}
      </g>
    )
  }
  const arrow = (y1: number, y2: number) => (
    <g>
      <line x1={LX} x2={LX} y1={y1 - 30} y2={y2 + 40} stroke="#0b5563" strokeWidth={4} />
      <polygon points={`${LX},${y2 + 24} ${LX - 9},${y2 + 44} ${LX + 9},${y2 + 44}`} fill="#0b5563" />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} className="mx-auto block h-auto w-full max-w-[520px]" role="img" fontFamily={FONT}
      aria-label={`Pilotage card for Port Kerran: three legs on ${formatBearing(LEGS[0]!.magnetic, 'M')}, the marks, times, depths, the clearing bearing and the way out`}>
      <rect x={4} y={4} width={CARD_W - 8} height={CARD_H - 8} rx={14} fill="#fffdf3" stroke="#d6cfbf" strokeWidth={3} />
      <text x={30} y={52} fontSize={32} fontWeight={800} fill="#1d2731">PORT KERRAN — IN</text>
      <text x={30} y={86} fontSize={20} fill="#475569">{`ETA Kerran App ${TIMES.ka} · in by ${TIMES.end}`}</text>
      <text x={30} y={114} fontSize={20} fill="#475569">{`Call the harbour office at Kerran App · fenders to port`}</text>
      <line x1={30} x2={CARD_W - 30} y1={132} y2={132} stroke="#d6cfbf" strokeWidth={2} />

      {/* Inlet coast, sketched */}
      <path d={`M${LX - 105} ${Y34 - 40} Q ${LX - 40} ${Y34 - 70} ${LX - 34} ${Y_END + 10} L ${LX - 30} ${Y_END - 40}`} fill="none" stroke="#8a7a5e" strokeWidth={3} />
      <path d={`M${LX + 105} ${Y34 - 40} Q ${LX + 40} ${Y34 - 70} ${LX + 34} ${Y_END + 10} L ${LX + 30} ${Y_END - 40}`} fill="none" stroke="#8a7a5e" strokeWidth={3} />
      {/* Leading lights */}
      <circle cx={LX} cy={152} r={7} fill="#f5b301" stroke="#1d2731" strokeWidth={2} />
      <circle cx={LX} cy={176} r={7} fill="#f5b301" stroke="#1d2731" strokeWidth={2} />
      <text x={LX + 46} y={162} fontSize={20} fill="#1d2731">{`Ldg Lts ${LEADING_LINE.light}`}</text>
      <text x={LX - 44} y={Y_END + 6} fontSize={20} fontWeight={700} fill="#1d2731" textAnchor="end">HBR</text>

      {arrow(Y_KA, Y12)}
      {arrow(Y12, Y34)}
      {arrow(Y34, Y_END)}

      {/* Marks */}
      <Cone x={LX + 48} y={Y12 + 10} /><Can x={LX - 48} y={Y12 + 10} />
      <text x={LX + 66} y={Y12 + 6} fontSize={20} fill="#1d2731">1</text>
      <text x={LX - 66} y={Y12 + 6} fontSize={20} fill="#1d2731" textAnchor="end">2</text>
      <Cone x={LX + 48} y={Y34 + 10} /><Can x={LX - 48} y={Y34 + 10} />
      <text x={LX + 66} y={Y34 + 6} fontSize={20} fill="#1d2731">3</text>
      <text x={LX - 66} y={Y34 + 6} fontSize={20} fill="#1d2731" textAnchor="end">4</text>
      <text x={LX - 66} y={Y12 + 30} fontSize={18} fill="#475569" textAnchor="end">Fl R 5s</text>
      <text x={LX + 66} y={Y12 + 30} fontSize={18} fill="#475569">Fl G 5s</text>
      <text x={LX - 66} y={Y34 + 30} fontSize={18} fill="#475569" textAnchor="end">Fl(2) R</text>
      <text x={LX + 66} y={Y34 + 30} fontSize={18} fill="#475569">Fl(2) G</text>
      {/* Safe water mark */}
      <g>
        <rect x={LX - 9} y={Y_KA - 4} width={18} height={26} fill="#fff" stroke="#1d2731" strokeWidth={2} />
        <rect x={LX - 3} y={Y_KA - 4} width={6} height={26} fill="#d9342b" />
        <circle cx={LX} cy={Y_KA - 12} r={6} fill="#d9342b" stroke="#1d2731" strokeWidth={1.5} />
        <text x={LX - 22} y={Y_KA + 18} fontSize={20} fill="#1d2731" textAnchor="end">KA LFl10s</text>
      </g>
      {/* Mew Rock beam bearing on leg 2 */}
      <line x1={LX - 24} x2={36} y1={yAt(LEGS[0]!.distance + MEW_ABEAM_PAST12)} y2={yAt(LEGS[0]!.distance + MEW_ABEAM_PAST12)} stroke="#475569" strokeWidth={2} strokeDasharray="6 5" />
      <text x={36} y={yAt(LEGS[0]!.distance + MEW_ABEAM_PAST12) - 8} fontSize={16} fill="#475569">{`Mew Rk ${formatBearing(MEW_ABEAM_MAG, 'M')} (${cab(MEW_ABEAM_PAST12)} ca)`}</text>

      {legNote(0, 'Ldg Lts in line')}
      {legNote(1)}
      {legNote(2, `STOP if sounder < ${WARN_CONTOUR} m`)}

      <Tick x={482} y={Y12 + 4} label={TIMES.gate12} />
      <Tick x={482} y={Y34 + 4} label={TIMES.gate34} />
      <Tick x={482} y={Y_END + 4} label={TIMES.end} />

      <line x1={30} x2={CARD_W - 30} y1={812} y2={812} stroke="#d6cfbf" strokeWidth={2} />
      <text x={30} y={846} fontSize={21} fill="#1d2731">{`Arriving: spire ${limitText(SPIRE_LIMIT, SPIRE_CLEAR_MAG, 'M')} (wreck, Mew Rk)`}</text>
      <text x={30} y={878} fontSize={21} fill="#1d2731">{`Sounder > ${DEEP_CONTOUR} m to No 3/4`}</text>
      <text x={30} y={910} fontSize={21} fontWeight={700} fill="#b42318">{`ABORT: ${formatBearing(ABORT_MAG, 'M')}, lights astern, to KA`}</text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* The plan on the practice chart                                       */
/* ------------------------------------------------------------------ */

/** Length of the drawn clearing line, from the spire out to sea (miles). */
export const CLEARING_LINE_NM = 7.6

/** The whole plan on the chart: legs, the clearing line with its dangerous side hatched, and the dangers ringed. */
export function PlanChart({ id }: { id: string }) {
  const lineEnd = rhumbDestination(CHURCH.at, reciprocal(SPIRE_CLEAR), CLEARING_LINE_NM)
  const C = CHART_COLOURS
  return (
    <PracticeChart view={viewAround({ lat: (KA.at.lat + CHURCH.at.lat) / 2 - 0.4 / 60, lon: (KA.at.lon + WRECK.at.lon) / 2 }, 8.4, 1.25)} zoomable
      title="Practice chart: the pilotage plan into Port Kerran">
      <ClearingSides id={id} landmark={CHURCH.at} limit={SPIRE_LIMIT} value={SPIRE_CLEAR} r1={2.6} r2={CLEARING_LINE_NM} spread={30} />
      <ChartLine from={CHURCH.at} to={lineEnd} colour={C.plotAlt} width={1.6} />
      <ChartText at={rhumbDestination(CHURCH.at, reciprocal(SPIRE_CLEAR), 6.3)} colour={C.plotAlt} size={10} dx={8} anchor="start" bold>
        {`Spire ${limitText(SPIRE_LIMIT, SPIRE_CLEAR)} (${formatBearing(SPIRE_CLEAR_MAG, 'M')})`}
      </ChartText>
      <KeepOut at={WRECK.at} radiusNm={0.4} />
      <KeepOut at={MEW.at} radiusNm={0.4} />
      {LEGS.map((l) => <ChartLine key={l.id} from={l.from} to={l.to} colour={C.plot} width={2.2} arrow />)}
      <ChartText at={{ lat: (KA.at.lat + GATE12.lat) / 2, lon: KA.at.lon }} colour={C.plot} size={10} dx={8} dy={4} anchor="start" bold>
        {`${formatBearing(LEGS[0]!.trueCourse, 'T')} = ${formatBearing(LEGS[0]!.magnetic, 'M')}`}
      </ChartText>
      <ChartText at={KA.at} colour={C.plot} size={9} dx={-10} dy={4} anchor="end" bold>{`KA ${TIMES.ka}`}</ChartText>
      <ChartLine from={NO1.at} to={NO2.at} colour={C.plot} width={0.8} dash="2 3" />
      <ChartLine from={NO3.at} to={NO4.at} colour={C.plot} width={0.8} dash="2 3" />
    </PracticeChart>
  )
}

/* ------------------------------------------------------------------ */
/* A pilot book page for Port Kerran (fictional), as a charter pilot   */
/* book lays one out                                                    */
/* ------------------------------------------------------------------ */

export function PilotBookPage() {
  const rows: Array<[string, string]> = [
    ['Approach', `From the south. Make for Kerran Approach buoy (safe water, LFl10s), then follow the leading lights (${LEADING_LINE.light}) in line on 000° up the buoyed channel, Nos 1 to 4.`],
    ['Dangers', 'Mew Rock (dries 1.2 m, isolated danger beacon Fl(2)5s) and a wreck with 4.2 m over it lie west of the approach. The Teeth, off Gull Point to the east, are awash.'],
    ['Depths', 'Over 20 m to Nos 3 and 4, then shoaling quickly up the inlet: 5 to 10 m off the quay, drying at the head.'],
    ['Berths', 'Visitors stern-to on the south quay with lazy lines. Call the harbour office by phone or VHF before you reach the Approach buoy; in summer a boat comes out to help.'],
    ['Shelter', 'Good in northerlies. A southerly sends a swell into the inlet: in a southerly gale go round to Kerran Roads, north of the island.'],
    ['Facilities', 'Water and power on the quay. Fuel by arrangement. Shops and tavernas in the village.'],
  ]
  return (
    <div className="not-lesson rounded-card border border-line bg-[#fffdf3] p-4 text-[15px] leading-snug sm:p-5">
      <p className="text-eyebrow text-muted">Pilot book · practice harbour (fictional)</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">Port Kerran</p>
      <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
        {rows.map(([h, b]) => (
          <div key={h} className="contents">
            <dt className="font-semibold text-ink">{h}</dt>
            <dd className="text-muted">{b}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
