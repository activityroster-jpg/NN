"use client";

// Drawings shared by this lesson's scenes, widgets and figures: what you see
// through a hand-bearing compass, landmarks seen from seaward, a steering
// compass from above, and labels for chart scenes. Ported from the Boaty
// Jobs position-lines, magnetic-variation and transits lessons.

import { useId, type ReactNode } from "react";
import type { LatLon } from "@/lib/courses/geo";
import { project, r2 } from "@/lib/courses/navigation/chart-geometry";
import { ART, Yacht } from "../../scene-art";
import type { LandmarkArt } from "./lines";

const DEG = Math.PI / 180;
export const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
export const TRUE_C = ART.tealBright;
export const MAG_C = "#fb923c";

/** A point `len` px from (x, y) on a stage bearing (0 = up). */
export function toward(x: number, y: number, deg: number, len: number) {
  return { x: r2(x + Math.sin(deg * DEG) * len), y: r2(y - Math.cos(deg * DEG) * len) };
}

/** A transparent 1600×900 layer over a chart scene, for big readable labels. */
export function Overlay({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <g fontFamily={FONT}>{children}</g>
    </svg>
  );
}

/** A label on a dark pill; y is the text baseline. */
export function Tag({ x, y, text, size = 48, fill = "#fff", bg = "rgba(11,25,41,0.9)", anchor = "start", opacity = 1 }: {
  x: number; y: number; text: string; size?: number; fill?: string; bg?: string; anchor?: "start" | "middle" | "end"; opacity?: number;
}) {
  const w = text.length * size * 0.56 + size * 0.9;
  const h = size * 1.5;
  const x0 = Math.max(12, Math.min(1588 - w, anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2));
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - size * 1.08} width={w} height={h} rx={16} fill={bg} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fontSize={size} fontWeight={700} fill={fill}>{text}</text>
    </g>
  );
}

export function Arrow({ x1, y1, x2, y2, colour, width = 8, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; colour: string; width?: number; opacity?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hl = 18 + width * 2;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2 - Math.cos(a) * hl * 0.6} y2={y2 - Math.sin(a) * hl * 0.6} stroke={colour} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${x2 - hl * Math.cos(a - 0.45)},${y2 - hl * Math.sin(a - 0.45)} ${x2 - hl * Math.cos(a + 0.45)},${y2 - hl * Math.sin(a + 0.45)}`} fill={colour} />
    </g>
  );
}

/** A small yacht drawn on the chart (chart pixels). */
export function ChartYacht({ at, heading = 0, scale = 0.26 }: { at: LatLon; heading?: number; scale?: number }) {
  const p = project(at);
  return <Yacht x={p.x} y={p.y} heading={heading} scale={scale} />;
}

/** A landmark as seen from seaward, standing on the horizon at (x, y). */
export function LandmarkArtwork({ art, x, y, s = 1 }: { art: LandmarkArt; x: number; y: number; s?: number }) {
  const ink = "#3d4a57";
  switch (art) {
    case "spire":
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x={-46} y={-26} width={44} height={26} fill="#cfc6b4" stroke={ink} strokeWidth={1.2} />
          <polygon points="-50,-26 -24,-40 2,-26" fill="#9c8f7a" stroke={ink} strokeWidth={1.2} />
          <rect x={-2} y={-44} width={18} height={44} fill="#d8cfbd" stroke={ink} strokeWidth={1.2} />
          <polygon points="-3,-44 7,-104 17,-44" fill="#9c8f7a" stroke={ink} strokeWidth={1.2} />
          <line x1={7} x2={7} y1={-104} y2={-114} stroke={ink} strokeWidth={1.5} />
        </g>
      );
    case "mast":
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`} stroke={ink} strokeWidth={1.4} fill="none">
          <line x1={-12} y1={0} x2={0} y2={-112} />
          <line x1={12} y1={0} x2={0} y2={-112} />
          {[-20, -40, -60, -80, -96].map((yy, i) => {
            const half = r2(12 * (1 + yy / 112));
            return <line key={i} x1={-half} x2={half} y1={yy} y2={yy} />;
          })}
          <circle cx={0} cy={-114} r={3.5} fill="#d9342b" stroke="none" />
          <circle cx={0} cy={-62} r={2.5} fill="#d9342b" stroke="none" />
        </g>
      );
    case "tower":
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x={-15} y={-70} width={30} height={70} fill="#b9ad97" stroke={ink} strokeWidth={1.2} />
          <path d="M-18 -70 h6 v-8 h6 v8 h6 v-8 h6 v8 h6 v-8 h6 v8" fill="#b9ad97" stroke={ink} strokeWidth={1.2} />
          <rect x={-4} y={-52} width={8} height={12} fill={ink} />
        </g>
      );
    case "lighthouse":
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <polygon points="-13,0 13,0 8,-72 -8,-72" fill="#fff" stroke={ink} strokeWidth={1.2} />
          <rect x={-10} y={-84} width={20} height={12} fill="#f5c400" stroke={ink} strokeWidth={1.2} />
          <polygon points="-12,-84 12,-84 0,-96" fill="#4b5563" />
          <rect x={-24} y={-2} width={48} height={6} fill="#6b7280" />
        </g>
      );
  }
}

const CARD_PX = 11;

/** The compass card as seen through the sight: a strip of degrees with the lubber line in the middle. */
function CardStrip({ value, clipId, y = 172, h = 62 }: { value: number; clipId: string; y?: number; h?: number }) {
  const els: ReactNode[] = [];
  const lo = Math.floor(value - 20);
  const hi = Math.ceil(value + 20);
  for (let k = lo; k <= hi; k++) {
    const x = r2(200 + (k - value) * CARD_PX);
    const deg = ((k % 360) + 360) % 360;
    const major = deg % 10 === 0;
    const mid = deg % 5 === 0;
    els.push(<line key={`t${k}`} x1={x} x2={x} y1={y} y2={y + (major ? 18 : mid ? 12 : 7)} stroke="#fff" strokeWidth={major ? 2 : 1} />);
    if (major) {
      const label = deg % 90 === 0 ? ["N", "E", "S", "W"][deg / 90] : String(deg).padStart(3, "0");
      els.push(
        <text key={`l${k}`} x={x} y={y + 42} fontSize={18} fontWeight={700} textAnchor="middle" fill={deg === 0 ? "#ff6b5e" : "#fff"}>
          {label}
        </text>,
      );
    }
  }
  return (
    <g>
      <clipPath id={clipId}><rect x={12} y={y - 6} width={376} height={h} rx={8} /></clipPath>
      <rect x={12} y={y - 6} width={376} height={h} rx={8} fill="#0f1c2a" />
      <g clipPath={`url(#${clipId})`}>{els}</g>
    </g>
  );
}

/**
 * What you see through a hand-bearing compass, in a 400 × 250 frame: the
 * object on the lubber line, the card below it. Pure SVG, for the widget
 * and the video.
 */
export function SightGraphic({ art, value, dim = false }: { art: LandmarkArt | null; value: number | null; dim?: boolean }) {
  const clipId = `bc-card${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <g fontFamily={FONT}>
      <rect width={400} height={250} rx={10} fill="#1b2d40" />
      <rect x={12} y={12} width={376} height={142} rx={8} fill="#cfe6f3" />
      <path d="M12 118 Q 80 88 150 100 T 300 94 Q 350 92 388 108 V 128 H 12 Z" fill="#a9b98d" />
      <rect x={12} y={128} width={376} height={26} fill="#3f6f8f" />
      <path d="M12 136 h376 M12 146 h376" stroke="#5f8eae" strokeWidth={1} />
      {art && <LandmarkArtwork art={art} x={200} y={122} s={0.82} />}
      <line x1={200} x2={200} y1={20} y2={150} stroke="#f6a313" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.9} />
      {value === null ? (
        <g>
          <rect x={12} y={166} width={376} height={62} rx={8} fill="#0f1c2a" />
          <text x={200} y={204} textAnchor="middle" fontSize={17} fill="#9fb3c8">Card not yet read</text>
        </g>
      ) : (
        <g opacity={dim ? 0.55 : 1}>
          <CardStrip value={value} clipId={clipId} />
        </g>
      )}
      {value !== null && <polygon points="200,170 193,160 207,160" fill="#f6a313" />}
      {value !== null && <line x1={200} x2={200} y1={166} y2={228} stroke="#f6a313" strokeWidth={3} />}
    </g>
  );
}

export function CompassSight({ art, value, label, dim = false }: { art: LandmarkArt | null; value: number | null; label: string; dim?: boolean }) {
  return (
    <svg viewBox="0 0 400 250" className="block h-auto w-full select-none rounded-lg" role="img" aria-label={label}>
      <SightGraphic art={art} value={value} dim={dim} />
    </svg>
  );
}

/** Top view of a steering compass: the card stays fixed, the bowl and lubber line turn with the boat. */
export function SteeringCompass({ x, y, r, heading, lubberGlow = false }: { x: number; y: number; r: number; heading: number; lubberGlow?: boolean }) {
  const card: ReactNode[] = [];
  for (let d = 0; d < 360; d += 10) {
    const a = toward(x, y, d, r - 6);
    const b = toward(x, y, d, r - (d % 30 === 0 ? 30 : 18));
    card.push(<line key={`t${d}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e5e7eb" strokeWidth={d % 30 === 0 ? 4 : 2} />);
    if (d % 90 === 0) {
      const p = toward(x, y, d, r - 62);
      card.push(
        <text key={`l${d}`} x={p.x} y={p.y + 16} textAnchor="middle" fontSize={46} fontWeight={800} fill={d === 0 ? ART.port : "#e5e7eb"} transform={`rotate(${d} ${p.x} ${p.y})`}>
          {["N", "E", "S", "W"][d / 90]}
        </text>,
      );
    }
  }
  const l1 = toward(x, y, heading, r - 40);
  const l2 = toward(x, y, heading, r + 26);
  return (
    <g>
      <circle cx={x} cy={y} r={r + 30} fill="#2a2f36" stroke="#94a3b8" strokeWidth={6} />
      <circle cx={x} cy={y} r={r} fill="#0f1c2a" />
      {card}
      <circle cx={x} cy={y} r={12} fill="#94a3b8" />
      {lubberGlow && <line x1={l1.x} y1={l1.y} x2={l2.x} y2={l2.y} stroke={ART.amber} strokeOpacity={0.35} strokeWidth={22} strokeLinecap="round" />}
      <line x1={l1.x} y1={l1.y} x2={l2.x} y2={l2.y} stroke={ART.amber} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/** A big compass rose on the stage: degrees every 10, figures every 30, the cardinal letters inside. */
export function StageRose({ x, y, r, highlight }: { x: number; y: number; r: number; highlight?: number[] }) {
  const els: ReactNode[] = [];
  for (let d = 0; d < 360; d += 5) {
    const a = toward(x, y, d, r);
    const b = toward(x, y, d, r - (d % 30 === 0 ? 30 : d % 10 === 0 ? 18 : 10));
    els.push(<line key={`t${d}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ART.muted} strokeWidth={d % 30 === 0 ? 3 : 1.5} />);
    if (d % 30 === 0) {
      const p = toward(x, y, d, r + 34);
      const on = highlight?.includes(d);
      els.push(
        <text key={`n${d}`} x={p.x} y={p.y + 12} textAnchor="middle" fontSize={on ? 40 : 30} fontWeight={on ? 800 : 600} fill={on ? ART.amber : "#fff"} fontFamily="ui-monospace, monospace">
          {String(d).padStart(3, "0")}
        </text>,
      );
    }
  }
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="rgba(255,255,255,0.04)" stroke={ART.muted} strokeWidth={3} />
      {els}
      {(["N", "E", "S", "W"] as const).map((l, i) => {
        const p = toward(x, y, i * 90, r - 70);
        return <text key={l} x={p.x} y={p.y + 18} textAnchor="middle" fontSize={52} fontWeight={800} fill={l === "N" ? ART.port : "#fff"}>{l}</text>;
      })}
    </g>
  );
}
