// Shared tidal displays for Module 4, drawn from tides.ts so every lesson
// shows the same fictional Port Kerran data. Server-safe (no hooks).
//
//  - TideTable: the Port Kerran table for chosen days, almanac style.
//  - TidalCurve: the standard-port curve diagram (springs solid, neaps
//    dashed) with the height-scale panel, and an optional worked example
//    drawn on it: hours from HW → factor → range line → height.
//  - StreamTable: tidal diamond rates and directions, hour by hour.

import { r2 } from '@/lib/courses/navigation/chart-geometry'
import { formatPosition } from '@/lib/courses/geo'
import {
  MEAN_NEAP_RANGE, MEAN_SPRING_RANGE, STANDARD_PORT, TABLE_START, TIDAL_DIAMONDS, clockOf, curveFactor, tidesOnDay,
  type TidalDiamond,
} from '@/lib/courses/navigation/tides'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Tue 1 Jun" for a table day (1-based). */
export function tableDate(day: number): string {
  const d = new Date(Date.UTC(TABLE_START.year, TABLE_START.month - 1, TABLE_START.day + day - 1))
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export function TideTable({ days, highlight, caption }: {
  days: number[]
  /** Highlight one tide: its day and index within that day. */
  highlight?: { day: number; index: number }
  caption?: string
}) {
  return (
    <figure className="not-lesson overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[18rem] text-left font-mono text-sm">
        <caption className="px-3 pt-3 text-left font-sans text-sm font-semibold text-text-primary">
          {caption ?? `${STANDARD_PORT} — times UT (add 1 hour for BST), heights in metres above chart datum`}
        </caption>
        <thead>
          <tr className="border-b border-border text-xs uppercase text-text-secondary">
            <th className="px-3 py-2 font-sans">Day</th>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">m</th>
            <th className="px-3 py-2 font-sans">HW/LW</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) =>
            tidesOnDay(day).map((t, i) => {
              const on = highlight && highlight.day === day && highlight.index === i
              return (
                <tr key={`${day}-${i}`} className={`${i === 0 ? 'border-t border-border' : ''} ${on ? 'bg-teal-light font-bold' : ''}`}>
                  <td className={`px-3 py-1 font-sans ${on ? 'text-navy-600' : 'text-text-secondary'}`}>{i === 0 ? tableDate(day) : ''}</td>
                  <td className="px-3 py-1">{clockOf(t.minutes).time}</td>
                  <td className="px-3 py-1">{t.height.toFixed(1)}</td>
                  <td className={`px-3 py-1 font-sans text-xs ${on ? 'text-navy-600' : 'text-text-secondary'}`}>{t.kind}</td>
                </tr>
              )
            }),
          )}
        </tbody>
      </table>
    </figure>
  )
}

// Curve diagram geometry (viewBox 0 0 900 500).
const TOP = 60
const BOTTOM = 420
const H_MAX = 6 // metres on the height scales
const LEFT0 = 50
const LEFT1 = 300
const RIGHT0 = 350
const RIGHT1 = 870
const fy = (f: number) => r2(TOP + (1 - f) * (BOTTOM - TOP))
const hx = (h: number) => r2(LEFT0 + (h / H_MAX) * (LEFT1 - LEFT0))
const tx = (hours: number) => r2(RIGHT0 + ((hours + 6) / 12) * (RIGHT1 - RIGHT0))

function curvePath(range: number): string {
  const pts: string[] = []
  for (let i = 0; i <= 120; i++) {
    const h = -6 + (12 * i) / 120
    pts.push(`${i === 0 ? 'M' : 'L'}${tx(h)} ${fy(curveFactor(h, range))}`)
  }
  return pts.join(' ')
}

export interface CurveExample {
  hwHeight: number
  lwHeight: number
  /** Hours from HW (negative before HW). */
  hoursFromHW: number
  /** How much of the construction to draw: 1 time line, 2 to the curve, 3 to the range line, 4 the height. */
  steps?: 1 | 2 | 3 | 4
}

/** The Port Kerran standard-port curve diagram, optionally with a worked example drawn on it. */
export function TidalCurve({ example, className, port = STANDARD_PORT }: {
  example?: CurveExample
  className?: string
  /** Port whose HW the time axis is read from (a secondary port uses the standard port's curve). */
  port?: string
}) {
  const ex = example
  const range = ex ? ex.hwHeight - ex.lwHeight : 0
  const f = ex ? curveFactor(ex.hoursFromHW, range) : 0
  const height = ex ? ex.lwHeight + f * range : 0
  const steps = ex?.steps ?? 4
  const rangeX = ex ? r2(hx(ex.lwHeight) + (hx(ex.hwHeight) - hx(ex.lwHeight)) * f) : 0
  return (
    // Wide enough to read on a phone: scrolls sideways there rather than shrinking the text.
    <div className="not-lesson">
    <p className="mb-1 text-xs text-text-secondary sm:hidden" aria-hidden="true">Swipe sideways to see the whole diagram →</p>
    <div className="overflow-x-auto">
    <svg viewBox="0 0 900 530" className={className ?? 'h-auto w-full min-w-[600px]'} role="img"
      aria-label={`${STANDARD_PORT} tidal curve: factor against hours from high water, springs and neaps${ex ? `. Worked example: ${ex.hoursFromHW} hours from HW, range ${range.toFixed(1)} m, factor ${f.toFixed(2)}, height ${height.toFixed(1)} m` : ''}`}>
      <rect width={900} height={530} fill="#fff" />
      <g fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize={18} fill="#1d2731">
        {/* factor grid */}
        {Array.from({ length: 11 }, (_, i) => i / 10).map((v) => (
          <g key={v}>
            <line x1={LEFT0} x2={RIGHT1} y1={fy(v)} y2={fy(v)} stroke={v % 0.5 === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={1} />
            <text x={(LEFT1 + RIGHT0) / 2} y={fy(v) + 6} textAnchor="middle" fontSize={17} fill="#475569">{v.toFixed(1)}</text>
          </g>
        ))}
        <text x={(LEFT1 + RIGHT0) / 2} y={TOP - 30} textAnchor="middle" fontSize={18} fontWeight={700}>Factor</text>
        {/* height scales */}
        {Array.from({ length: H_MAX * 2 + 1 }, (_, i) => i / 2).map((h) => (
          <g key={h}>
            <line x1={hx(h)} x2={hx(h)} y1={TOP} y2={BOTTOM} stroke="#f1f5f9" />
            {Number.isInteger(h) && <text x={hx(h)} y={TOP - 8} textAnchor="middle" fontSize={18}>{h}</text>}
            {Number.isInteger(h) && <text x={hx(h)} y={BOTTOM + 24} textAnchor="middle" fontSize={18}>{h}</text>}
          </g>
        ))}
        <text x={(LEFT0 + LEFT1) / 2} y={TOP - 30} textAnchor="middle" fontSize={18} fontWeight={700}>HW heights (m)</text>
        <text x={(LEFT0 + LEFT1) / 2} y={BOTTOM + 52} textAnchor="middle" fontSize={18} fontWeight={700}>LW heights (m)</text>
        {/* hours axis */}
        {Array.from({ length: 13 }, (_, i) => i - 6).map((h) => (
          <g key={h}>
            <line x1={tx(h)} x2={tx(h)} y1={TOP} y2={BOTTOM} stroke={h === 0 ? '#94a3b8' : '#f1f5f9'} />
            <text x={tx(h)} y={BOTTOM + 24} textAnchor="middle" fontSize={18}>{h === 0 ? 'HW' : h > 0 ? `+${h}` : h}</text>
          </g>
        ))}
        <text x={(RIGHT0 + RIGHT1) / 2} y={BOTTOM + 52} textAnchor="middle" fontSize={18} fontWeight={700}>Hours from high water at {port}</text>
        {/* curves */}
        <path d={curvePath(MEAN_SPRING_RANGE)} fill="none" stroke="#0B5563" strokeWidth={3} />
        <path d={curvePath(MEAN_NEAP_RANGE)} fill="none" stroke="#0B5563" strokeWidth={2.2} strokeDasharray="8 6" />
        <g fontSize={17}>
          <line x1={RIGHT0} x2={RIGHT0 + 30} y1={BOTTOM + 90} y2={BOTTOM + 90} stroke="#0B5563" strokeWidth={3} />
          <text x={RIGHT0 + 38} y={BOTTOM + 96}>Springs ({MEAN_SPRING_RANGE.toFixed(1)} m range)</text>
          <line x1={RIGHT0 + 270} x2={RIGHT0 + 300} y1={BOTTOM + 90} y2={BOTTOM + 90} stroke="#0B5563" strokeWidth={2.2} strokeDasharray="8 6" />
          <text x={RIGHT0 + 308} y={BOTTOM + 96}>Neaps ({MEAN_NEAP_RANGE.toFixed(1)} m range)</text>
        </g>
        {ex && (
          <g stroke="#c2410c" strokeWidth={2.5} fill="#c2410c">
            {/* range line, HW height at the top to LW height at the bottom */}
            <line x1={hx(ex.hwHeight)} y1={TOP} x2={hx(ex.lwHeight)} y2={BOTTOM} />
            <circle cx={hx(ex.hwHeight)} cy={TOP} r={5} />
            <circle cx={hx(ex.lwHeight)} cy={BOTTOM} r={5} />
            {steps >= 1 && <line x1={tx(ex.hoursFromHW)} y1={BOTTOM} x2={tx(ex.hoursFromHW)} y2={steps >= 2 ? fy(f) : BOTTOM - 30} strokeDasharray="6 4" />}
            {steps >= 2 && <circle cx={tx(ex.hoursFromHW)} cy={fy(f)} r={5} />}
            {steps >= 3 && <line x1={tx(ex.hoursFromHW)} y1={fy(f)} x2={rangeX} y2={fy(f)} strokeDasharray="6 4" />}
            {steps >= 4 && (
              <>
                <line x1={rangeX} y1={fy(f)} x2={rangeX} y2={TOP} strokeDasharray="6 4" />
                <text x={rangeX + 8} y={TOP + 26} textAnchor="start" fontSize={22} fontWeight={800} stroke="#fff" strokeWidth={4} paintOrder="stroke">{height.toFixed(1)} m</text>
              </>
            )}
            {steps >= 2 && <text x={tx(ex.hoursFromHW) + 8} y={fy(f) - 10} fontSize={18} fontWeight={700} stroke="#fff" strokeWidth={4} paintOrder="stroke">factor {f.toFixed(2)}</text>}
          </g>
        )}
      </g>
    </svg>
    </div>
    </div>
  )
}

/** Tidal stream table for some diamonds, as printed on a chart. */
export function StreamTable({ ids, highlight }: { ids: TidalDiamond['id'][]; highlight?: { id: TidalDiamond['id']; hour: number } }) {
  const diamonds = ids.map((id) => TIDAL_DIAMONDS.find((d) => d.id === id)!)
  return (
    <figure className="not-lesson overflow-x-auto rounded-xl border border-border bg-card">
      {/* Each diamond needs about 8½rem to keep its three columns apart; wider tables scroll sideways on phones. */}
      <table className="w-full text-center font-mono text-sm" style={{ minWidth: `${5 + ids.length * 8.5}rem` }}>
        <caption className="px-3 pt-3 text-left font-sans text-sm font-semibold text-text-primary">
          Tidal streams referred to HW {STANDARD_PORT} — direction °T, rates in knots at springs and neaps
        </caption>
        <thead>
          <tr className="text-xs text-text-secondary">
            <th rowSpan={2} className="border-b border-border px-2 py-1 font-sans">Hours</th>
            {diamonds.map((d) => (
              <th key={d.id} colSpan={3} className="border-l border-border px-2 pt-2 font-sans">
                <span className="mb-2 inline-block rotate-45 border-2 border-[#b5267a] px-1 text-[10px] leading-3 text-[#b5267a]"><span className="inline-block -rotate-45">{d.id}</span></span>
                <span className="block text-[10px] font-normal">{formatPosition(d.at)}</span>
              </th>
            ))}
          </tr>
          <tr className="border-b border-border text-xs text-text-secondary">
            {diamonds.map((d) => (
              <th key={d.id} colSpan={3} className="border-l border-border px-0">
                <span className="grid grid-cols-3 font-sans"><span>Dir</span><span>Sp</span><span>Np</span></span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diamonds[0]!.rows.map((row, r) => (
            <tr key={row.hour} className={row.hour === 0 ? 'bg-bg font-semibold' : ''}>
              <td className="px-2 py-0.5 font-sans text-xs text-text-secondary">
                {row.hour === 0 ? 'HW' : row.hour < 0 ? `${-row.hour} before` : `${row.hour} after`}
              </td>
              {diamonds.map((d) => {
                const x = d.rows[r]!
                const on = highlight && highlight.id === d.id && highlight.hour === x.hour
                return (
                  <td key={d.id} colSpan={3} className={`border-l border-border px-0 ${on ? 'bg-teal-light font-bold' : ''}`}>
                    <span className="grid grid-cols-3">
                      <span>{String(x.direction).padStart(3, '0')}</span>
                      <span>{x.spring.toFixed(1)}</span>
                      <span>{x.neap.toFixed(1)}</span>
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
