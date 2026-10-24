"use client";

import type { ReactNode } from "react";
import type { CruisingGuide, LonLat, Port } from "@/lib/cruising/types";
import GuidePlayer, { fade, phase, splitSentences, Stage, type Scene } from "./GuidePlayer";

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

export default function GuideVideo({ guide: g }: { guide: CruisingGuide }) {
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

  // 1. Title
  scenes.push({
    title: g.name,
    narration: `${g.name}, ${g.country}. A seven day sailing week from ${g.base}. ${g.tagline}`,
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
          7 days from {g.base} · about {total} nautical miles
        </text>
      </Stage>
    ),
  });

  // 2. Overview of the whole route
  scenes.push({
    title: "The week at a glance",
    narration: `Here is the whole loop: ${g.legs.length} short legs and about ${total} nautical miles in total. ${g.legs
      .map((l) => l.to.split(",")[0])
      .slice(0, -1)
      .join(", ")}, and back to ${g.base}.`,
    seconds: 8,
    render: (t) => (
      <Stage background={SEA}>
        <Map />
        {legs.map((l, i) => {
          const share = 1 / legs.length;
          const p = partial(l.xy, phase(t, i * share * 0.8, (i + 1) * share * 0.8));
          return <path key={i} d={pathD(p.pts)} fill="none" stroke={ROUTE} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />;
        })}
        {g.ports.map((p, i) => (
          <PortDot key={p.name} p={p} o={fade(t, 0.1 + (i / g.ports.length) * 0.7)} />
        ))}
      </Stage>
    ),
  });

  // 3. One scene per day
  for (const [i, l] of legs.entries()) {
    const port = g.ports.find((p) => l.to.startsWith(p.name)) ?? g.ports.find((p) => l.to.includes(p.name));
    scenes.push({
      title: `Day ${l.day}: ${l.from} to ${l.to.split(",")[0]}`,
      narration: `Day ${l.day}. ${l.from} to ${l.to}, about ${l.nm} miles. ${l.summary} ${l.stop ? `${l.stop} ` : ""}${l.overnight}`,
      seconds: 7,
      render: (t) => {
        const p = partial(l.xy, phase(t, 0.08, 0.85));
        return (
          <Stage background={SEA}>
            <Map />
            {legs.slice(0, i).map((d, j) => (
              <path key={j} d={pathD(d.xy)} fill="none" stroke={ROUTE_DONE} strokeWidth={4} strokeDasharray="10 10" />
            ))}
            <path d={pathD(p.pts)} fill="none" stroke={ROUTE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            {port && <PortDot p={port} big o={fade(t, 0.8)} />}
            <Boat at={p.at} angle={p.angle} />
            <Card x={40} y={40} w={560} h={150} opacity={fade(t, 0, 0.08)}>
              <text x={72} y={95} fontSize={26} fontWeight={700} fill={BRAND} letterSpacing={3}>
                DAY {l.day} · {l.nm} NM
              </text>
              <text x={72} y={150} fontSize={40} fontWeight={800} fill="#2a2826">
                {l.from} → {l.to.split(",")[0]}
              </text>
            </Card>
          </Stage>
        );
      },
    });
  }

  // 4. Ports and supplies
  const rows = g.ports;
  scenes.push({
    title: "Water, power and fuel",
    narration: `Where to fill up. Water and shore power are available in the marinas and on most town quays, but not on buoys or at anchor. Fuel is available in ${rows
      .filter((p) => p.fuel)
      .map((p) => p.name)
      .join(", ")}. Keep the tanks topped up when you pass a fuel station.`,
    seconds: 9,
    render: (t) => {
      const rowH = 70;
      const x0 = 1050;
      const y0 = 190;
      return (
        <Stage background="#13293b">
          {/* Map shrunk into the left part of the frame, table on the right. */}
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
              const o = fade(t, 0.1 + (r / rows.length) * 0.6);
              const y = y0 + r * rowH;
              return (
                <g key={p.name} opacity={o}>
                  <line x1={x0} x2={x0 + 500} y1={y - 42} y2={y - 42} stroke="#e2d9c6" strokeWidth={2} />
                  <text x={x0} y={y} fontSize={30} fontWeight={600} fill="#2a2826">{p.name}</text>
                  {[p.water, p.power, p.fuel].map((ok, k) => (
                    <text key={k} x={x0 + 300 + k * 85} y={y} textAnchor="middle" fontSize={34} fontWeight={800} fill={ok ? "#2f7a4f" : "#c9b48c"}>
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

  // 5. Weather and winds
  const winds = g.weather.winds;
  // Sentence index where each wind's part of the narration begins.
  const windStarts: number[] = [];
  {
    let n = splitSentences(g.weather.summary).length;
    for (const w of winds) {
      windStarts.push(n);
      n += splitSentences(`The ${w.name} blows from the ${w.from}. ${w.note}`).length;
    }
  }
  scenes.push({
    title: "Weather and winds",
    narration: `${g.weather.summary} ${winds.map((w) => `The ${w.name} blows from the ${w.from}. ${w.note}`).join(" ")}`,
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

  // 6. Navigation notes
  const notes = g.navigation.slice(0, 4);
  scenes.push({
    title: "Navigation and mooring",
    narration: notes.join(" "),
    seconds: 8,
    render: (_t, sentence) => {
      // Each note lights up when its first sentence is spoken.
      const starts: number[] = [];
      let n = 0;
      for (const s of notes) {
        starts.push(n);
        n += splitSentences(s).length;
      }
      return (
        <Stage background={SEA}>
          <text x={110} y={140} fontSize={56} fontWeight={800} fill="#fff">Navigation and mooring</text>
          {notes.map((s, i) => {
            const shown = sentence >= starts[i]!;
            const short = s.split(/(?<=[.!?])\s+/)[0]!;
            return (
              <g key={i} opacity={shown ? 1 : 0.15}>
                <circle cx={130} cy={248 + i * 150} r={26} fill={BRAND} />
                <text x={130} y={258 + i * 150} textAnchor="middle" fontSize={28} fontWeight={800} fill="#fff">{i + 1}</text>
                <foreignObject x={190} y={215 + i * 150} width={1300} height={130}>
                  <p style={{ margin: 0, color: "#fff", fontSize: 34, lineHeight: 1.3, fontFamily: "inherit" }}>{short}</p>
                </foreignObject>
              </g>
            );
          })}
        </Stage>
      );
    },
  });

  // 7. Close
  scenes.push({
    title: "Plan your week",
    narration: `Best months: ${g.bestMonths.map((m) => new Date(2026, m - 1, 1).toLocaleString("en-GB", { month: "long" })).join(", ")}. Sea temperature: ${g.weather.seaTemp} No sailing licence? Add a skipper and simply enjoy the week.`,
    seconds: 6,
    render: (t) => (
      <Stage background={SEA}>
        <g opacity={0.5}>
          <Map dim={0.5} />
        </g>
        {legs.map((l, i) => (
          <path key={i} d={pathD(l.xy)} fill="none" stroke={ROUTE} strokeWidth={5} opacity={fade(t, 0, 0.2)} />
        ))}
        <Card x={300} y={300} w={1000} h={300} opacity={fade(t, 0.1, 0.25)}>
          <text x={800} y={400} textAnchor="middle" fontSize={56} fontWeight={800} fill="#2a2826">Your week in {g.name}</text>
          <text x={800} y={465} textAnchor="middle" fontSize={30} fill="#6b6258">nauticalnomads.com</text>
          <rect x={620} y={500} width={360} height={64} rx={32} fill={BRAND} />
          <text x={800} y={542} textAnchor="middle" fontSize={28} fontWeight={700} fill="#fff">Plan my trip</text>
        </Card>
      </Stage>
    ),
  });

  return <GuidePlayer title={`${g.name} cruising guide`} scenes={scenes} />;
}
