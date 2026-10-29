'use client'

// Interactive widgets for "Reading the chart", ported from the Boaty Jobs
// lessons reading-a-chart, chart-symbols-and-depths and
// latitude-and-longitude, plus a bay reader written for charter skippers:
//   DepthProbe     tap anywhere: the depth, its colour band and contours
//   SymbolExplorer pick a symbol: what it means, and where it is on the chart
//   GlobeExplorer  latitude and longitude on a globe, with charter bases
//   ReadPosition   read a feature's position off the border scales
//   PlotPractice   plot a given position
//   BayReader      choose a wind and a stop: shelter, depth, seabed, dangers

import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { checkPlot } from '@/lib/courses/answers'
import { formatLat, formatLon, formatPosition, rhumbDestination, rhumbDistance, type LatLon } from '@/lib/courses/geo'
import { FULL_VIEW, viewAround, type ViewRect } from '@/lib/courses/navigation/chart-geometry'
import { feature, km } from '@/lib/courses/navigation/practice-chart'
import PracticeChart, { CHART_COLOURS, ChartHighlight, ChartLine, ChartPoint, ChartText } from '../../PracticeChart'
import { BAND_INFO, BAND_ORDER, bandOf, contoursAround, depthAtPoint, roundDepth, soundingText, type Band } from './bands'
import {
  BAY_STOPS, POINTS, POINT_NAMES, SEABED, dangersNear, pointBearing, shelterAt, type BayStop, type Point, type Shelter,
} from './data'
import { BANK_CENTRE, DRYING_SOUNDING } from './geometry'
import { GlobeDisc, GlobeGrid, globePoint, meridianPath, parallelPath, type GlobeView } from './globe'
import { PLOT_TARGETS, latReading, latScaleView, lonReading, lonScaleView, nearestScales, regionView } from './position'
import { FigHtml, SYMBOLS, SymbolImage, symbolInfo, type SymbolId } from './symbols'


export const BAND_SWATCH: Record<Band, string> = {
  land: CHART_COLOURS.land,
  drying: CHART_COLOURS.drying,
  shallow: CHART_COLOURS.shallow,
  mid: CHART_COLOURS.mid,
  deep: CHART_COLOURS.sea,
}

/* ------------------------------------------------------------------ */
/* Depth probe                                                         */
/* ------------------------------------------------------------------ */

const DANGERS = [
  { f: feature('teeth'), what: 'The Teeth, rocks that are awash at chart datum' },
  { f: feature('mew-rock'), what: 'Mew Rock, which dries' },
  { f: feature('wreck'), what: 'a dangerous wreck' },
]

interface Preset { name: string; at: LatLon }

const PRESETS: Preset[] = [
  { name: 'Brennan Bank', at: BANK_CENTRE },
  { name: 'Foreshore by Kerran Bay', at: DRYING_SOUNDING.at },
  { name: 'Harbour approach', at: km(3.0, 11.5) },
  { name: 'Next to The Teeth', at: km(7.1, 4.6) },
  { name: 'Kerran Roads anchorage', at: feature('anchorage').at },
  { name: 'Beacon Hill', at: feature('beacon-hill').at },
  { name: 'Open sea to the south', at: km(1.2, 10.0) },
]

function contourText(depth: number): string {
  const [lo, hi] = contoursAround(depth)
  if (lo === null) return `Shallower than the ${hi} m contour.`
  if (hi === null) return `Deeper than the ${lo} m contour, the deepest drawn on this chart.`
  return `Deeper than ${lo} m, but inside the ${hi} m contour.`
}

function DepthReadout({ at }: { at: LatLon }) {
  const d = depthAtPoint(at)
  const band = bandOf(d)
  const info = BAND_INFO[band]
  const danger = DANGERS.find((x) => rhumbDistance(x.f.at, at) < 0.3)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="h-7 w-7 shrink-0 rounded border border-navy/30" style={{ background: BAND_SWATCH[band] }} aria-hidden="true" />
        <p className="font-semibold text-text-primary">{info.tint}: {band === 'land' ? 'land' : band === 'drying' ? 'dries' : info.label}</p>
      </div>
      {d === null ? (
        <p>Land. Heights on land are measured in metres above MHWS, not from chart datum.</p>
      ) : d < 0 ? (
        <p>
          Dries about <strong>{Math.abs(roundDepth(d))} m</strong>: at chart datum the seabed here stands {Math.abs(roundDepth(d))} m
          above the water. The chart would show it as <span className="underline">{soundingText(d)}</span> (underlined).
        </p>
      ) : (
        <p>
          About <strong>{roundDepth(d)} m</strong> below chart datum — a sounding of {soundingText(d)}. {contourText(d)}
        </p>
      )}
      {danger && (
        <p className="rounded-md bg-warning/15 px-2 py-1 text-[13px]">
          <TriangleAlert size={14} strokeWidth={1.5} className="mr-1 inline-block align-[-2px] text-warning-text" aria-hidden="true" />You are next to {danger.what}. The depths around a danger don’t tell you about the danger itself: the chart
          symbol always wins, so keep well clear.
        </p>
      )}
      <p className="font-mono text-xs text-text-secondary">{formatPosition(at)}</p>
    </div>
  )
}

export function DepthProbe() {
  const [point, setPoint] = useState<LatLon | null>(null)
  const [view, setView] = useState<ViewRect>(FULL_VIEW)
  const band = point ? bandOf(depthAtPoint(point)) : null

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0">
        <PracticeChart mode="pick" zoomable view={view} marker={point} onPick={setPoint} title="Practice chart: tap anywhere to read the depth" />
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Try a place">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => { setPoint(p.at); setView(viewAround(p.at, 3.5)) }}
              className="rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-medium hover:bg-teal-light"
            >
              {p.name}
            </button>
          ))}
          {view !== FULL_VIEW && (
            <button type="button" onClick={() => setView(FULL_VIEW)} className="rounded-lg border border-border bg-bg px-2.5 py-1 text-xs font-medium hover:bg-teal-light">
              Whole chart
            </button>
          )}
        </div>
      </div>
      <div className="space-y-3 text-sm leading-relaxed">
        <div className="min-h-[7.5rem] rounded-lg bg-bg px-3 py-2" aria-live="polite">
          {point ? <DepthReadout at={point} /> : <p className="text-text-secondary">Tap the chart, or pick a place below it, to see the depth there and what its colour means.</p>}
        </div>
        <ul className="not-lesson space-y-1" aria-label="Colour key">
          {BAND_ORDER.map((b) => (
            <li
              key={b}
              aria-current={band === b ? 'true' : undefined}
              className={`flex items-center gap-2 rounded-md px-2 py-1 ${band === b ? 'bg-teal-light font-semibold' : ''}`}
            >
              <span className="h-4 w-6 shrink-0 rounded-sm border border-navy/30" style={{ background: BAND_SWATCH[b] }} aria-hidden="true" />
              <span>{BAND_INFO[b].tint}: {b === 'land' ? 'land' : b === 'drying' ? 'dries' : BAND_INFO[b].label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Symbol explorer                                                     */
/* ------------------------------------------------------------------ */

export function SymbolExplorer() {
  const [id, setId] = useState<SymbolId>('sounding')
  const s = symbolInfo(id)
  return (
    <div className="space-y-3">
      <div role="group" aria-label="Chart symbols" className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-6">
        {SYMBOLS.map((sym) => {
          const on = sym.id === id
          return (
            <button
              key={sym.id}
              type="button"
              aria-pressed={on}
              onClick={() => setId(sym.id)}
              className={[
                'flex flex-col items-center gap-1 rounded-lg border p-1.5 text-center text-[11px] font-medium leading-tight text-text-primary transition-colors sm:text-xs',
                on ? 'border-teal bg-teal-light ring-2 ring-teal/40' : 'border-border bg-white hover:border-teal/60 hover:bg-teal-light/50',
              ].join(' ')}
            >
              <SymbolImage id={sym.id} size={44} className="rounded border border-border/70" />
              <span>{sym.name}</span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2" aria-live="polite">
        <div className="rounded-lg bg-bg p-3">
          <div className="flex items-center gap-3">
            <SymbolImage id={s.id} size={76} label={`Chart symbol: ${s.name}`} className="shrink-0 rounded-md border border-border" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-teal">{s.group}</p>
              <p className="text-base font-semibold text-text-primary">{s.name}</p>
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-primary">{s.meaning}</p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {s.onChart ? (
              <><span className="font-semibold text-text-primary">On the practice chart: </span>{s.onChart.note}</>
            ) : (
              'This one isn’t on the practice chart, but you’ll meet it on real charts.'
            )}
          </p>
        </div>
        <div className="min-w-0">
          {s.onChart ? (
            <PracticeChart view={viewAround(s.onChart.at, s.onChart.widthNm)} zoomable title={`Practice chart zoomed to: ${s.name}`}>
              {s.onChart.features
                ? s.onChart.features.map((fid) => <ChartHighlight key={fid} at={feature(fid).at} r={12} />)
                : <ChartHighlight at={s.onChart.at} r={id === 'contour' ? 14 : 10} />}
            </PracticeChart>
          ) : (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-white p-4">
              <SymbolImage id={s.id} size={128} />
              <p className="text-center text-xs text-text-secondary">Not on the practice chart</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const LAT_COLOUR = '#f5b301'
const LON_COLOUR = '#2bb3c0'

/* ------------------------------------------------------------------ */
/* Globe explorer                                                      */
/* ------------------------------------------------------------------ */

const GREENWICH = { lat: 51 + 28.7 / 60, lon: 0 }

function describe(lat: number, lon: number): string {
  if (Math.abs(lat) === 90) return `You are at the ${lat > 0 ? 'North' : 'South'} Pole. Every meridian meets here, so longitude has no meaning.`
  const la = Math.round(Math.abs(lat))
  const lo = Math.round(Math.abs(lon))
  const ns = la === 0 ? 'on the equator' : `about ${la}° ${lat > 0 ? 'north' : 'south'} of the equator`
  const ew =
    lo === 0 ? 'on the prime meridian through Greenwich'
      : lo === 180 ? 'on the 180° meridian, halfway round the world from Greenwich'
        : `about ${lo}° ${lon > 0 ? 'east' : 'west'} of the prime meridian`
  return `You are ${ns}, and ${ew}.`
}

// Charter bases from our cruising guides (positions rounded).
const BASES: Array<{ label: string; lat: number; lon: number }> = [
  { label: 'Kaštela, Croatia', lat: 43.545, lon: 16.399 },
  { label: 'Lefkas, Greece', lat: 38.826, lon: 20.722 },
  { label: 'Palma, Mallorca', lat: 39.553, lon: 2.64 },
  { label: 'Road Town, BVI', lat: 18.422, lon: -64.611 },
  { label: 'Praslin, Seychelles', lat: -4.337, lon: 55.773 },
  { label: 'Phuket, Thailand', lat: 8.068, lon: 98.446 },
]

export function GlobeExplorer() {
  const [lat, setLat] = useState(BASES[1]!.lat)
  const [lon, setLon] = useState(BASES[1]!.lon)
  const v: GlobeView = { cx: 160, cy: 160, r: 140, lat0: lat / 2, lon0: lon }
  const point = globePoint(v, lat, lon)
  const north = globePoint(v, 90, 0)
  const south = globePoint(v, -90, 0)
  const gw = globePoint(v, GREENWICH.lat, GREENWICH.lon)
  const presets: Array<{ label: string; lat: number; lon: number }> = [
    { label: '0°, 0°', lat: 0, lon: 0 },
    ...BASES,
  ]
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <svg viewBox="0 0 320 320" className="mx-auto block w-full max-w-[18rem]" role="img" aria-label={`Globe showing ${formatPosition({ lat, lon }, 0)}`}>
        <GlobeDisc v={v} />
        <GlobeGrid v={v} opacity={0.22} />
        <path d={parallelPath(v, 0)} fill="none" stroke={LAT_COLOUR} strokeWidth={3} />
        <path d={meridianPath(v, 0)} fill="none" stroke={LON_COLOUR} strokeWidth={3} />
        {Math.abs(lat) < 90 && <path d={parallelPath(v, lat)} fill="none" stroke={LAT_COLOUR} strokeWidth={1.4} strokeDasharray="4 3" />}
        <path d={meridianPath(v, lon)} fill="none" stroke={LON_COLOUR} strokeWidth={1.4} strokeDasharray="4 3" />
        {/* The angles: latitude up the meridian from the equator, longitude along the equator from Greenwich. */}
        {lat !== 0 && <path d={meridianPath(v, lon, 0, lat)} fill="none" stroke={LAT_COLOUR} strokeWidth={5} strokeLinecap="round" />}
        {lon !== 0 && Math.abs(lat) < 90 && <path d={parallelPath(v, 0, Math.min(0, lon), Math.max(0, lon))} fill="none" stroke={LON_COLOUR} strokeWidth={5} strokeLinecap="round" />}
        {gw.z > 0.05 && (
          <g>
            <circle cx={gw.x} cy={gw.y} r={3.5} fill="#fff" />
            <text x={gw.x + 6} y={gw.y - 5} fontSize={12} fill="#fff" stroke="#123a5a" strokeWidth={3} paintOrder="stroke">Greenwich</text>
          </g>
        )}
        {north.z > 0.05 && <text x={north.x} y={north.y - 6} fontSize={15} fontWeight={700} textAnchor="middle" fill="#fff" stroke="#123a5a" strokeWidth={3} paintOrder="stroke">N</text>}
        {south.z > 0.05 && <text x={south.x} y={south.y + 17} fontSize={15} fontWeight={700} textAnchor="middle" fill="#fff" stroke="#123a5a" strokeWidth={3} paintOrder="stroke">S</text>}
        <circle cx={point.x} cy={point.y} r={7} fill="#d9342b" stroke="#fff" strokeWidth={2.5} />
      </svg>

      <div className="space-y-3">
        <div className="rounded-xl bg-navy px-4 py-3 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Position</p>
          <p className="font-mono text-xl font-bold sm:text-2xl" aria-live="polite">
            <span className="text-[#f5b301]">{formatLat(lat)}</span> <span className="text-teal-light">{formatLon(lon)}</span>
          </p>
          <p className="mt-1 text-sm leading-snug text-white/85">{describe(lat, lon)}</p>
        </div>

        <label className="block">
          <span className="flex justify-between text-sm font-semibold">
            <span>Latitude <span className="font-normal text-text-secondary">(north–south)</span></span>
            <span className="font-mono">{formatLat(lat, 0)}</span>
          </span>
          <input
            type="range" min={-90} max={90} step={1} value={lat}
            onChange={(e) => setLat(Number(e.target.value))}
            aria-valuetext={lat === 0 ? 'On the equator' : `${Math.round(Math.abs(lat))} degrees ${lat > 0 ? 'north' : 'south'}`}
            className="mt-1 h-8 w-full cursor-pointer accent-[#b45309]"
          />
          <span className="flex justify-between text-xs text-text-secondary"><span>90°S</span><span>0° equator</span><span>90°N</span></span>
        </label>

        <label className="block">
          <span className="flex justify-between text-sm font-semibold">
            <span>Longitude <span className="font-normal text-text-secondary">(east–west)</span></span>
            <span className="font-mono">{formatLon(lon, 0)}</span>
          </span>
          <input
            type="range" min={-180} max={180} step={1} value={lon}
            onChange={(e) => setLon(Number(e.target.value))}
            aria-valuetext={lon === 0 ? 'On the prime meridian' : `${Math.round(Math.abs(lon))} degrees ${lon > 0 ? 'east' : 'west'}`}
            className="mt-1 h-8 w-full cursor-pointer accent-teal"
          />
          <span className="flex justify-between text-xs text-text-secondary"><span>180°W</span><span>0° Greenwich</span><span>180°E</span></span>
        </label>

        <div className="flex flex-wrap gap-1.5" aria-label="Jump to">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => { setLat(p.lat); setLon(p.lon) }}
              className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-teal-light"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Reading a position off the chart                                    */
/* ------------------------------------------------------------------ */

const READ_IDS = ['kerran-approach', 'no1', 'church', 'mast', 'wreck', 'anchorage']
type ReadStep = 'area' | 'lat' | 'lon'

export function ReadPosition() {
  const [id, setId] = useState(READ_IDS[0]!)
  const [step, setStep] = useState<ReadStep>('area')
  const [shown, setShown] = useState(false)
  const f = feature(id)
  const s = nearestScales(f.at)
  const view = step === 'lat' ? latScaleView(f.at) : step === 'lon' ? lonScaleView(f.at) : regionView(f.at)
  const steps: Array<{ id: ReadStep; label: string }> = [
    { id: 'area', label: 'Feature' },
    { id: 'lat', label: `Latitude scale (${s.side})` },
    { id: 'lon', label: `Longitude scale (${s.edge})` },
  ]
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a feature">
        {READ_IDS.map((x) => (
          <button
            key={x}
            type="button"
            aria-pressed={x === id}
            onClick={() => { setId(x); setStep('area'); setShown(false) }}
            className={`rounded-lg border px-2.5 py-1.5 text-sm ${x === id ? 'border-teal bg-teal text-white' : 'border-border hover:bg-teal-light'}`}
          >
            {feature(x).name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Zoom to">
        {steps.map((st, i) => (
          <button
            key={st.id}
            type="button"
            aria-pressed={st.id === step}
            onClick={() => setStep(st.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${st.id === step ? 'border-navy bg-navy text-white' : 'border-border bg-white hover:bg-teal-light'}`}
          >
            {i + 1}. {st.label}
          </button>
        ))}
      </div>
      <PracticeChart mode="readout" zoomable view={view} highlight={step === 'area' ? [id] : undefined} title={`Practice chart: reading the position of the ${f.name}`}>
        <ChartLine from={f.at} to={{ lat: f.at.lat, lon: s.sideLon }} colour={CHART_COLOURS.plotAlt} width={step === 'area' ? 1.6 : 1} dash="6 4" />
        <ChartLine from={f.at} to={{ lat: s.edgeLat, lon: f.at.lon }} colour={CHART_COLOURS.plot} width={step === 'area' ? 1.6 : 1} dash="6 4" />
      </PracticeChart>
      <div className="rounded-lg bg-bg px-3 py-2 text-sm leading-relaxed" aria-live="polite">
        {!shown ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-secondary">Follow the dashed lines to the scales and write the position down, then check.</span>
            <button type="button" onClick={() => setShown(true)} className="ml-auto rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90">
              Show the answer
            </button>
          </div>
        ) : (
          <>
            <p className="font-mono font-bold text-text-primary">{f.name}: {formatPosition(f.at)}</p>
            <p className="text-text-secondary">
              <strong className="text-text-primary">Latitude:</strong> the line meets the {s.side} scale {latReading(f.at)} → {formatLat(f.at.lat)}.{' '}
              <strong className="text-text-primary">Longitude:</strong> it meets the {s.edge} scale {lonReading(f.at)} → {formatLon(f.at.lon)}.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Plot this position                                                  */
/* ------------------------------------------------------------------ */

const PLOT_TOLERANCE = 0.3

function plotAdvice(got: LatLon, want: LatLon): string {
  const dLat = (got.lat - want.lat) * 60
  const dLon = (got.lon - want.lon) * 60
  const parts: string[] = []
  if (Math.abs(dLat) > 0.15) parts.push(`your latitude is ${Math.abs(dLat).toFixed(1)}' too far ${dLat > 0 ? 'north' : 'south'}`)
  if (Math.abs(dLon) > 0.15) parts.push(`your longitude is ${Math.abs(dLon).toFixed(1)}' too far ${dLon > 0 ? 'east' : 'west'}`)
  return parts.length ? `Not quite: ${parts.join(', and ')}.` : 'Not quite.'
}

export function PlotPractice() {
  const [index, setIndex] = useState(0)
  const [plotted, setPlotted] = useState<LatLon | null>(null)
  const [status, setStatus] = useState<'idle' | 'wrong' | 'right' | 'shown'>('idle')
  const target = PLOT_TARGETS[index]!
  const s = nearestScales(target)
  const finished = status === 'right' || status === 'shown'

  function next() {
    setIndex((i) => (i + 1) % PLOT_TARGETS.length)
    setPlotted(null)
    setStatus('idle')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-text-secondary">Position {index + 1} of {PLOT_TARGETS.length}: plot</span>
        <span className="font-mono text-lg font-bold text-text-primary sm:text-xl">{formatPosition(target)}</span>
      </div>
      <PracticeChart
        key={index}
        mode={finished ? 'view' : 'pick'}
        zoomable
        marker={plotted}
        onPick={(p) => { setPlotted(p); if (status === 'wrong') setStatus('idle') }}
        title="Practice chart: tap to plot the position"
      >
        {finished && (
          <>
            <ChartLine from={{ lat: target.lat, lon: s.sideLon }} to={target} colour={CHART_COLOURS.plotAlt} width={1.6} />
            <ChartLine from={{ lat: s.edgeLat, lon: target.lon }} to={target} colour={CHART_COLOURS.plot} width={1.6} />
            <ChartPoint at={target} colour="#15803d" label="Answer" />
          </>
        )}
      </PracticeChart>
      <div className="flex flex-wrap items-center gap-2">
        {!finished && (
          <button
            type="button"
            disabled={!plotted}
            onClick={() => setStatus(plotted && checkPlot(plotted, target, PLOT_TOLERANCE) ? 'right' : 'wrong')}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check my plot
          </button>
        )}
        {!finished && (
          <button type="button" onClick={() => setStatus('shown')} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg">
            Show me
          </button>
        )}
        <button type="button" onClick={next} className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-teal-light">
          Next position →
        </button>
      </div>
      <p className="min-h-[1.5rem] text-sm leading-relaxed" role="status">
        {status === 'right' && plotted && (
          <span className="font-semibold text-success-text">Well plotted: {rhumbDistance(plotted, target).toFixed(2)} M from the exact position.</span>
        )}
        {status === 'wrong' && plotted && <span className="font-medium text-danger">{plotAdvice(plotted, target)} Have another go.</span>}
        {status === 'shown' && (
          <span className="text-text-secondary">
            Find {formatLat(target.lat)} on the {s.side} scale and {formatLon(target.lon)} on the {s.edge} scale: the lines from each cross at the position.
          </span>
        )}
        {status === 'idle' && <span className="text-text-secondary">Tap the chart to plot. Zoom in on the borders to count the tenths.</span>}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Reading a bay before you arrive                                     */
/* ------------------------------------------------------------------ */

const SHELTER_TEXT: Record<Shelter, { label: string; tone: string }> = {
  sheltered: { label: 'Sheltered', tone: 'text-success-text' },
  partly: { label: 'Partly sheltered', tone: 'text-warning-text' },
  exposed: { label: 'Exposed', tone: 'text-danger' },
}

function depthVerdict(d: number): { ok: boolean; text: string } {
  if (d < 3) return { ok: false, text: 'Too shallow to swing safely at anchor.' }
  if (d <= 12) return { ok: true, text: 'A comfortable depth for anchoring.' }
  return { ok: false, text: 'Deep: you would need a lot of chain.' }
}

function verdict(s: BayStop, shelter: Shelter): string {
  const holding = SEABED[s.seabed].holding
  const dangers = dangersNear(s.at)
  if (shelter === 'exposed') return 'Move on: the wind and the waves come straight in here.'
  if (holding === 'poor') return `Not for the night at anchor: ${SEABED[s.seabed].name.toLowerCase()} holds badly. A lunch stop in calm weather at most.`
  if (!depthVerdict(s.depth).ok) return 'Possible, but check the depth carefully before you commit.'
  if (shelter === 'partly') return 'Usable, but expect some roll. Look for somewhere better tucked in if the wind is forecast to rise.'
  return dangers.length
    ? `A good choice. Plan the approach to keep well clear of ${dangers[0]!.f.name}.`
    : 'A good choice: sheltered, a sensible depth and sand to hold the anchor.'
}

/** Wind arrow drawn upwind of a stop, pointing the way the wind blows. */
function WindArrow({ at, from }: { at: LatLon; from: number }) {
  const start = rhumbDestination(at, from, 1.6)
  const end = rhumbDestination(at, from, 0.55)
  return <ChartLine from={start} to={end} colour={CHART_COLOURS.plotAlt} width={3.5} arrow />
}

export function BayReader() {
  const [wind, setWind] = useState<Point>('S')
  const [stopId, setStopId] = useState(BAY_STOPS[0]!.id)
  const s = BAY_STOPS.find((x) => x.id === stopId) ?? BAY_STOPS[0]!
  const from = pointBearing(wind)
  const shelter = shelterAt(s, from)
  const dangers = dangersNear(s.at)
  const depth = depthVerdict(s.depth)
  const bed = SEABED[s.seabed]
  const btn = (on: boolean) => `rounded-lg border px-2.5 py-1.5 text-sm ${on ? 'border-teal bg-teal font-semibold text-white' : 'border-border bg-white hover:bg-teal-light'}`
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Wind blowing from">
        <span className="mr-1 text-sm font-semibold">Wind from</span>
        {POINTS.map((p) => (
          <button key={p} type="button" role="radio" aria-checked={p === wind} onClick={() => setWind(p)} className={`${btn(p === wind)} min-w-11 px-2 font-mono`}>
            {p}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Where to stop">
        {BAY_STOPS.map((b) => (
          <button key={b.id} type="button" role="radio" aria-checked={b.id === stopId} onClick={() => setStopId(b.id)} className={btn(b.id === stopId)}>
            {b.name}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          <PracticeChart view={viewAround(s.at, 5, 4 / 3)} zoomable title={`Practice chart zoomed to ${s.name}`}>
            {BAY_STOPS.map((b) => (
              <ChartText key={b.id} at={b.at} dx={-9} dy={-8} size={14} colour={CHART_COLOURS.plot} anchor="end" bold>{b.seabed}</ChartText>
            ))}
            {dangers.map((d) => <ChartHighlight key={d.f.id} at={d.f.at} r={14} colour={CHART_COLOURS.plotAlt} />)}
            <ChartPoint at={s.at} colour={CHART_COLOURS.plot} r={5} />
            <WindArrow at={s.at} from={from} />
          </PracticeChart>
          <p className="mt-1 text-xs text-text-secondary">
            The practice chart prints no seabed, so the letters beside each stop are added for this exercise. The orange arrow is the wind.
          </p>
        </div>
        <div className="space-y-2 text-sm leading-relaxed" aria-live="polite">
          <div className="rounded-lg bg-bg px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Shelter</p>
            <p className={`font-semibold ${SHELTER_TEXT[shelter].tone}`}>{SHELTER_TEXT[shelter].label}</p>
            <p className="text-text-secondary">
              {shelter === 'sheltered'
                ? `The island lies between you and a ${POINT_NAMES[wind]} wind.`
                : shelter === 'partly'
                  ? `A ${POINT_NAMES[wind]} wind blows along this shore, so some swell will wrap round.`
                  : `This shore faces straight into a ${POINT_NAMES[wind]} wind.`}
            </p>
          </div>
          <div className="rounded-lg bg-bg px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Depth</p>
            <p className={`font-semibold ${depth.ok ? 'text-success-text' : 'text-warning-text'}`}>About {s.depth.toFixed(1)} m (<FigHtml depth={s.depth} />)</p>
            <p className="text-text-secondary">{depth.text}</p>
          </div>
          <div className="rounded-lg bg-bg px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Seabed</p>
            <p className={`font-semibold ${bed.holding === 'good' ? 'text-success-text' : 'text-warning-text'}`}>{s.seabed}: {bed.name}, {bed.holding} holding</p>
            <p className="text-text-secondary">{bed.note}</p>
          </div>
          <div className="rounded-lg bg-bg px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Dangers in the approach</p>
            {dangers.length ? (
              <ul className="not-lesson text-text-secondary">
                {dangers.map((d) => <li key={d.f.id}>{d.f.name}, {d.miles.toFixed(1)} miles away</li>)}
              </ul>
            ) : (
              <p className="text-text-secondary">No charted rocks or wrecks within a mile and a half.</p>
            )}
          </div>
          <p className="rounded-lg border border-teal-200 bg-white px-3 py-2 font-semibold text-text-primary">{verdict(s, shelter)}</p>
        </div>
      </div>
    </div>
  )
}
