"use client";

import type { ReactNode } from "react";
import { Anchor, BatteryLow, CalendarDays, CloudLightning, Download, Eye, Fuel, Phone, Radio, Ship, Smartphone, Sun, Thermometer } from "lucide-react";
import { formatBearing, formatLat, formatLon } from "@/lib/courses/geo";
import { FULL_VIEW, lerpView, viewAround } from "@/lib/courses/navigation/chart-geometry";
import { feature, km } from "@/lib/courses/navigation/practice-chart";
import { pick, randInt, randStep } from "@/lib/courses/random";
import { croatiaSplit } from "@/lib/cruising/guides/croatia-split";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, type Scene } from "../../LessonPlayer";
import PracticeChart, { CHART_COLOURS, ChartHighlight, ChartLine, ChartText } from "../../PracticeChart";
import { ART, Card, ChartBanner, ChartScene, Lines, SceneIcon, Yacht } from "../../scene-art";
import {
  AIS_FERRY, AIS_FERRY_CPA, AIS_OWN, APPROACH_WP, CANDIDATES, DEMO, DEMO_CURRENT, DEMO_HEADING, DEMO_SPEED, ROUTE, TRACK, clock, hm, one, weekOf,
} from "./data";
import { plotterAppsAndThePlan as SCRIPT } from "./script";
import { WaypointMark, ZoomArt } from "./widgets";

/** Show an element from narration sentence `from` onwards. */
const on = (sentence: number, from: number) => (sentence >= from ? 1 : 0);
/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });

/** Progress (0 → 1) through one sentence of a scene's narration; splits exactly as the player does. */
function sentenceClock(narration: string) {
  const parts = narration.split(/(?<=[.!?…])\s+(?=[A-Z0-9"“‘(£])/).map((s) => s.trim()).filter(Boolean);
  const total = parts.reduce((n, p) => n + p.length, 0) || 1;
  const spans: Array<[number, number]> = [];
  let acc = 0;
  for (const p of parts) {
    spans.push([acc / total, (acc + p.length) / total]);
    acc += p.length;
  }
  return (t: number, n: number) => {
    const [a, b] = spans[n] ?? [0, 1];
    return Math.max(0, Math.min(1, (t - a) / (b - a)));
  };
}

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const C = CHART_COLOURS;
const WEEK = weekOf(croatiaSplit);
const kAis = sentenceClock(SCRIPT.scenes[6]!.narration);

function Panel({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={22} fill="#0B1929" fillOpacity={0.9} />;
}

function Row({ y, label, value, colour = "#fff", x = 1110, w = 420 }: { y: number; label: string; value: string; colour?: string; x?: number; w?: number }) {
  return (
    <g>
      <text x={x} y={y} fontSize={36} fill={ART.muted} fontWeight={700}>{label}</text>
      <text x={x + w} y={y} textAnchor="end" fontSize={50} fontWeight={800} fontFamily={MONO} fill={colour}>{value}</text>
    </g>
  );
}

/** The plotter screen of scene 1 and 2: a bezel with the zoom drawing inside. */
function Screen({ level, children }: { level: number; children?: ReactNode }) {
  return (
    <g>
      <rect x={90} y={170} width={820} height={560} rx={30} fill="#1d2a38" stroke="#5d6f82" strokeWidth={6} />
      <svg x={120} y={200} width={760} height={470} viewBox="0 0 760 470">
        <ZoomArt level={level} />
        {children}
      </svg>
    </g>
  );
}

const AIS_C = { x: 470, y: 450 };
const AIS_PX = 36;
const aisXY = (e: number, n: number) => ({ x: AIS_C.x + e * AIS_PX, y: AIS_C.y - n * AIS_PX });

const WP_VIEW = viewAround(km(2.6, 13.0), 7, 16 / 9);
const WL = feature("w-ledge");
const WL_VIEW = viewAround(km(6.75, 19.35), 4, 16 / 9);
const WL_GOOD = CANDIDATES.find((c) => c.id === "wl-west")!;
const TRACK_VIEW = viewAround(km(3.9, 11.5), 5, 16 / 9);

const DAY_LABELS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const SCENES: Scene[] = [
  // Sentences: 0 intro, 1 plotter and apps, 2 AIS and radio, 3 the week.
  scene(0, (t, n) => (
    <Stage>
      <path d="M0 640 Q 400 600 800 640 T 1600 640 V900 H0 Z" fill="#123a5a" />
      <path d="M0 700 Q 400 670 800 700 T 1600 700 V900 H0 Z" fill="#0f3049" />
      <Yacht x={200 + t * 1100} y={600} heading={90} scale={1.6} />
      <text x={800} y={260} textAnchor="middle" fontSize={76} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.12)}>The plotter, the apps and the plan</text>
      <text x={800} y={340} textAnchor="middle" fontSize={42} fill={ART.tealBright} opacity={fade(t, 0.1, 0.25)}>Lesson 12 · Navigation for charter skippers</text>
      {[
        { icon: Smartphone, label: "Plotter and apps" },
        { icon: Radio, label: "AIS and VHF" },
        { icon: CalendarDays, label: "Seven days" },
      ].map((s, i) => (
        <g key={s.label} opacity={on(n, i + 1)}>
          <SceneIcon icon={s.icon} x={420 + i * 380} y={440} size={56} colour={ART.tealBright} />
          <Lines x={420 + i * 380} y={520} lines={[s.label]} size={36} anchor="middle" />
        </g>
      ))}
    </Stage>
  )),
  // Sentences: 0 zoomed out looks clear, 1 what it leaves off, 2 zoom in: a rock, 3 overzoom, 4 the habit.
  scene(1, (t, n) => {
    const level = n <= 1 ? (n === 0 ? 0 : 1) : n === 2 ? 2 : n === 3 ? 3 : 2;
    return (
      <Stage>
        <SceneTitle t={t}>What the zoom level hides</SceneTitle>
        <Screen level={level} />
        <text x={500} y={712} textAnchor="middle" fontSize={32} fill={ART.muted}>{["Zoomed out", "Still zoomed out", "Zoomed in on the leg", "Overzoomed", "Zoomed in on the leg"][n] ?? ""}</text>
        {n === 0 && <Lines x={980} y={360} lines={["The route", "looks clear"]} size={60} weight={800} />}
        {n === 1 && <Lines x={980} y={320} lines={["Left off:", "soundings,", "small rocks,", "even reefs"]} size={52} weight={800} />}
        {n === 2 && <Lines x={980} y={340} lines={["Zoom in:", "a rock on", "the line"]} size={60} weight={800} fill="#ff8a8a" />}
        {n === 3 && <Lines x={980} y={340} lines={["Overzoom:", "bigger,", "not better"]} size={60} weight={800} fill={ART.amber} />}
        {n >= 4 && <Lines x={980} y={320} lines={["Check every leg", "zoomed in,", "and keep a good", "distance off"]} size={50} weight={800} />}
      </Stage>
    );
  }),
  // Sentences: 0 not updated for years, 1 survey age, 2 tropics: reef offset, 3 eyes and the bow.
  scene(2, (t, n) => (
    <Stage>
      <SceneTitle t={t}>How old is the chart?</SceneTitle>
      <g transform="translate(110 200)">
        <rect width={700} height={480} rx={30} fill="#1d2a38" stroke="#5d6f82" strokeWidth={6} />
        <rect x={30} y={30} width={640} height={380} rx={10} fill="#d6ecf8" />
        <path d="M30 30 H400 C 360 110 250 150 160 190 C 100 215 60 225 30 230 Z" fill="#f1deb0" stroke="#3b3a36" strokeWidth={3} />
        {n >= 2 && (
          <g>
            <ellipse cx={420} cy={300} rx={70} ry={34} fill="#7dd3fc" stroke="#1d2731" strokeWidth={3} strokeDasharray="8 6" />
            <text x={420} y={366} textAnchor="middle" fontSize={26} fontWeight={700} fill="#1d2731">Reef on the screen</text>
            <ellipse cx={500} cy={250} rx={70} ry={34} fill="none" stroke="#b91c1c" strokeWidth={5} opacity={phase(t, 0.6, 0.75)} />
            <text x={580} y={210} textAnchor="middle" fontSize={26} fontWeight={700} fill="#b91c1c" opacity={phase(t, 0.6, 0.75)}>Reef in the water</text>
            <path d="M120 400 L 560 120" stroke="#c026d3" strokeWidth={6} />
          </g>
        )}
        <text x={350} y={455} textAnchor="middle" fontSize={30} fill={ART.muted}>Chart plotter</text>
      </g>
      <g opacity={on(n, 0)}>
        <Card x={880} y={200} w={620} h={130} title="Chart card: 2016" body="not updated for years" titleSize={44} bodySize={30} accent={ART.amber} />
      </g>
      <g opacity={on(n, 1)}>
        <Card x={880} y={350} w={620} h={130} title="Survey: long ago" body="some by lead line" titleSize={44} bodySize={30} />
      </g>
      <g opacity={on(n, 3)}>
        <Card x={880} y={500} w={620} h={130} icon={Eye} title="Read the water" body="slowly, someone on the bow" titleSize={44} bodySize={30} accent={ART.starboard} />
      </g>
    </Stage>
  )),
  // Sentences: 0 three things, 1 position, 2 heading, 3 course over the ground, 4 the rock.
  scene(3, (t, n) => {
    const boat = { x: 300, y: 430 };
    const len = 520;
    const head = { x: boat.x + Math.sin((DEMO_HEADING * Math.PI) / 180) * len, y: boat.y - Math.cos((DEMO_HEADING * Math.PI) / 180) * len };
    const cog = { x: boat.x + Math.sin((DEMO.cog * Math.PI) / 180) * len, y: boat.y - Math.cos((DEMO.cog * Math.PI) / 180) * len };
    const rock = { x: boat.x + Math.sin((DEMO.cog * Math.PI) / 180) * 470, y: boat.y - Math.cos((DEMO.cog * Math.PI) / 180) * 470 };
    return (
      <Stage>
        <SceneTitle t={t}>Position, heading and course over the ground</SceneTitle>
        {n >= 4 && (
          <g>
            <circle cx={rock.x} cy={rock.y} r={42} fill="#7dd3fc" stroke="#1d2731" strokeWidth={4} strokeDasharray="10 7" />
            <path d={`M${rock.x - 22} ${rock.y} h44 M${rock.x} ${rock.y - 22} v44`} stroke="#fff" strokeWidth={5} />
            <text x={rock.x} y={rock.y + 90} textAnchor="middle" fontSize={36} fontWeight={800} fill="#ff8a8a">Rock</text>
          </g>
        )}
        {n >= 2 && <line x1={boat.x} y1={boat.y} x2={head.x} y2={head.y} stroke="#e5e7eb" strokeWidth={5} strokeDasharray="16 12" />}
        {n >= 2 && <text x={head.x - 10} y={head.y - 24} textAnchor="end" fontSize={34} fontWeight={700} fill="#e5e7eb">Heading</text>}
        {n >= 3 && (
          <g>
            <line x1={boat.x} y1={boat.y} x2={boat.x + (cog.x - boat.x) * phase(t, 0.5, 0.65)} y2={boat.y + (cog.y - boat.y) * phase(t, 0.5, 0.65)} stroke={ART.amber} strokeWidth={8} strokeLinecap="round" />
            <text x={cog.x - 10} y={cog.y + 50} textAnchor="end" fontSize={34} fontWeight={700} fill={ART.amber}>Course over the ground</text>
            <g stroke="#60a5fa" strokeWidth={6} fill="none" strokeLinecap="round">
              <line x1={140} y1={600} x2={140} y2={720} />
              <path d="M120 696 L140 720 L160 696" />
            </g>
            <text x={140} y={770} textAnchor="middle" fontSize={30} fill="#93c5fd">Current</text>
          </g>
        )}
        <Yacht x={boat.x} y={boat.y} heading={DEMO_HEADING} scale={0.9} />
        {n >= 1 && <circle cx={boat.x} cy={boat.y} r={12} fill={ART.port} />}
        <g opacity={on(n, 1)}>
          <Panel x={1060} y={170} w={500} h={n >= 2 ? (n >= 3 ? 470 : 330) : 200} />
          <text x={1094} y={230} fontSize={34} fill={ART.muted}>Position</text>
          <text x={1094} y={290} fontSize={34} fontWeight={800} fontFamily={MONO} fill="#fff">{formatLat(43.35)} {formatLon(16.4)}</text>
          {n >= 2 && <Row y={390} label="Heading" value={formatBearing(DEMO_HEADING, "T")} x={1094} w={436} />}
          {n >= 2 && <Row y={460} label="Speed" value={`${DEMO_SPEED} kn`} x={1094} w={436} />}
          {n >= 3 && <Row y={540} label="COG" value={formatBearing(DEMO.cog, "T")} colour={ART.amber} x={1094} w={436} />}
          {n >= 3 && <Row y={610} label="SOG" value={`${one(DEMO.sog)} kn`} colour={ART.amber} x={1094} w={436} />}
        </g>
        {n >= 3 && <text x={1310} y={700} textAnchor="middle" fontSize={28} fill={ART.muted}>Current {one(DEMO_CURRENT.rate)} knots setting south</text>}
      </Stage>
    );
  }),
  // Sentences: 0 a waypoint, 1 never on a mark, 2 a route, 3 the track, 4 man overboard button, 5 find it.
  scene(4, (t, n) => {
    if (n >= 4) {
      return (
        <Stage>
          <SceneTitle t={t}>The man overboard button</SceneTitle>
          <g transform="translate(470 470)">
            <rect x={-300} y={-260} width={600} height={500} rx={30} fill="#1d2a38" stroke="#5d6f82" strokeWidth={6} />
            <circle r={130} fill="#b91c1c" stroke="#fecaca" strokeWidth={8} opacity={0.75 + 0.25 * Math.abs(Math.sin(t * 12))} />
            <text y={22} textAnchor="middle" fontSize={76} fontWeight={800} fill="#fff">MOB</text>
          </g>
          <Lines x={900} y={360} lines={["Press it first:", "it marks the spot"]} size={54} weight={800} />
          <g opacity={on(n, 5)}>
            <Lines x={900} y={540} lines={["Find it at", "the briefing"]} size={48} fill={ART.tealBright} weight={700} />
          </g>
        </Stage>
      );
    }
    const k = phase(t, 0, 1);
    const view = n === 0 ? WP_VIEW : n === 1 ? WL_VIEW : n === 2 ? lerpView(WL_VIEW, FULL_VIEW, phase(k, 0.3, 0.5)) : TRACK_VIEW;
    return (
      <ChartScene from={view} highlight={n === 0 ? ["kerran-approach"] : n === 1 ? ["w-ledge"] : undefined}>
        {n === 0 && <WaypointMark at={APPROACH_WP} label="WP1" size={6} labelSize={12} labelDy={22} labelDx={12} />}
        {n === 1 && <WaypointMark at={WL.at} size={5} strike colour="#b91c1c" />}
        {n === 1 && <WaypointMark at={WL_GOOD.at} size={5} colour="#15803d" label="On the safe side" labelSize={9} labelDy={-11} anchor="end" labelDx={-4} />}
        {n === 2 && ROUTE.slice(1).map((w, i) => <ChartLine key={w.name} from={ROUTE[i]!.at} to={w.at} colour="#7c3aed" width={2.4} />)}
        {n === 2 && ROUTE.map((w) => <WaypointMark key={w.name} at={w.at} label={w.name} size={6} labelSize={12} />)}
        {n === 3 && TRACK.slice(1).map((p, i) => <ChartLine key={i} from={TRACK[i]!} to={p} colour={C.plotAlt} width={2.2} dash="4 3" />)}
        {n === 3 && <ChartText at={TRACK[3]!} dx={14} size={11} colour={C.plotAlt} anchor="start" bold>Track</ChartText>}
        <ChartBanner>
          {n === 0 ? "A waypoint: a stored position" : n === 1 ? "Never on a mark: set it off, on the safe side" : n === 2 ? "A route: waypoints joined by legs" : "The track: where you have been"}
        </ChartBanner>
      </ChartScene>
    );
  }),
  // Sentences: 0 second opinion, 1 download offline, 2 battery, 3 heat, 4 the habit.
  scene(5, (t, n) => (
    <Stage>
      <SceneTitle t={t}>Phones and tablets</SceneTitle>
      <g transform="translate(340 480)">
        <rect x={-150} y={-290} width={300} height={580} rx={44} fill="#111827" stroke="#9ca3af" strokeWidth={6} />
        <rect x={-130} y={-250} width={260} height={480} rx={14} fill="#d6ecf8" />
        <path d="M-130 -250 H60 C 30 -180 -30 -150 -80 -120 C -110 -100 -125 -95 -130 -92 Z" fill="#f1deb0" />
        <path d="M-90 200 L 90 -180" stroke="#c026d3" strokeWidth={5} />
        <circle cx={0} cy={10} r={11} fill={ART.port} />
        {n >= 2 && <rect x={70} y={-275} width={50} height={18} rx={4} fill="none" stroke={n >= 2 ? "#f87171" : "#fff"} strokeWidth={3} />}
        {n >= 2 && <rect x={73} y={-272} width={10} height={12} fill="#f87171" />}
      </g>
      <Card x={640} y={170} w={880} h={100} icon={Smartphone} title="A superb second opinion" titleSize={42} opacity={on(n, 0)} />
      <Card x={640} y={290} w={880} h={100} icon={Download} title="Download the charts on Wi-Fi" titleSize={42} opacity={on(n, 1)} />
      <Card x={640} y={410} w={880} h={100} icon={BatteryLow} title="Navigating flattens the battery" titleSize={42} opacity={on(n, 2)} accent={ART.amber} />
      <Card x={640} y={530} w={880} h={100} icon={Thermometer} title="Hot sun: it can switch off" titleSize={42} opacity={on(n, 3)} accent={ART.amber} />
      <Card x={640} y={650} w={880} h={100} icon={Sun} title="Charged, shaded, in a case" body="and never the only source" titleSize={40} bodySize={28} opacity={on(n, 4)} accent={ART.starboard} />
    </Stage>
  )),
  // Sentences: 0 what AIS shows, 1 who transmits, 2 closest approach, 3 not everyone: look out.
  scene(6, (t, n) => {
    const r = AIS_FERRY_CPA;
    const sv = { e: AIS_FERRY.speed * Math.sin((AIS_FERRY.course * Math.PI) / 180), n: AIS_FERRY.speed * Math.cos((AIS_FERRY.course * Math.PI) / 180) };
    const h = n === 2 ? ((r.tcpa ?? 0) / 60) * phase(kAis(t, 2), 0.1, 0.8) : n > 2 ? (r.tcpa ?? 0) / 60 : 0;
    const ship0 = aisXY(r.rel.e, r.rel.n);
    const ship1 = aisXY(r.rel.e + sv.e * h, r.rel.n + sv.n * h);
    const own1 = aisXY(0, AIS_OWN.speed * h);
    return (
      <Stage>
        <circle cx={AIS_C.x} cy={AIS_C.y} r={330} fill="#0e2a44" stroke="#2f4f6e" strokeWidth={3} />
        {[2, 4, 6, 8].map((m) => <circle key={m} cx={AIS_C.x} cy={AIS_C.y} r={m * AIS_PX} fill="none" stroke="#2f4f6e" strokeWidth={2} />)}
        <text x={AIS_C.x} y={AIS_C.y - 340} textAnchor="middle" fontSize={36} fontWeight={700} fill="#cfe1f2">N</text>
        {h > 0 && (
          <>
            <line x1={AIS_C.x} y1={AIS_C.y} x2={own1.x} y2={own1.y} stroke="#5eead4" strokeWidth={5} strokeDasharray="12 9" />
            <line x1={ship0.x} y1={ship0.y} x2={ship1.x} y2={ship1.y} stroke="#fbbf24" strokeWidth={5} strokeDasharray="12 9" />
          </>
        )}
        <polygon points="0,-30 19,22 -19,22" transform={`translate(${ship1.x} ${ship1.y}) rotate(${AIS_FERRY.course})`} fill="#fbbf24" />
        <Yacht x={own1.x} y={own1.y} heading={AIS_OWN.course} scale={0.5} />
        {n >= 2 && h > 0 && <line x1={own1.x} y1={own1.y} x2={ship1.x} y2={ship1.y} stroke="#f87171" strokeWidth={5} />}
        {n === 3 && (
          <g>
            <Yacht x={AIS_C.x - 150} y={AIS_C.y - 120} heading={120} scale={0.45} opacity={0.6} />
            <text x={AIS_C.x - 150} y={AIS_C.y - 175} textAnchor="middle" fontSize={36} fontWeight={700} fill="#cbd5e1">No AIS</text>
          </g>
        )}
        {n === 0 && (
          <g>
            <Panel x={880} y={150} w={660} h={420} />
            <text x={920} y={220} fontSize={40} fill={ART.muted}>AIS target</text>
            <Lines x={920} y={290} lines={["Ferry, name shown", `Course ${formatBearing(AIS_FERRY.course, "T")}`, `Speed ${AIS_FERRY.speed} kn`, "Position from her GPS"]} size={46} weight={700} gap={1.4} />
          </g>
        )}
        {n === 1 && (
          <g>
            <Card x={880} y={150} w={660} h={150} icon={Ship} title="Must transmit" body="big ships, passenger ferries" titleSize={48} bodySize={32} accent="#fbbf24" />
            <Card x={880} y={320} w={660} h={150} title="Many yachts" body="transmit and receive" titleSize={48} bodySize={32} accent="#5eead4" />
            <Card x={880} y={490} w={660} h={150} title="Receive only" body="you see them, they do not see you" titleSize={44} bodySize={30} accent={ART.muted} />
          </g>
        )}
        {n === 2 && (
          <g>
            <Panel x={880} y={200} w={660} h={300} />
            <text x={920} y={300} fontSize={60} fontWeight={800} fontFamily={MONO} fill={r.cpa < 1 ? "#f87171" : "#fff"}>CPA {r.cpa.toFixed(1)} M</text>
            <text x={920} y={410} fontSize={60} fontWeight={800} fontFamily={MONO} fill="#fff">in {Math.round(r.tcpa ?? 0)} min</text>
          </g>
        )}
        {n === 3 && (
          <g>
            <Panel x={880} y={200} w={660} h={300} />
            <SceneIcon icon={Eye} x={948} y={280} size={56} />
            <text x={996} y={300} fontSize={56} fontWeight={800} fill="#fff">Keep looking out</text>
            <Lines x={920} y={390} lines={["Fishing boats, small", "motor boats, many yachts"]} size={40} fill={ART.muted} />
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 the boat's telephone, 1 channel 16, 2 marina channel, 3 how to call, 4 working channel,
  // 5 Mayday only for, 6 Mayday in outline, 7 distress button and card.
  scene(7, (t, n) => {
    const channel = n === 1 || n >= 5 ? "16" : n >= 2 ? "17" : "16";
    return (
      <Stage>
        <SceneTitle t={t}>{n >= 5 ? "Mayday, in outline" : "The VHF radio"}</SceneTitle>
        <g transform="translate(110 260)">
          <rect width={600} height={380} rx={30} fill="#1f2937" stroke="#6b7280" strokeWidth={6} />
          <rect x={40} y={40} width={330} height={170} rx={12} fill="#a7f3d0" />
          <text x={205} y={170} textAnchor="middle" fontSize={130} fontWeight={800} fontFamily={MONO} fill="#064e3b">{channel}</text>
          <text x={60} y={80} fontSize={26} fontWeight={700} fill="#064e3b">{channel === "16" ? "Ch 16" : "Marina, for example"}</text>
          {[0, 1, 2].map((i) => <circle key={i} cx={460 + (i % 2) * 70} cy={90 + i * 50} r={24} fill="#4b5563" />)}
          <rect x={410} y={250} width={140} height={90} rx={12} fill={n >= 7 ? "#dc2626" : "#7f1d1d"} />
          <text x={480} y={306} textAnchor="middle" fontSize={26} fontWeight={800} fill="#fff">DISTRESS</text>
          <rect x={40} y={250} width={330} height={90} rx={12} fill="#374151" />
        </g>
        {n === 0 && (
          <g>
            <Card x={800} y={220} w={720} h={120} title="Coastguard" titleSize={46} />
            <Card x={800} y={360} w={720} h={120} title="Marinas" titleSize={46} />
            <Card x={800} y={500} w={720} h={120} title="Other boats" titleSize={46} />
          </g>
        )}
        {n === 1 && <Lines x={800} y={330} lines={["Channel 16:", "distress, safety", "and calling"]} size={58} weight={800} />}
        {n >= 2 && n <= 4 && (
          <g>
            <text x={800} y={240} fontSize={34} fill={ART.muted}>Channel from the pilot book</text>
            <g opacity={on(n, 3)}>
              <Lines x={800} y={330} lines={["Marina Milna, Marina Milna,", "this is Blue Moon,", "Blue Moon, over."]} size={48} weight={700} />
            </g>
            <g opacity={on(n, 4)}>
              <text x={800} y={600} fontSize={40} fill={ART.tealBright} fontWeight={700}>Short, then a working channel</text>
            </g>
          </g>
        )}
        {n === 5 && <Lines x={800} y={330} lines={["Grave and immediate", "danger to the boat", "or a person"]} size={56} weight={800} fill="#fca5a5" />}
        {n >= 6 && (
          <g>
            {["Mayday, Mayday, Mayday", "This is: the boat's name", "Where you are", "What is wrong", "What help you need", "How many on board"].map((l, i) => (
              <text key={l} x={800} y={250 + i * 70} fontSize={42} fontWeight={i === 0 ? 800 : 600} fill={i === 0 ? "#fca5a5" : "#fff"}>{`${i + 1}. ${l}`}</text>
            ))}
            <g opacity={on(n, 7)}>
              <text x={800} y={720} fontSize={36} fill={ART.tealBright} fontWeight={700}>Distress button first; the card is by the radio</text>
            </g>
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 seven days, six sailing, 1 Saturday to Saturday, 2 ten to twenty miles, 3 a rest day,
  // 4 longest and furthest early, 5 forecast, 6 bolt-holes.
  scene(8, (t, n) => {
    const max = Math.max(...WEEK.legs.map((l) => l.nm));
    const longest = WEEK.legs.findIndex((l) => l.nm === max);
    const shortest = WEEK.legs.findIndex((l) => l.nm === Math.min(...WEEK.legs.map((x) => x.nm)));
    return (
      <Stage>
        <SceneTitle t={t}>Seven days, six of them sailing</SceneTitle>
        {DAY_LABELS.map((d, i) => {
          const x = 110 + i * 175;
          const edge = i === 0 || i === 7;
          const leg = WEEK.legs[i - 1];
          const barH = leg ? (leg.nm / max) * 250 : 0;
          return (
            <g key={`${d}-${i}`}>
              <rect x={x} y={200} width={160} height={90} rx={14} fill={n >= 1 ? (edge ? "rgba(245,179,1,0.25)" : "rgba(43,179,192,0.2)") : "rgba(255,255,255,0.08)"} stroke={edge && n >= 1 ? ART.amber : ART.tealBright} strokeWidth={3} />
              <text x={x + 80} y={258} textAnchor="middle" fontSize={40} fontWeight={700} fill="#fff">{d}</text>
              {n >= 1 && edge && <text x={x + 80} y={340} textAnchor="middle" fontSize={28} fill={ART.amber}>{i === 0 ? "Check in" : "Hand back"}</text>}
              {n >= 2 && leg && (
                <g>
                  <rect x={x + 30} y={620 - barH} width={100} height={barH} rx={8} fill={n >= 4 && i - 1 === longest ? ART.amber : n >= 3 && i - 1 === shortest ? ART.starboard : ART.tealBright} />
                  <text x={x + 80} y={605 - barH} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff">{leg.nm}</text>
                  {n >= 6 && <SceneIcon icon={Anchor} x={x + 80} y={662} size={36} colour={ART.tealBright} />}
                </g>
              )}
              {n >= 5 && i === 4 && <SceneIcon icon={CloudLightning} x={x + 80} y={330} size={56} colour="#fca5a5" />}
            </g>
          );
        })}
        {n >= 2 && <text x={1500} y={380} textAnchor="end" fontSize={30} fill={ART.muted}>Miles a day, {WEEK.name}</text>}
        {n >= 3 && n < 4 && <text x={1500} y={420} textAnchor="end" fontSize={30} fill={ART.starboard}>Short day mid-week</text>}
        {n >= 4 && <text x={1500} y={420} textAnchor="end" fontSize={30} fill={ART.amber}>Longest crossing early</text>}
        {n >= 6 && <text x={800} y={735} textAnchor="middle" fontSize={32} fill={ART.tealBright}>A bolt-hole for every day</text>}
      </Stage>
    );
  }),
  // Sentences: 0 back to base Friday, 1 by late afternoon, refuelled, 2 within an easy half day on Thursday, 3 call early, 4 next: the check.
  scene(9, (t, n) => {
    const max = Math.max(...WEEK.legs.map((l) => l.fromBase), 1);
    return (
      <Stage>
        <SceneTitle t={t}>Back on Friday</SceneTitle>
        <text x={160} y={230} fontSize={32} fill={ART.muted}>Miles from {WEEK.base} each night (straight line)</text>
        {WEEK.legs.map((l, i) => {
          const x = 180 + i * 200;
          const barH = (l.fromBase / max) * 330;
          const thu = i === 4 && n >= 2;
          return (
            <g key={l.day}>
              <rect x={x} y={640 - barH} width={130} height={Math.max(barH, 4)} rx={8} fill={i === 5 ? ART.starboard : thu ? ART.amber : ART.tealBright} />
              <text x={x + 65} y={625 - barH} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff">{l.fromBase}</text>
              <text x={x + 65} y={690} textAnchor="middle" fontSize={30} fontWeight={700} fill="#fff">{l.day.slice(0, 3)}</text>
              <text x={x + 65} y={730} textAnchor="middle" fontSize={24} fill={ART.muted}>{l.to.split(",")[0]}</text>
            </g>
          );
        })}
        {n >= 1 && <Card x={1000} y={200} w={540} h={90} icon={Fuel} title="Refuelled, by late afternoon" titleSize={30} />}
        {n >= 3 && <Card x={1000} y={305} w={540} h={90} icon={Phone} title="Weather? Call the base early" titleSize={30} accent={ART.amber} />}
        {n >= 4 && <text x={1270} y={450} textAnchor="middle" fontSize={36} fontWeight={800} fill={ART.tealBright}>Next: the final check</text>}
      </Stage>
    );
  }),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="The plotter, the apps and the plan" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

const WP_FIGURE_VIEW = viewAround(APPROACH_WP, 3, 4 / 3);
const FRI = WEEK.legs[5]!;
// Friday: in by 1700, an hour for the fuel queue, at five knots.
const FRI_MINUTES = Math.round((FRI.nm / 5) * 60);
const FRI_LEAVE = 17 * 60 - 60 - FRI_MINUTES;

export const QUESTIONS: Question[] = [
  {
    id: "zoom-out",
    kind: "choice",
    prompt: "Zoomed out to see the whole day, your planned route across a bay looks clear. What should you do before you rely on it?",
    options: [
      "Zoom in and follow every leg, looking for rocks, shallows and soundings that did not show",
      "Nothing: if it looks clear zoomed out, it is clear",
      "Zoom out further so you can see more",
      "Switch to the satellite photo layer and go",
    ],
    answer: 0,
    explain: "Zoomed out, many plotters leave off soundings, small rocks and even reefs. Check every leg zoomed in, and keep a sensible distance off every danger.",
  },
  {
    id: "cog-heading",
    kind: "choice",
    prompt: "The plotter shows heading 090° and course over the ground 104°. What is happening?",
    options: [
      "A current or leeway is setting you to starboard of where the bow points",
      "The compass is broken",
      "You are going backwards",
      "The plotter is showing magnetic and true at the same time",
    ],
    answer: 0,
    explain: `The heading is where the bow points; course over the ground is where you are actually going. Steering ${formatBearing(DEMO_HEADING)} at ${DEMO_SPEED} knots with a ${one(DEMO_CURRENT.rate)}-knot current setting south gives a course over the ground of about ${formatBearing(DEMO.cog)}: you track south of the bow. If that line points at a danger, that is where you are going.`,
  },
  {
    id: "which-line",
    kind: "choice",
    prompt: "Motoring across a channel with a strong current from the side, which line on the plotter shows where you will actually end up?",
    options: ["The course over the ground line", "The heading line", "The line to the next waypoint", "The last hour of track"],
    answer: 0,
    explain: "The course over the ground is worked out from how your position is changing, so it already includes current and leeway. The heading line only shows where the bow points.",
  },
  {
    id: "wp-on-mark",
    kind: "choice",
    prompt: "Where should you put the waypoint for the start of a harbour approach marked by a buoy?",
    options: [
      "A little way off the buoy, in clear water on its safe side",
      "Exactly on the buoy, so you can find it",
      "On the rocks the buoy marks, so the plotter warns you",
      "Anywhere: waypoints are only a rough guide",
    ],
    answer: 0,
    explain: "Satellite positions are accurate enough to take you right onto a buoy or rock, and every other boat aiming at the same mark meets you there. Set waypoints off marks and dangers, on the safe side.",
  },
  {
    id: "wp-position",
    kind: "position",
    prompt: "This is the waypoint WP1 at the start of the Port Kerran approach. Read its position from the chart, to the nearest tenth of a minute, to type into the plotter. Hover or tap the chart to read positions; zoom in for accuracy.",
    answer: APPROACH_WP,
    tolerance: 0.2,
    figure: (
      <PracticeChart mode="readout" zoomable view={WP_FIGURE_VIEW} title="Practice chart showing waypoint WP1 south of the Kerran Approach buoy">
        <ChartHighlight at={APPROACH_WP} r={14} />
        <WaypointMark at={APPROACH_WP} label="WP1" size={6} labelSize={12} />
      </PracticeChart>
    ),
    explain: <>WP1 is 0.3 miles due south of the Kerran Approach safe water buoy: {formatLat(APPROACH_WP.lat)} {formatLon(APPROACH_WP.lon)}. Read latitude off the side scale and longitude off the top or bottom, and check the hemisphere letters before you save it.</>,
  },
  {
    id: "mob",
    kind: "choice",
    prompt: "Someone falls overboard. Which of these do you do straight away, along with shouting and pointing?",
    options: ["Press the man overboard button on the plotter", "Plot the position on the paper chart", "Call the charter base on the phone", "Read the plotter manual"],
    answer: 0,
    explain: "The man overboard button marks the spot the moment you press it and shows the way back. Keep one person pointing at the person in the water all the time, because a current carries them away from the marked spot.",
  },
  {
    id: "offline",
    kind: "choice",
    prompt: "You plan to use a charting app on your phone as a backup. When should you download the charts for the area?",
    options: ["Before you leave Wi-Fi, for the whole cruising area", "When you need them at sea", "Never: the app works without charts", "Only if the plotter fails"],
    answer: 0,
    explain: "Mobile signal at sea comes and goes, and roaming data is expensive. The phone finds its position without signal, but it needs the charts already downloaded. Then keep it charged and out of the sun.",
  },
  {
    id: "ais-empty",
    kind: "choice",
    prompt: "The plotter's AIS screen shows no targets near you. What does that tell you?",
    options: [
      "Only that no AIS transmitters are near: fishing boats, small motor boats and many yachts may still be there",
      "That there are no boats within ten miles",
      "That you can stop keeping a lookout",
      "That the radio is switched off",
    ],
    answer: 0,
    explain: "Big ships and passenger ferries must transmit AIS, but many smaller boats do not. AIS adds to your lookout; it never replaces it.",
  },
  {
    id: "ch16",
    kind: "choice",
    prompt: "What is VHF channel 16 for?",
    options: ["Distress, safety and calling", "Chatting with friends on other boats", "Marina bookings only", "Weather forecasts only"],
    answer: 0,
    explain: "Channel 16 is the international distress, safety and calling channel: keep it on at sea. Marinas often use another channel, given in the pilot book, and you move to a working channel for a conversation.",
  },
  {
    id: "mayday",
    kind: "choice",
    prompt: "Which of these is a Mayday situation?",
    options: [
      "A fire on board that you cannot put out",
      "The engine will not start in the marina",
      "You are running low on drinking water",
      "The marina you wanted is full",
    ],
    answer: 0,
    explain: "Mayday is for grave and immediate danger to the boat or a person. The others are problems for the charter base or the marina. If your radio has a red distress button, press and hold it first, then give the Mayday on channel 16.",
  },
  {
    id: "friday-leave",
    kind: "time",
    prompt: <>Friday&apos;s leg back to {WEEK.base} is {FRI.nm} miles. You average 5 knots, the base wants you in by 1700, and you allow an hour for the fuel queue. What is the latest time you should leave? (24-hour clock)</>,
    answer: FRI_LEAVE,
    tolerance: 10,
    explain: `${FRI.nm} miles at 5 knots is ${hm(FRI_MINUTES)}. Back from 1700: one hour for fuel takes you to 1600, then ${hm(FRI_MINUTES)} earlier is ${clock(FRI_LEAVE)}. In practice leave earlier still: Friday afternoon queues are long and the breeze may be on the nose.`,
  },
  {
    id: "far-point",
    kind: "choice",
    prompt: "Planning a charter week, when should the longest passage and the furthest point from the base come?",
    options: [
      "Early in the week, with days in hand if the weather turns",
      "On Friday, to finish with a big sail",
      "On the last day before the check-in inspection",
      "It does not matter",
    ],
    answer: 0,
    explain: "Do the long crossing while the forecast is clear and you have spare days. By Thursday night aim to be within an easy half day of the base, so a windy Friday does not leave you stranded.",
  },
];

export const PRACTICE: PracticeGenerator = {
  title: "Day sums and waypoints",
  description: "Fresh arrival times and waypoint calls each time: the sums you do every morning on a charter.",
  generate: (rng) => {
    const qs: Question[] = [];
    for (let i = 0; i < 3; i++) {
      const d = randInt(rng, 8, 26);
      const s = pick(rng, [5, 5.5, 6]);
      const leave = randStep(rng, 9 * 60, 11 * 60 + 30, 15);
      const mins = Math.round((d / s) * 60);
      qs.push({
        id: `arrive-${i}-${d}-${s}-${leave}`,
        kind: "time",
        prompt: `You leave at ${clock(leave)} for a bay ${d} miles away and expect to average ${s} knots. When do you arrive? (24-hour clock)`,
        answer: leave + mins,
        tolerance: 5,
        explain: `Time = distance ÷ speed: ${d} ÷ ${s} = ${(d / s).toFixed(2)} hours, which is ${hm(mins)}. ${clock(leave)} plus ${hm(mins)} is ${clock(leave + mins)}.`,
      });
    }
    const c = pick(rng, CANDIDATES);
    qs.push({
      id: `wp-${c.id}`,
      kind: "choice",
      prompt: <>Is this a good waypoint? <strong>{c.label}</strong>.</>,
      options: ["Good waypoint", "Bad waypoint"],
      answer: c.good ? 0 : 1,
      fixedOrder: true,
      figure: (
        <PracticeChart view={viewAround(c.at, 6, 4 / 3)} zoomable title="Practice chart with the proposed waypoint">
          <WaypointMark at={c.at} label="WP" size={8} labelSize={12} />
        </PracticeChart>
      ),
      explain: c.why,
    });
    return qs;
  },
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
