// Drawing for Lesson 9: the practice cove seen from above (depths, seabed,
// swimming area, boats and their swinging circles) and the side view of an
// anchor and its chain. Pure SVG, no hooks, so the notes, widgets, video
// and exercises all draw the same thing.

import type { ReactNode } from "react";
import { r2 } from "@/lib/courses/navigation/chart-geometry";
import { Yacht } from "../../scene-art";
import {
  BOAT, COVE_H, COVE_LAND, COVE_W, OTHER_BOATS, SEAGRASS, SWIM_ZONE, boatPosition, swingRadius, type P,
} from "./data";

export const COVE_COLOURS = {
  deep: "#7fb3d5",
  ten: "#9cc7e3",
  five: "#bcdcef",
  two: "#dcedf7",
  land: "#c8c19a",
  landEdge: "#8f8763",
  beach: "#f3e3b5",
  rock: "rgba(110,95,80,0.35)",
  seagrass: "#3f7d52",
  swim: "#e0a800",
  ink: "#1f3445",
  you: "#c2410c",
  others: "#475569",
};

/** Shore distance (metres) for a depth, from the cove's depth model. */
const shoreFor = (depth: number) => -110 * Math.log(1 - depth / 14);

const path = (pts: P[], close = false) => pts.map((p, i) => `${i ? "L" : "M"}${r2(p.x)} ${r2(p.y)}`).join(" ") + (close ? " Z" : "");

// The shoreline without the drawing's top edge, for the depth bands.
const SHORE = COVE_LAND.slice(2);
const ROCK_EAST: P[] = [...COVE_LAND.slice(2, 8), { x: 290, y: 58.5 }];
const ROCK_WEST: P[] = COVE_LAND.slice(12);
const BEACH_LINE: P[] = [{ x: 290, y: 58.5 }, ...COVE_LAND.slice(8, 13)];

/** An arrow from `a` to `b` with a filled head. */
export function Arrow({ a, b, colour = COVE_COLOURS.ink, width = 3, head = 12, opacity = 1 }: { a: P; b: P; colour?: string; width?: number; head?: number; opacity?: number }) {
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

/** Wind arrow centred on `at`, blowing from `from` (degrees true; x east, y south). */
export function WindArrow({ at, from, length = 60, colour = COVE_COLOURS.ink, width = 4, head = 14 }: { at: P; from: number; length?: number; colour?: string; width?: number; head?: number }) {
  const ux = Math.sin((from * Math.PI) / 180);
  const uy = -Math.cos((from * Math.PI) / 180);
  return <Arrow a={{ x: at.x + ux * length * 0.5, y: at.y + uy * length * 0.5 }} b={{ x: at.x - ux * length * 0.5, y: at.y - uy * length * 0.5 }} colour={colour} width={width} head={head} />;
}

/** A small anchor symbol. */
export function AnchorMark({ at, size = 8, colour = COVE_COLOURS.ink }: { at: P; size?: number; colour?: string }) {
  const s = size;
  return (
    <g transform={`translate(${r2(at.x)} ${r2(at.y)})`} stroke={colour} strokeWidth={s * 0.22} fill="none" strokeLinecap="round">
      <circle cx={0} cy={-s * 0.75} r={s * 0.22} />
      <line x1={0} y1={-s * 0.53} x2={0} y2={s * 0.8} />
      <line x1={-s * 0.4} y1={-s * 0.2} x2={s * 0.4} y2={-s * 0.2} />
      <path d={`M${-s * 0.75} ${s * 0.25} Q ${-s * 0.6} ${s * 0.85} 0 ${s * 0.8} Q ${s * 0.6} ${s * 0.85} ${s * 0.75} ${s * 0.25}`} />
    </g>
  );
}

/** A boat at anchor: the chain, the boat lying downwind, and (optionally) its swinging circle. */
export function AnchoredBoat({ anchor, chain, windFrom, colour, circle = true, label, opacity = 1 }: {
  anchor: P; chain: number; windFrom: number; colour: string; circle?: boolean; label?: string; opacity?: number
}) {
  const at = boatPosition(anchor, chain, windFrom);
  const a = (windFrom * Math.PI) / 180;
  const bow = { x: at.x + Math.sin(a) * BOAT.length * 0.5, y: at.y - Math.cos(a) * BOAT.length * 0.5 };
  return (
    <g opacity={opacity}>
      {circle && <circle cx={r2(anchor.x)} cy={r2(anchor.y)} r={swingRadius(chain)} fill={colour} fillOpacity={0.08} stroke={colour} strokeWidth={1.4} strokeDasharray="5 4" />}
      <line x1={r2(anchor.x)} y1={r2(anchor.y)} x2={r2(bow.x)} y2={r2(bow.y)} stroke={colour} strokeWidth={1.2} strokeDasharray="2 2" />
      <AnchorMark at={anchor} size={6} colour={colour} />
      <Yacht x={r2(at.x)} y={r2(at.y)} heading={windFrom} scale={BOAT.length / 118} />
      {label && (
        <text x={r2(at.x)} y={r2(at.y + 3)} fontSize={7} fontWeight={800} textAnchor="middle" fill={colour}>{label}</text>
      )}
    </g>
  );
}

/**
 * The practice cove, in metres (viewBox 0 0 400 300). Children draw on top,
 * in the same units.
 */
export function CoveMap({ windFrom = 0, others = true, otherCircles = true, highlight, labels = true, children }: {
  windFrom?: number
  others?: boolean
  otherCircles?: boolean
  /** Emphasise one part of the seabed. */
  highlight?: "sand" | "seagrass" | "rock" | "swim" | null
  labels?: boolean
  children?: ReactNode
}) {
  const C = COVE_COLOURS;
  const dim = (k: string) => (highlight && highlight !== k ? 0.35 : 1);
  const band = (depth: number, colour: string) => (
    <path d={path(SHORE)} fill="none" stroke={colour} strokeWidth={r2(shoreFor(depth) * 2)} strokeLinejoin="round" strokeLinecap="round" />
  );
  return (
    // A nested svg clips the depth bands (strokes along the shore) to the cove.
    <svg x={0} y={0} width={COVE_W} height={COVE_H} viewBox={`0 0 ${COVE_W} ${COVE_H}`} overflow="hidden" fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">
      <rect width={COVE_W} height={COVE_H} fill={C.deep} />
      {band(10, C.ten)}
      {band(5, C.five)}
      {band(2, C.two)}
      {highlight === "sand" && <rect width={COVE_W} height={COVE_H} fill="#fff6d8" opacity={0.35} />}
      <g opacity={dim("rock")}>
        <path d={path(ROCK_EAST)} fill="none" stroke={C.rock} strokeWidth={44} strokeLinejoin="round" />
        <path d={path(ROCK_WEST)} fill="none" stroke={C.rock} strokeWidth={44} strokeLinejoin="round" />
      </g>
      <g opacity={dim("seagrass")}>
        {SEAGRASS.map((e, i) => (
          <g key={i}>
            <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={C.seagrass} fillOpacity={0.55} />
            {Array.from({ length: 9 }, (_, k) => {
              const ang = (k / 9) * Math.PI * 2;
              const x = e.cx + Math.cos(ang) * e.rx * 0.55;
              const y = e.cy + Math.sin(ang) * e.ry * 0.55;
              return <path key={k} d={`M${r2(x)} ${r2(y + 3)} q -1.5 -4 0 -7 M${r2(x + 3)} ${r2(y + 3)} q 1.5 -4 0 -6`} stroke="#1f5133" strokeWidth={0.9} fill="none" />;
            })}
          </g>
        ))}
      </g>
      <g opacity={dim("swim")}>
        <path d={path(SWIM_ZONE.slice(5).concat(SWIM_ZONE.slice(0, 1)))} fill="none" stroke={C.swim} strokeWidth={1.4} strokeDasharray="1 5" strokeLinecap="round" />
        {[{ x: 288, y: 62 }, { x: 288, y: 80 }, { x: 246, y: 80 }, { x: 203, y: 80 }, { x: 160, y: 80 }, { x: 118, y: 80 }, { x: 118, y: 62 }].map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={2.4} fill={C.swim} stroke="#7a5c00" strokeWidth={0.6} />
        ))}
      </g>
      <path d={path(COVE_LAND, true)} fill={C.land} stroke={C.landEdge} strokeWidth={1.2} strokeLinejoin="round" />
      <path d={path(BEACH_LINE)} fill="none" stroke={C.beach} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      {labels && (
        <g fill={C.ink} fontSize={9} fontWeight={600} textAnchor="middle">
          <text x={200} y={30}>Beach</text>
          <text x={203} y={70} fill="#7a5c00">Swimming area</text>
          <text x={150} y={153} fill="#fff" opacity={dim("seagrass")}>Seagrass</text>
          <text x={272} y={195} fill="#fff" opacity={dim("seagrass")}>Seagrass</text>
          <text x={52} y={120} transform="rotate(-72 52 120)" opacity={dim("rock")}>Rock</text>
          <text x={350} y={112} transform="rotate(64 350 112)" opacity={dim("rock")}>Rock</text>
          <text x={228} y={110} fontSize={8} fontWeight={500} fill="#33617f">5 m</text>
          <text x={175} y={205} fontSize={8} fontWeight={500} fill="#33617f">10 m</text>
          <text x={150} y={290} fontSize={8} fontWeight={500} fill="#33617f">12 m</text>
        </g>
      )}
      {others && OTHER_BOATS.map((b) => (
        <AnchoredBoat key={b.id} anchor={b.anchor} chain={b.chain} windFrom={windFrom} colour={COVE_COLOURS.others} circle={otherCircles} />
      ))}
      {others && otherCircles && OTHER_BOATS.map((b) => (
        <text key={b.id} x={b.anchor.x + 8} y={b.anchor.y - 6} fontSize={9} fontWeight={800} fill={COVE_COLOURS.others}>{b.id}</text>
      ))}
      {children}
      {/* North arrow and scale bar */}
      <g transform="translate(378 270)" fill={C.ink}>
        <Arrow a={{ x: 0, y: 14 }} b={{ x: 0, y: -12 }} width={1.6} head={7} />
        <text x={0} y={26} fontSize={9} fontWeight={700} textAnchor="middle">N</text>
      </g>
      <g transform="translate(12 290)">
        <rect x={0} y={-4} width={50} height={4} fill={C.ink} />
        <rect x={0} y={-4} width={25} height={4} fill="#fff" stroke={C.ink} strokeWidth={0.6} />
        <text x={56} y={0} fontSize={8.5} fontWeight={600} fill={C.ink}>50 m</text>
      </g>
    </svg>
  );
}

/**
 * Side view of an anchored boat: water, seabed, bow roller, chain and
 * anchor, scaled to fit a box `w` × `h` at (x, y). Depth and chain in metres.
 */
export function ScopeSide({ x = 0, y = 0, w, h, depth, bow, chain, colour = "#c2410c", dark = false, labels = true, tide = 0 }: {
  x?: number; y?: number; w: number; h: number; depth: number; bow: number; chain: number; colour?: string; dark?: boolean; labels?: boolean; tide?: number
}) {
  const vertical = depth + bow + tide;
  const k = Math.min((w - 170) / Math.max(chain + 4, 20), (h - 50) / (vertical + 3));
  const surface = 30 + (bow + tide) * k;
  const bed = surface + depth * k;
  const bowX = 130;
  const bowY = surface - bow * k;
  // Most of the chain hangs in a curve, the rest lies along the seabed.
  const span = Math.sqrt(Math.max(chain * chain - vertical * vertical, 0));
  const anchorX = bowX + Math.max(span, 4) * k;
  const touch = bowX + (anchorX - bowX) * 0.55;
  const ink = dark ? "#e2e8f0" : COVE_COLOURS.ink;
  return (
    <g transform={`translate(${x} ${y})`} fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">
      <rect x={0} y={r2(surface)} width={w} height={r2(bed - surface)} fill={dark ? "#1f5f8b" : "#cfe6f5"} />
      {tide > 0 && <rect x={0} y={r2(surface)} width={w} height={r2(tide * k)} fill={dark ? "#2a77aa" : "#b4d7ee"} />}
      <path d={`M0 ${r2(bed)} Q ${w * 0.3} ${r2(bed + 6)} ${w * 0.6} ${r2(bed)} T ${w} ${r2(bed)} V ${h} H 0 Z`} fill={dark ? "#c9b27a" : "#e8d7a8"} />
      {/* Hull (side view, bow to the right) and bow roller */}
      <line x1={bowX - 70} y1={r2(bowY - 4)} x2={bowX - 70} y2={4} stroke="#5b5348" strokeWidth={3} />
      <path d={`M${bowX} ${r2(bowY)} L ${bowX - 120} ${r2(bowY - 4)} L ${bowX - 124} ${r2(surface + 6)} Q ${bowX - 60} ${r2(surface + 22)} ${bowX - 16} ${r2(surface + 4)} Z`} fill={dark ? "#f4f1ea" : "#fff"} stroke="#5b5348" strokeWidth={2} />
      <circle cx={bowX} cy={r2(bowY)} r={4} fill="#5b5348" />
      {/* Chain */}
      <path d={`M${bowX} ${r2(bowY)} Q ${r2(touch * 0.9 + bowX * 0.1)} ${r2(bed)} ${r2(touch)} ${r2(bed - 1)} L ${r2(anchorX)} ${r2(bed - 1)}`} fill="none" stroke={colour} strokeWidth={4} strokeLinecap="round" />
      <g transform={`translate(${r2(anchorX)} ${r2(bed - 2)})`}>
        <path d="M0 0 L 16 -2 L 22 -12 M16 -2 L 20 6" stroke={colour} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      {labels && (
        <g fill={ink} fontSize={22} fontWeight={600}>
          <line x1={w - 26} y1={r2(bowY)} x2={w - 26} y2={r2(bed)} stroke={ink} strokeWidth={1.5} />
          <line x1={w - 34} y1={r2(bowY)} x2={w - 18} y2={r2(bowY)} stroke={ink} strokeWidth={1.5} />
          <line x1={w - 34} y1={r2(bed)} x2={w - 18} y2={r2(bed)} stroke={ink} strokeWidth={1.5} />
          <line x1={bowX + 6} y1={r2(bowY)} x2={w - 26} y2={r2(bowY)} stroke={ink} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
          <text x={w - 34} y={r2((bowY + bed) / 2)} textAnchor="end">{Math.round(vertical * 10) / 10} m</text>
          <text x={r2((bowX + anchorX) / 2)} y={r2(bed + 32)} textAnchor="middle" fill={colour} fontWeight={700}>{chain} m of chain</text>
        </g>
      )}
    </g>
  );
}
