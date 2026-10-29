// Drawing for Lesson 11: wind arrows, a compass rose showing where winds
// blow from, and the sea-breeze cross-section (ported from the Boaty Jobs
// lesson "Weather for navigators"). Pure SVG components with no hooks.

import { r2 } from "@/lib/courses/navigation/chart-geometry";
import { POINTS, POINT_DEG } from "./data";

export interface P {
  x: number;
  y: number;
}

export const WIND_COLOUR = "#0f766e";

/** An arrow from `a` to `b` with a filled head. */
export function MapArrow({ a, b, colour = WIND_COLOUR, width = 3, head = 12, opacity = 1 }: { a: P; b: P; colour?: string; width?: number; head?: number; opacity?: number }) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const base = { x: b.x - Math.cos(ang) * head * 0.8, y: b.y - Math.sin(ang) * head * 0.8 };
  const p1 = { x: r2(b.x - head * Math.cos(ang - 0.42)), y: r2(b.y - head * Math.sin(ang - 0.42)) };
  const p2 = { x: r2(b.x - head * Math.cos(ang + 0.42)), y: r2(b.y - head * Math.sin(ang + 0.42)) };
  return (
    <g opacity={opacity}>
      <line x1={r2(a.x)} y1={r2(a.y)} x2={r2(base.x)} y2={r2(base.y)} stroke={colour} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${r2(b.x)},${r2(b.y)} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill={colour} />
    </g>
  );
}

/** Wind arrow through a point: from upwind, pointing downwind. `from` in degrees true (x east, y south). */
export function WindArrow({ at, from, length = 70, colour = WIND_COLOUR, width = 4, head = 16, opacity = 1 }: { at: P; from: number; length?: number; colour?: string; width?: number; head?: number; opacity?: number }) {
  const ux = Math.sin((from * Math.PI) / 180);
  const uy = -Math.cos((from * Math.PI) / 180);
  const tail = { x: at.x + ux * length * 0.55, y: at.y + uy * length * 0.55 };
  const tip = { x: at.x - ux * length * 0.45, y: at.y - uy * length * 0.45 };
  return <MapArrow a={tail} b={tip} colour={colour} width={width} head={head} opacity={opacity} />;
}

/**
 * A compass rose of radius `r` with winds drawn blowing in from the rim
 * towards the centre: each arrow starts on the side the wind comes from.
 */
export function WindRose({ x, y, r, winds, ink = "#1f3445", ring = "#cbd5e1", labelSize, dark = false }: {
  x: number; y: number; r: number
  winds: Array<{ from: number; colour: string; label?: string }>
  ink?: string; ring?: string; labelSize?: number; dark?: boolean
}) {
  const ls = labelSize ?? r * 0.16;
  const pt = (deg: number, rr: number) => ({ x: r2(Math.sin((deg * Math.PI) / 180) * rr), y: r2(-Math.cos((deg * Math.PI) / 180) * rr) });
  return (
    <g transform={`translate(${x} ${y})`} fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">
      <circle r={r} fill={dark ? "rgba(255,255,255,0.06)" : "#fff"} stroke={ring} strokeWidth={r * 0.02} />
      <circle r={r * 0.06} fill={ink} />
      {POINTS.map((p) => {
        const at = pt(POINT_DEG[p], r * 1.14);
        const tick1 = pt(POINT_DEG[p], r * 0.93);
        const tick2 = pt(POINT_DEG[p], r);
        return (
          <g key={p}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke={ring} strokeWidth={r * 0.02} />
            <text x={at.x} y={at.y + ls * 0.36} fontSize={p.length === 1 ? ls * 1.15 : ls * 0.9} fontWeight={p.length === 1 ? 800 : 600} textAnchor="middle" fill={ink}>{p}</text>
          </g>
        );
      })}
      {winds.map((w, i) => {
        const tail = pt(w.from, r * 0.86);
        const tip = pt(w.from, r * 0.16);
        const lab = pt(w.from, r * 0.55);
        return (
          <g key={i}>
            <MapArrow a={tail} b={tip} colour={w.colour} width={r * 0.05} head={r * 0.16} />
            {w.label && (
              <text x={lab.x + (Math.abs(lab.x) < 2 ? r * 0.06 : 0)} y={lab.y - r * 0.06} fontSize={ls * 0.95} fontWeight={700} fill={w.colour} textAnchor={lab.x < -2 ? "end" : "start"} stroke={dark ? "#1b3a52" : "#fff"} strokeWidth={ls * 0.25} paintOrder="stroke">
                {w.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Cross-section of a coast for the sea- and land-breeze scenes (1600 × 900). */
export function BreezeSection({ night, t, title }: { night: boolean; t: number; title?: string }) {
  const sky = night ? "#0b1a2e" : "#a9d3ee";
  const ink = night ? "#fff" : "#0B1929";
  const flow = night ? -1 : 1;
  // Dashes run along the circulation: a falling offset moves them forwards along the path (sea to land at the surface by day).
  const dash = r2(-(t * 600 * flow) % 60);
  const loopColour = night ? "#cbd5e1" : "#0b5563";
  const w = night ? 6 : 10;
  return (
    <g>
      <rect width={1600} height={900} fill={sky} />
      {night
        ? [[220, 120], [400, 70], [610, 150], [860, 90], [1080, 160], [1290, 80], [1480, 140]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill="#e2e8f0" />)
        : null}
      {night ? <circle cx={1370} cy={150} r={56} fill="#e5e7eb" /> : <circle cx={1370} cy={150} r={70} fill="#fbbf24" />}
      <rect x={0} y={560} width={820} height={340} fill={night ? "#0f2f4f" : "#1f6aa0"} />
      <path d="M800 560 Q 980 520 1150 480 T 1600 430 V900 H800 Z" fill={night ? "#3a3524" : "#c9b27a"} />
      <path
        d="M260 520 L 1040 520 Q 1140 520 1140 420 L 1140 330 Q 1140 250 1040 250 L 300 250 Q 220 250 220 330 L 220 440 Q 220 520 260 520"
        fill="none" stroke={loopColour} strokeWidth={w} strokeDasharray="34 26" strokeDashoffset={dash} strokeLinejoin="round"
      />
      <MapArrow a={night ? { x: 900, y: 520 } : { x: 560, y: 520 }} b={night ? { x: 620, y: 520 } : { x: 840, y: 520 }} colour={loopColour} width={w + 4} head={44} />
      <text x={800} y={470} textAnchor="middle" fontSize={56} fontWeight={800} fill={ink}>{title ?? (night ? "Land breeze" : "Sea breeze")}</text>
      <text x={800} y={210} textAnchor="middle" fontSize={40} fontWeight={600} fill={ink}>{night ? "Land cooler: lighter, offshore" : "Land warmer: onshore"}</text>
      <text x={400} y={650} textAnchor="middle" fontSize={44} fontWeight={700} fill="#fff">Sea</text>
      <text x={1300} y={600} textAnchor="middle" fontSize={44} fontWeight={700} fill={night ? "#fff" : "#0B1929"}>Land</text>
    </g>
  );
}

/** The sea-breeze day as a small chart: knots by hour, with a marker at `hour`. */
export function BreezeCurve({ x, y, w, h, hour, points, ink = "#1f3445", line = WIND_COLOUR, grid = "#e2e8f0", fontSize = 12 }: {
  x: number; y: number; w: number; h: number; hour: number | null
  points: Array<{ hour: number; knots: number }>
  ink?: string; line?: string; grid?: string; fontSize?: number
}) {
  const h0 = points[0]!.hour;
  const h1 = points[points.length - 1]!.hour;
  const maxK = 20;
  const px = (hr: number) => r2(((hr - h0) / (h1 - h0)) * w);
  const py = (k: number) => r2(h - (k / maxK) * h);
  const d = points.map((p, i) => `${i ? "L" : "M"}${px(p.hour)} ${py(p.knots)}`).join(" ");
  return (
    <g transform={`translate(${x} ${y})`} fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">
      {[0, 5, 10, 15, 20].map((k) => (
        <g key={k}>
          <line x1={0} y1={py(k)} x2={w} y2={py(k)} stroke={grid} strokeWidth={1} />
          <text x={-8} y={py(k) + fontSize * 0.35} fontSize={fontSize} textAnchor="end" fill={ink}>{k}</text>
        </g>
      ))}
      {[6, 9, 12, 15, 18, 21].map((hr) => (
        <text key={hr} x={px(hr)} y={h + fontSize * 1.5} fontSize={fontSize} textAnchor="middle" fill={ink}>{String(hr).padStart(2, "0")}:00</text>
      ))}
      <text x={-8} y={-fontSize * 0.8} fontSize={fontSize} textAnchor="start" fill={ink} fontWeight={700}>knots</text>
      <path d={`${d} L ${px(h1)} ${h} L 0 ${h} Z`} fill={line} opacity={0.12} />
      <path d={d} fill="none" stroke={line} strokeWidth={fontSize * 0.25} strokeLinejoin="round" />
      {hour !== null && <line x1={px(hour)} y1={0} x2={px(hour)} y2={h} stroke={ink} strokeWidth={1.5} strokeDasharray="4 4" />}
    </g>
  );
}
