"use client";

import type { ReactNode } from "react";
import type { CruisingGuide, LonLat, Port } from "@/lib/cruising/types";
import { dayLead, guideScript, sentenceHash, listOf, MOOR_LABEL, moorText as moorLine, short, splitSentences, windText } from "@/lib/cruising/narration";
import GuidePlayer, { fade, phase, Stage, type Scene } from "./GuidePlayer";

// Builds the narrated video for a cruising guide from its data: a map of the
// area, the week's route drawn leg by leg, ports and supplies, winds and
// navigation notes. Same player as the BoatyJobs navigation course.

const W = 1600;
const H = 900;
const SEA = "#1b3a52";
const LAND = "#e8dcc2";
const LAND_EDGE = "#c9b48c";
const ROUTE = "#f2b49c";
const ROUTE_DONE = "rgba(242,180,156,.45)";
const BRAND = "#c75d3e";

type XY = [number, number];

function projector(g: CruisingGuide, box = { x: 0, y: 0, w: W, h: H }) {
  const [w, s, e, n] = g.map.bounds;
  const k = Math.cos((((s + n) / 2) * Math.PI) / 180);
  const scale = Math.min(box.w / ((e - w) * k), box.h / (n - s));
  const ox = box.x + (box.w - (e - w) * k * scale) / 2;
  const oy = box.y + (box.h - (n - s) * scale) / 2;
  return ([lon, lat]: LonLat): XY => [ox + (lon - w) * k * scale, oy + (n - lat) * scale];
}

function pathD(pts: XY[], close = false): string {
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (close ? " Z" : "");
}

/** The first fraction t of a polyline, plus the heading at its end. */
function partial(pts: XY[], t: number): { pts: XY[]; at: XY; angle: number } {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]));
  const total = seg.reduce((a, b) => a + b, 0) || 1;
  let left = Math.max(0, Math.min(1, t)) * total;
  const out: XY[] = [pts[0]!];
  for (let i = 0; i < seg.length; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    if (left <= seg[i]! || i === seg.length - 1) {
      const f = seg[i]! ? Math.min(1, left / seg[i]!) : 1;
      const at: XY = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      out.push(at);
      return { pts: out, at, angle };
    }
    left -= seg[i]!;
    out.push(b);
  }
  return { pts: out, at: pts[pts.length - 1]!, angle: 0 };
}

function Boat({ at, angle }: { at: XY; angle: number }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${angle})`}>
      <path d="M16 0 L-10 -8 L-6 0 L-10 8 Z" fill="#fff" stroke={BRAND} strokeWidth={2.5} />
    </g>
  );
}

function Card({ x, y, w, h, children, opacity = 1 }: { x: number; y: number; w: number; h: number; children: ReactNode; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={22} fill="#fffdf8" opacity={0.96} />
      {children}
    </g>
  );
}

export default function GuideVideo({ guide: g, recorded = false }: { guide: CruisingGuide; /** Recorded narration and intro music are available. */ recorded?: boolean }) {
  const P = projector(g);
  const legs = g.legs.map((l) => ({ ...l, xy: l.route.map(P) }));
  const total = g.legs.reduce((n, l) => n + l.nm, 0);
  const portXY = (p: Port) => P(p.at);

  const Map = ({ dim = 0, labels = 1 }: { dim?: number; labels?: number }) => (
    <>
      {g.map.land.map((l, i) => (
        <path key={i} d={pathD(l.shape.map(P), true)} fill={LAND} stroke={LAND_EDGE} strokeWidth={2} strokeLinejoin="round" />
      ))}
      {g.map.land.map((l, i) =>
        l.name && l.label ? (
          <text key={`t${i}`} x={P(l.label)[0]} y={P(l.label)[1]} textAnchor="middle" fontSize={30} fontWeight={600} fill="#8a7651" opacity={labels} letterSpacing={2}>
            {l.name.toUpperCase()}
          </text>
        ) : null,
      )}
      {dim > 0 && <rect width={W} height={H} fill={SEA} opacity={dim} />}
    </>
  );

  const PortDot = ({ p, o = 1, big = false }: { p: Port; o?: number; big?: boolean }) => {
    const [x, y] = portXY(p);
    return (
      <g opacity={o}>
        <circle cx={x} cy={y} r={big ? 11 : 8} fill={BRAND} stroke="#fff" strokeWidth={3} />
        <text x={x + 16} y={y - 12} fontSize={big ? 30 : 24} fontWeight={700} fill="#fff" stroke={SEA} strokeWidth={6} paintOrder="stroke">
          {p.name}
        </text>
      </g>
    );
  };

  const scenes: Scene[] = [];
  const script = guideScript(g);
  const part = (key: string) => script.find((x) => x.key === key)!;
  const base = g.baseMarina;
  const baseXY = P(base.at);

  const alsoXY = base.alsoMain ? P(base.alsoMain.at) : null;
  const AlsoMarker = ({ o = 1, pulse = 0 }: { o?: number; pulse?: number }) =>
    alsoXY && base.alsoMain ? (
      <g opacity={o}>
        <circle cx={alsoXY[0]} cy={alsoXY[1]} r={18 + 26 * pulse} fill="none" stroke="#fff" strokeWidth={3} opacity={1 - pulse} />
        <circle cx={alsoXY[0]} cy={alsoXY[1]} r={13} fill={BRAND} stroke="#fff" strokeWidth={4} />
        <text x={alsoXY[0] - 22} y={alsoXY[1] + 10} textAnchor="end" fontSize={30} fontWeight={800} fill="#fff" stroke={SEA} strokeWidth={7} paintOrder="stroke">
          {base.alsoMain.name}
        </text>
      </g>
    ) : null;

  const BaseMarker = ({ o = 1, pulse = 0 }: { o?: number; pulse?: number }) => (
    <g opacity={o}>
      <circle cx={baseXY[0]} cy={baseXY[1]} r={18 + 26 * pulse} fill="none" stroke="#fff" strokeWidth={3} opacity={1 - pulse} />
      <circle cx={baseXY[0]} cy={baseXY[1]} r={13} fill={BRAND} stroke="#fff" strokeWidth={4} />
      <text x={baseXY[0] + 22} y={baseXY[1] + 10} fontSize={30} fontWeight={800} fill="#fff" stroke={SEA} strokeWidth={7} paintOrder="stroke">
        {base.name}
      </text>
    </g>
  );

  // 0. Brand intro: the wordmark over the intro music.
  scenes.push({
    title: "Nautical Nomads",
    narration: "",
    seconds: 3.5,
    sound: recorded ? "/api/narration/intro" : undefined,
    render: (t, _s, sec) => {
      return (
        <Stage background="#13293b">
          {/* Slow swell lines */}
          {[0, 1, 2, 3].map((k) => (
            <path
              key={k}
              d={`M -50 ${700 + k * 45} ${Array.from({ length: 18 }, (_, i) => `Q ${i * 100} ${700 + k * 45 + (i % 2 ? -14 : 14) * Math.sin(sec * 1.2 + k)} ${i * 100 + 50} ${700 + k * 45}`).join(" ")}`}
              fill="none"
              stroke="#f2b49c"
              strokeWidth={2}
              opacity={0.12 + k * 0.05}
            />
          ))}
          <defs>
            <clipPath id="nn-intro-reveal">
              <rect x={800 - 520 * phase(t, 0.02, 0.3)} y={320} width={1040 * phase(t, 0.02, 0.3)} height={120} />
            </clipPath>
          </defs>
          <text x={800} y={400} textAnchor="middle" fontSize={64} fontWeight={300} fill="#fff" letterSpacing={22} wordSpacing={40} clipPath="url(#nn-intro-reveal)">
            NAUTICAL NOMADS
          </text>
          <line x1={800 - 420 * fade(t, 0.25, 0.45)} x2={800 + 420 * fade(t, 0.25, 0.45)} y1={450} y2={450} stroke="#f2b49c" strokeWidth={2} />
          <text x={800} y={505} textAnchor="middle" fontSize={26} fill="#f2b49c" letterSpacing={8} opacity={fade(t, 0.3, 0.45)}>
            ESSENTIAL CRUISING GUIDES
          </text>
          <text x={800} y={600} textAnchor="middle" fontSize={70} fontWeight={800} fill="#fff" opacity={fade(t, 0.4, 0.58)}>
            {g.name}
          </text>
          <text x={800} y={655} textAnchor="middle" fontSize={32} fill="#fff" opacity={fade(t, 0.5, 0.65) * 0.85}>
            {g.country}
          </text>
        </Stage>
      );
    },
  });

  // 1. Title
  scenes.push({
    title: part("title").title,
    narration: part("title").narration,
    seconds: 6,
    render: (t) => (
      <Stage background={SEA}>
        <g opacity={fade(t, 0, 0.3)}>
          <Map dim={0.55} labels={0.4} />
        </g>
        <text x={800} y={400} textAnchor="middle" fontSize={34} fontWeight={600} fill="#f2b49c" letterSpacing={6} opacity={fade(t, 0.05, 0.2)}>
          ESSENTIAL CRUISING · {g.country.toUpperCase()}
        </text>
        <text x={800} y={490} textAnchor="middle" fontSize={92} fontWeight={800} fill="#fff" opacity={fade(t, 0.1, 0.3)}>
          {g.name}
        </text>
        <text x={800} y={560} textAnchor="middle" fontSize={34} fill="#fff" opacity={fade(t, 0.3, 0.5)}>
          A week from {short(base.name)} · about {total} nautical miles
        </text>
      </Stage>
    ),
  });

  // 2. Main base marina
  scenes.push({
    title: part("base").title,
    narration: part("base").narration,
    seconds: 7,
    render: (t, _s, sec) => (
      <Stage background={SEA}>
        <Map />
        <BaseMarker o={fade(t, 0.05, 0.2)} pulse={(sec % 1.6) / 1.6} />
        <AlsoMarker o={fade(t, 0.2, 0.35)} pulse={((sec + 0.8) % 1.6) / 1.6} />
        <Card x={980} y={560} w={580} h={110 + base.others.length * 52} opacity={fade(t, 0.45, 0.6)}>
          <text x={1012} y={612} fontSize={24} fontWeight={700} fill={BRAND} letterSpacing={3}>CHARTER MARINAS</text>
          {base.others.map((o, i) => (
            <text key={o} x={1012} y={665 + i * 52} fontSize={30} fontWeight={600} fill="#2a2826" opacity={fade(t, 0.55 + i * 0.1)}>
              {o}
            </text>
          ))}
        </Card>
      </Stage>
    ),
  });

  // 3. When to go
  const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const RATE = {
    closed: { c: "#3d5a72", h: 40, label: "Boats laid up" },
    shoulder: { c: "#a7b9c7", h: 130, label: "Quieter, cooler" },
    best: { c: "#f2b49c", h: 230, label: "Best time" },
    peak: { c: BRAND, h: 200, label: "Peak: hot and busy" },
  } as const;
  scenes.push({
    title: part("when").title,
    narration: part("when").narration,
    seconds: 8,
    render: (t) => (
      <Stage background={SEA}>
        <text x={800} y={140} textAnchor="middle" fontSize={58} fontWeight={800} fill="#fff">When to go</text>
        {g.months.map((m, i) => {
          const r = RATE[m];
          const grow = phase(t, 0.02 + i * 0.03, 0.12 + i * 0.03);
          const x = 230 + i * 100;
          return (
            <g key={i}>
              <rect x={x} y={620 - r.h * grow} width={76} height={r.h * grow} rx={10} fill={r.c} />
              <text x={x + 38} y={670} textAnchor="middle" fontSize={30} fontWeight={700} fill="#fff">{MONTHS[i]}</text>
            </g>
          );
        })}
        {(Object.keys(RATE) as (keyof typeof RATE)[]).map((k, i) => (
          <g key={k} opacity={fade(t, 0.45 + i * 0.05)}>
            <rect x={230 + i * 300} y={740} width={28} height={28} rx={6} fill={RATE[k].c} />
            <text x={270 + i * 300} y={764} fontSize={26} fill="#fff">{RATE[k].label}</text>
          </g>
        ))}
      </Stage>
    ),
  });

  // 4. Weather and winds
  const winds = g.weather.winds;
  const windStarts: number[] = [];
  {
    let n = splitSentences(g.weather.summary).length;
    for (const w of winds) {
      windStarts.push(n);
      n += splitSentences(windText(w)).length;
    }
  }
  scenes.push({
    title: part("weather").title,
    narration: part("weather").narration,
    seconds: 10,
    render: (t, sentence) => {
      let active = -1;
      windStarts.forEach((st, i) => {
        if (sentence >= st) active = i;
      });
      return (
        <Stage background={SEA}>
          <Map dim={0.35} />
          {winds.map((w, i) => {
            const on = i === active;
            const cx = 280 + i * 520;
            return (
              <g key={w.name} opacity={sentence >= windStarts[i]! ? 1 : 0.25}>
                <Card x={cx - 220} y={560} w={440} h={250} opacity={on ? 1 : 0.85}>
                  <text x={cx} y={620} textAnchor="middle" fontSize={40} fontWeight={800} fill={on ? BRAND : "#2a2826"}>{w.name}</text>
                  <text x={cx} y={665} textAnchor="middle" fontSize={26} fill="#6b6258">from the {w.from}</text>
                </Card>
                <g transform={`translate(${cx} 330) rotate(${w.towards - 90})`}>
                  {[-60, 0, 60].map((dy) => (
                    <g key={dy} transform={`translate(${((t * 400 + dy * 3) % 240) - 120} ${dy})`} opacity={on ? 1 : 0.5}>
                      <path d="M-70 0 H50 M30 -18 L56 0 L30 18" fill="none" stroke="#fff" strokeWidth={on ? 9 : 6} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  ))}
                </g>
              </g>
            );
          })}
        </Stage>
      );
    },
  });

  // 5. Mooring types
  const MOOR = MOOR_LABEL;
  const moorText = g.mooring.map(moorLine);
  const moorStarts: number[] = [];
  {
    let n = 1;
    for (const m of moorText) {
      moorStarts.push(n);
      n += splitSentences(m).length;
    }
  }
  const MoorArt = ({ kind }: { kind: keyof typeof MOOR }) => {
    // Simple pictures, 200×140, boat seen from above.
    const boat = (x: number, y: number, r = 0) => (
      <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
        <path d="M0 -38 C18 -20 20 10 14 36 L-14 36 C-20 10 -18 -20 0 -38 Z" fill="#fff" stroke="#2a2826" strokeWidth={3} />
      </g>
    );
    if (kind === "marina")
      return (
        <g>
          <rect x={0} y={0} width={200} height={22} fill="#c9b48c" />
          {[50, 100, 150].map((x) => boat(x, 64, 180))}
          {[50, 100, 150].map((x) => <line key={x} x1={x} y1={100} x2={x} y2={135} stroke="#f2b49c" strokeWidth={3} strokeDasharray="6 5" />)}
        </g>
      );
    if (kind === "town quay")
      return (
        <g>
          <rect x={0} y={0} width={200} height={30} fill="#e8dcc2" />
          {[20, 55, 90, 125, 160].map((x) => <rect key={x} x={x} y={4} width={20} height={20} fill="#c9b48c" />)}
          {[60, 140].map((x) => boat(x, 72, 180))}
        </g>
      );
    if (kind === "buoy")
      return (
        <g>
          <circle cx={100} cy={30} r={14} fill="#f2b49c" stroke="#fff" strokeWidth={3} />
          <line x1={100} y1={44} x2={100} y2={64} stroke="#fff" strokeWidth={3} />
          {boat(100, 100)}
        </g>
      );
    return (
      <g>
        {boat(70, 60, 20)}
        <path d="M84 96 L150 128" stroke="#fff" strokeWidth={3} strokeDasharray="6 5" />
        <path d="M150 116 v20 M140 126 h20 M142 134 q8 8 16 0" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    );
  };
  scenes.push({
    title: part("moor").title,
    narration: part("moor").narration,
    seconds: 10,
    render: (_t, sentence) => (
      <Stage background={SEA}>
        <text x={800} y={130} textAnchor="middle" fontSize={58} fontWeight={800} fill="#fff">Where you moor</text>
        {g.mooring.map((m, i) => {
          const on = sentence >= moorStarts[i]! && (i === g.mooring.length - 1 || sentence < moorStarts[i + 1]!);
          const shown = sentence >= moorStarts[i]!;
          const x = 70 + i * 370;
          return (
            <g key={m.kind} opacity={shown ? 1 : 0.25}>
              <rect x={x} y={200} width={350} height={600} rx={24} fill={on ? "#244a66" : "#1f425c"} stroke={on ? "#f2b49c" : "none"} strokeWidth={4} />
              <g transform={`translate(${x + 75} 250)`}>
                <MoorArt kind={m.kind} />
              </g>
              <text x={x + 175} y={460} textAnchor="middle" fontSize={36} fontWeight={800} fill="#fff">{MOOR[m.kind]}</text>
              <foreignObject x={x + 25} y={490} width={300} height={290}>
                <p style={{ margin: 0, color: "rgba(255,255,255,.85)", fontSize: 24, lineHeight: 1.35, textAlign: "center", fontFamily: "inherit" }}>{m.note}</p>
              </foreignObject>
            </g>
          );
        })}
      </Stage>
    ),
  });

  // 6. Filling up: water, power and fuel
  const rows = g.ports;
  scenes.push({
    title: part("fill").title,
    narration: part("fill").narration,
    seconds: 9,
    render: (t) => {
      const rowH = 64;
      const x0 = 1050;
      const y0 = 185;
      return (
        <Stage background="#13293b">
          <defs>
            <clipPath id="nn-ports-map">
              <rect width={W} height={H} />
            </clipPath>
          </defs>
          <g transform={`translate(0 ${(H - H * 0.64) / 2}) scale(0.64)`}>
            <g clipPath="url(#nn-ports-map)">
              <rect width={W} height={H} fill={SEA} />
              <Map />
            </g>
          </g>
          {rows.map((p) => {
            const [x, y] = portXY(p);
            return (
              <g key={p.name} transform={`translate(${x * 0.64} ${y * 0.64 + (H - H * 0.64) / 2})`}>
                <circle r={8} fill={BRAND} stroke="#fff" strokeWidth={3} />
                <text x={12} y={-10} fontSize={22} fontWeight={700} fill="#fff" stroke={SEA} strokeWidth={5} paintOrder="stroke">{p.name}</text>
              </g>
            );
          })}
          <Card x={x0 - 30} y={70} w={560} h={130 + rows.length * rowH} opacity={fade(t, 0, 0.1)}>
            <text x={x0} y={130} fontSize={30} fontWeight={800} fill="#2a2826">Port</text>
            {["Water", "Power", "Fuel"].map((h, k) => (
              <text key={h} x={x0 + 300 + k * 85} y={130} textAnchor="middle" fontSize={22} fontWeight={700} fill="#6b6258">{h}</text>
            ))}
            {rows.map((p, r) => {
              const o = fade(t, 0.05 + (r / rows.length) * 0.5);
              const y = y0 + r * rowH;
              return (
                <g key={p.name} opacity={o}>
                  <line x1={x0} x2={x0 + 500} y1={y - 40} y2={y - 40} stroke="#e2d9c6" strokeWidth={2} />
                  <text x={x0} y={y} fontSize={28} fontWeight={600} fill="#2a2826">{p.name}</text>
                  {[p.water, p.power, p.fuel].map((ok, k) => (
                    <text key={k} x={x0 + 300 + k * 85} y={y} textAnchor="middle" fontSize={32} fontWeight={800} fill={ok ? "#2f7a4f" : "#c9b48c"}>
                      {ok ? "✓" : "–"}
                    </text>
                  ))}
                </g>
              );
            })}
          </Card>
        </Stage>
      );
    },
  });

  // 7. The week at a glance
  scenes.push({
    title: part("week").title,
    narration: part("week").narration,
    seconds: 8,
    render: (t) => (
      <Stage background={SEA}>
        <Map />
        {legs.map((l, i) => {
          const share = 1 / legs.length;
          const p = partial(l.xy, phase(t, i * share * 0.8, (i + 1) * share * 0.8));
          return <path key={i} d={pathD(p.pts)} fill="none" stroke={ROUTE} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />;
        })}
        {g.ports.filter((p) => !base.name.includes(p.name) && g.legs.some((l) => short(l.to) === p.name || l.to.startsWith(p.name))).map((p, i) => (
          <PortDot key={p.name} p={p} o={fade(t, 0.1 + (i / g.ports.length) * 0.7)} />
        ))}
        <BaseMarker />
      </Stage>
    ),
  });

  // 8. Saturday: check-in and the first night at base
  scenes.push({
    title: part("saturday").title,
    narration: part("saturday").narration,
    seconds: 6,
    render: (t, _s, sec) => (
      <Stage background={SEA}>
        <Map />
        <BaseMarker pulse={(sec % 1.6) / 1.6} />
        <Card x={W - 660} y={40} w={620} h={150} opacity={fade(t, 0, 0.08)}>
          <text x={W - 628} y={95} fontSize={26} fontWeight={700} fill={BRAND} letterSpacing={3}>SATURDAY · CHECK-IN</text>
          <text x={W - 628} y={150} fontSize={40} fontWeight={800} fill="#2a2826">First night in {short(base.name)}</text>
        </Card>
      </Stage>
    ),
  });

  // 9. One scene per sailing day, Sunday to Friday
  for (const [i, l] of legs.entries()) {
    const port = g.ports.find((p) => l.to.startsWith(p.name)) ?? g.ports.find((p) => l.to.includes(p.name));
    const dayName = part(`day-${l.day}`).title.split(":")[0]!;
    const todoStart = splitSentences(dayLead(l)).length;
    const cardH = 190 + l.todo.length * 50;
    scenes.push({
      title: part(`day-${l.day}`).title,
      narration: part(`day-${l.day}`).narration,
      seconds: 8,
      render: (t, sentence) => {
        const p = partial(l.xy, phase(t, 0.05, 0.6));
        return (
          <Stage background={SEA}>
            <Map />
            {legs.slice(0, i).map((d, j) => (
              <path key={j} d={pathD(d.xy)} fill="none" stroke={ROUTE_DONE} strokeWidth={4} strokeDasharray="10 10" />
            ))}
            <path d={pathD(p.pts)} fill="none" stroke={ROUTE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            {port && <PortDot p={port} big o={fade(t, 0.55)} />}
            {i === legs.length - 1 ? <BaseMarker o={fade(t, 0.55)} /> : null}
            <Boat at={p.at} angle={p.angle} />
            <Card x={W - 680} y={40} w={640} h={cardH} opacity={fade(t, 0, 0.06)}>
              <text x={W - 648} y={92} fontSize={24} fontWeight={700} fill={BRAND} letterSpacing={3}>
                {dayName.toUpperCase()} · {l.nm} NM
              </text>
              <text x={W - 648} y={145} fontSize={38} fontWeight={800} fill="#2a2826">
                {short(l.from)} → {short(l.to)}
              </text>
              {l.todo.map((item, k) => (
                <g key={item} opacity={fade(t, 0.12 + k * 0.05) * (sentence >= todoStart ? 1 : 0.55)}>
                  <circle cx={W - 636} cy={192 + k * 50} r={6} fill={BRAND} />
                  <text x={W - 616} y={201 + k * 50} fontSize={26} fill="#2a2826">{item}</text>
                </g>
              ))}
            </Card>
          </Stage>
        );
      },
    });
  }

  // 10. Back to base, and close
  scenes.push({
    title: part("close").title,
    narration: part("close").narration,
    seconds: 6,
    render: (t) => (
      <Stage background={SEA}>
        <g opacity={0.5}>
          <Map dim={0.5} />
        </g>
        {legs.map((l, i) => (
          <path key={i} d={pathD(l.xy)} fill="none" stroke={ROUTE} strokeWidth={5} opacity={fade(t, 0, 0.2)} />
        ))}
        <BaseMarker o={fade(t, 0, 0.2)} />
        <Card x={300} y={300} w={1000} h={300} opacity={fade(t, 0.3, 0.45)}>
          <text x={800} y={400} textAnchor="middle" fontSize={56} fontWeight={800} fill="#2a2826">Your week in {g.name}</text>
          <text x={800} y={465} textAnchor="middle" fontSize={30} fill="#6b6258">nauticalnomads.com</text>
          <rect x={620} y={500} width={360} height={64} rx={32} fill={BRAND} />
          <text x={800} y={542} textAnchor="middle" fontSize={28} fontWeight={700} fill="#fff">Plan my trip</text>
        </Card>
      </Stage>
    ),
  });

  const poster = Math.max(0, scenes.findIndex((sc) => sc.title === "A sample week"));
  const audioUrl = recorded ? (text: string) => `/api/narration/${g.id}/${sentenceHash(text)}` : undefined;
  return <GuidePlayer title={`${g.name} cruising guide`} scenes={scenes} pronounce={{ ...g.speak, ...g.say }} poster={poster} audioUrl={audioUrl} />;
}
