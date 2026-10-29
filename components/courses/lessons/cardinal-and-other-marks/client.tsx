"use client";

import { Compass, Map as MapIcon, Moon, Sun } from "lucide-react";
import { formatBearing, reciprocal, rhumbBearing, rhumbDestination, rhumbDistance, type LatLon } from "@/lib/courses/geo";
import { lightOn, type LightColour } from "@/lib/courses/navigation/lights";
import { BANK, feature, km } from "@/lib/courses/navigation/practice-chart";
import { project, viewAround } from "@/lib/courses/navigation/chart-geometry";
import { pick, randInt, shuffle, type Rng } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, splitSentences, type Scene } from "../../LessonPlayer";
import PracticeChart, { ChartLine } from "../../PracticeChart";
import { IalaMark, LightGlow, MARK_INFO, type MarkType } from "../../marks";
import { ART, Card, ChartScene, Lines } from "../../scene-art";
import {
  Arrow, BoatGlyph, ChartDanger, ChartSafeSide, FishFarmFigure, MarkPicture, Overlay, PatternBar, PlanQuadrants, PlanRock, SAFE_GREEN, SwimmingAreaFigure, Tag,
} from "./art";
import {
  ALTERNATING, APPROACH, CARD, CARDINALS, CHART_CARDINALS, LIGHTS, MARK_ACTION, MARK_LIGHTS, MEW, ACTION_TEXT, actionChoices, cables, capital, chartMark, colourAt,
  depthHere, lightWords, miles, pattern, quadrantOf, quadrantText,
  type Cardinal, type ChartCardinal, type OtherMark,
} from "./data";
import { cardinalAndOtherMarks as SCRIPT } from "./script";
import { NightLight } from "./widgets";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Show an element from narration sentence `from` onwards. */
const on = (sentence: number, from: number) => (sentence >= from ? 1 : 0);
/** Pair a scripted scene with its visual. */
const scene = (i: number, render: Scene["render"]): Scene => ({ ...SCRIPT.scenes[i]!, render });

/** Where each narration sentence of scene i starts and ends as a fraction of the scene. */
function spans(i: number): Array<[number, number]> {
  const parts = splitSentences(SCRIPT.scenes[i]!.narration);
  const total = parts.reduce((n, s) => n + s.length, 0) || 1;
  let at = 0;
  return parts.map((s) => {
    const span: [number, number] = [at / total, (at + s.length) / total];
    at += s.length;
    return span;
  });
}

/** 0 → 1 progress through one sentence (clamped). */
function within(sp: Array<[number, number]>, sentence: number, t: number): number {
  const s = sp[sentence];
  if (!s) return 1;
  return Math.min(1, Math.max(0, (t - s[0]) / (s[1] - s[0] || 1)));
}

const lerp = (a: LatLon, b: LatLon, f: number): LatLon => ({ lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f });
const SEA = "#2f6f99";
const SKY = "#cfe8f6";

/** Black bands of each cardinal, as indexes into its bands (top first). */
const BLACK_BANDS: Record<Cardinal, { bands: number; black: number[] }> = {
  north: { bands: 2, black: [0] }, east: { bands: 3, black: [0, 2] }, south: { bands: 2, black: [1] }, west: { bands: 3, black: [1] },
};
const STAGE_TOPMARK: Record<Cardinal, [string, string]> = {
  north: ["Both point up", "North is up"],
  east: ["Base to base", "Like an egg"],
  south: ["Both point down", "South is down"],
  west: ["Point to point", "Like a wine glass"],
};
const STAGE_COLOURS: Record<Cardinal, string> = { north: "Black over yellow", east: "Black, yellow, black", south: "Yellow over black", west: "Yellow, black, yellow" };

/** A cardinal mark drawn large on a daylight panel, with its topmark and colours beside it. */
function BigCardinal({ type, x, show, outline }: { type: Cardinal; x: number; show: boolean; outline: boolean }) {
  const k = 1.6;
  const MY = 690;
  const bandH = (120 * k) / BLACK_BANDS[type].bands;
  const col = x + 190;
  return (
    <g opacity={show ? 1 : 0.15}>
      <rect x={x - 170} y={170} width={340} height={600} rx={20} fill={SKY} />
      <rect x={x - 170} y={690} width={340} height={80} fill={SEA} />
      <IalaMark type={type} x={x} y={MY} scale={k} />
      {outline && BLACK_BANDS[type].black.map((i) => (
        <rect key={i} x={x - 26 * k - 7} y={MY - 120 * k + i * bandH - 4} width={52 * k + 14} height={bandH + 8} fill="none" stroke="#e8590c" strokeWidth={7} rx={4} />
      ))}
      <text x={col} y={300} fontSize={34} fill={ART.muted}>{CARD[type].short}</text>
      <text x={col} y={360} fontSize={42} fontWeight={800} fill="#fff">{STAGE_TOPMARK[type][0]}</text>
      <text x={col} y={410} fontSize={34} fill={ART.amber}>{STAGE_TOPMARK[type][1]}</text>
      <text x={col} y={490} fontSize={34} fill={ART.muted}>Colours</text>
      <text x={col} y={540} fontSize={40} fontWeight={700} fill="#fff">{STAGE_COLOURS[type]}</text>
    </g>
  );
}

/** One of the other marks drawn large on a daylight panel (left of the stage). */
function BigMark({ type, lit = false, night = false, glow = null }: { type: MarkType; lit?: boolean; night?: boolean; glow?: LightColour | null }) {
  return (
    <g>
      <rect x={90} y={170} width={560} height={600} rx={20} fill={night ? "#081424" : SKY} />
      <rect x={90} y={690} width={560} height={80} fill={night ? "#0b2236" : SEA} />
      <IalaMark type={type} x={370} y={700} scale={1.9} lit={lit && !night} />
      {night && <rect x={90} y={170} width={560} height={600} rx={20} fill="#030a14" opacity={0.85} />}
      {night && <LightGlow x={370} y={LANTERN_Y} on={glow !== null} colour={glow ?? "W"} r={24} />}
    </g>
  );
}

/** Where a mark's light sits in BigMark (IalaMark's lantern, scaled 1.9). */
const LANTERN_Y = Math.round((700 - 149 * 1.9) * 100) / 100;

/** Labelled facts in the right half of the stage. */
function Facts({ rows, n }: { rows: Array<{ k: string; v: string; at: number }>; n: number }) {
  return (
    <g>
      {rows.map((r, i) => (
        <g key={r.k} opacity={n >= r.at ? 1 : 0.15}>
          <text x={740} y={260 + i * 125} fontSize={34} fill={ART.muted}>{r.k}</text>
          <text x={740} y={312 + i * 125} fontSize={46} fontWeight={800} fill="#fff">{r.v}</text>
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Chart data used by the scenes                                       */
/* ------------------------------------------------------------------ */

const N_TEETH = chartMark("n-teeth");
const E_TEETH = chartMark("east-teeth");
const S_BRENNAN = chartMark("s-brennan");
const TEETH = feature("teeth");

// A yacht heading south down the east side of the island: north of North
// Teeth, then east of East Teeth (checked below: well clear of The Teeth).
const R0 = rhumbDestination(N_TEETH.mark.at, 320, 0.8);
const R1 = rhumbDestination(N_TEETH.mark.at, 0, 0.6);
const R2 = rhumbDestination(E_TEETH.mark.at, 90, 0.55);
const R3 = rhumbDestination(R2, 180, 0.7);
const ROUTE_CLEAR = Math.min(...Array.from({ length: 31 }, (_, i) => {
  const f = i / 30;
  return Math.min(rhumbDistance(lerp(R0, R1, f), TEETH.at), rhumbDistance(lerp(R1, R2, f), TEETH.at), rhumbDistance(lerp(R2, R3, f), TEETH.at));
}));
if (ROUTE_CLEAR < 0.5) throw new Error(`the video's route passes only ${ROUTE_CLEAR.toFixed(2)} miles from The Teeth`);
const PASS_VIEW = viewAround(km(7.42, 4.75), 5.6, 16 / 9);
const S4 = spans(4);

const CLOCK: Record<Cardinal, { x: number; y: number; hour: string; hx: number; hy: number; lx: number; ly: number; frac: number; row: number; what: string }> = {
  east: { x: 680, y: 440, hour: "3", hx: 744, hy: 454, lx: 606, ly: 456, frac: 0, row: 0, what: "3 flashes" },
  south: { x: 520, y: 600, hour: "6", hx: 520, hy: 682, lx: 520, ly: 542, frac: 0.35, row: 1, what: "6 + long flash" },
  west: { x: 360, y: 440, hour: "9", hx: 296, hy: 454, lx: 434, ly: 456, frac: 0.7, row: 2, what: "9 flashes" },
  north: { x: 520, y: 280, hour: "12", hx: 520, hy: 226, lx: 520, ly: 370, frac: 0, row: 3, what: "without a break" },
};
const CLOCK_TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  return { x1: 520 + Math.sin(a) * 262, y1: 440 - Math.cos(a) * 262, x2: 520 + Math.sin(a) * 282, y2: 440 - Math.cos(a) * 282 };
});
const S3 = spans(3);

const MEW_LIGHT = pattern(MEW.light!);
const APPROACH_LIGHT = pattern(APPROACH.light!);
const SPECIAL_LIGHT = pattern("Fl Y 5s");

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

const SCENES: Scene[] = [
  // Sentences: 0 dangers in open water, 1 the compass, 2 the four lines, 3 four quadrants, 4 the mark and its named side.
  scene(0, (t, n) => {
    const cx = 800;
    const cy = 448;
    const r = 228;
    const sp = spans(0);
    return (
      <Stage>
        <SceneTitle t={t}>Cardinal marks</SceneTitle>
        <rect x={490} y={150} width={620} height={598} rx={20} fill="#eaf4fb" />
        {n >= 3 && <PlanQuadrants cx={cx} cy={cy} r={r} lines={0} labels={0} tint={n >= 4 ? ["north"] : CARDINALS} tintOpacity={n === 3 ? fade(within(sp, 3, t), 0, 0.3) : 1} />}
        {n >= 2 && (
          <PlanQuadrants cx={cx} cy={cy} r={r} labelSize={44} labelAt={1.12}
            lines={n === 2 ? phase(within(sp, 2, t), 0.05, 0.55) : 1}
            bearings={n === 2 ? fade(within(sp, 2, t), 0.55, 0.75) : 1}
            labels={n >= 3 ? 1 : 0} />
        )}
        <PlanRock x={cx} y={cy} r={n >= 4 ? 30 : 40} />
        {n === 0 && <Lines x={80} y={330} lines={["A danger in", "open water"]} size={50} weight={700} />}
        <g opacity={n >= 1 ? 1 : 0}>
          <line x1={1470} y1={330} x2={1470} y2={200} stroke="#fff" strokeWidth={6} />
          <polygon points="1470,170 1452,212 1488,212" fill={ART.port} />
          <text x={1470} y={380} textAnchor="middle" fontSize={44} fontWeight={800} fill="#fff">N</text>
        </g>
        {n === 1 && <Lines x={80} y={330} lines={["Use the", "compass"]} size={50} weight={700} />}
        {n === 2 && <Lines x={1150} y={500} lines={["True bearings", "from the danger"]} size={42} weight={700} fill={ART.tealBright} />}
        {n === 3 && <Lines x={80} y={330} lines={["Four", "quadrants"]} size={50} weight={700} />}
        {n >= 4 && (
          <g>
            <IalaMark type="north" x={cx} y={cy - 56} scale={0.72} />
            <Arrow x1={cx + 80} y1={cy - 100} x2={cx + 80} y2={cy - 200} colour={SAFE_GREEN} width={9} />
            <Lines x={80} y={330} lines={["Named after", "its quadrant"]} size={46} weight={700} />
            <Lines x={1150} y={500} lines={["Pass north of", "a north cardinal"]} size={42} weight={700} fill="#4ade80" />
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 black and yellow, two cones, 1 north, 2 south, 3 cones point to the black.
  scene(1, (t, n) => (
    <Stage>
      <SceneTitle t={t}>{n === 0 ? "Black and yellow, two black cones" : "North and south"}</SceneTitle>
      {n === 0 ? (
        <g>
          <rect y={640} width={1600} height={260} fill={SEA} />
          {CARDINALS.map((c, i) => <IalaMark key={c} type={c} x={260 + i * 360} y={680} scale={1.4} />)}
          <Lines x={800} y={250} anchor="middle" size={46} weight={700} fill={ART.amber} lines={["Read the cones first"]} />
        </g>
      ) : (
        <g>
          <BigCardinal type="north" x={185} show={n >= 1} outline={n >= 3} />
          <BigCardinal type="south" x={965} show={n >= 2} outline={n >= 3} />
          {n >= 3 && <Lines x={800} y={830} anchor="middle" size={42} weight={800} fill={ART.amber} lines={["The cones point to the black"]} />}
        </g>
      )}
    </Stage>
  )),
  // Sentences: 0 east, 1 west, 2 cones point to the black.
  scene(2, (t, n) => (
    <Stage>
      <SceneTitle t={t}>East and west</SceneTitle>
      <BigCardinal type="east" x={185} show={n >= 0} outline={n >= 2} />
      <BigCardinal type="west" x={965} show={n >= 1} outline={n >= 2} />
      {n >= 2 && <Lines x={800} y={830} anchor="middle" size={42} weight={800} fill={ART.amber} lines={["Again: the cones point to the black"]} />}
    </Stage>
  )),
  // Sentences: 0 white, quick or very quick, 1 a clock face, 2 east, south, west, 3 north, 4 south's long flash.
  scene(3, (t, n, secs) => (
    <Stage>
      <SceneTitle t={t}>Lights: think of a clock</SceneTitle>
      <circle cx={520} cy={440} r={292} fill="#0b1a2c" stroke="#3d5a78" strokeWidth={6} opacity={on(n, 1) || 0.3} />
      {CLOCK_TICKS.map((k, i) => <line key={i} {...k} stroke="#9fb3c8" strokeWidth={i % 3 === 0 ? 8 : 4} opacity={on(n, 1) || 0.3} />)}
      <circle cx={520} cy={440} r={10} fill="#5d7a98" />
      {CARDINALS.map((c) => {
        const p = CLOCK[c];
        const shown = c === "north" ? n >= 3 : n > 2 || (n === 2 && within(S3, 2, t) >= p.frac);
        const hot = n === 4 && c === "south";
        return (
          <g key={c}>
            <text x={p.hx} y={p.hy} textAnchor="middle" fontSize={40} fontWeight={700} fill="#9fb3c8" opacity={on(n, 1)}>{p.hour}</text>
            {shown && <LightGlow x={p.x} y={p.y} on={lightOn(LIGHTS[c].quick, secs)} r={16} />}
            {shown && <text x={p.lx} y={p.ly} textAnchor="middle" fontSize={46} fontWeight={800} fill={hot ? ART.amber : "#fff"}>{CARD[c].letter}</text>}
            {shown && (
              <g>
                <text x={940} y={300 + p.row * 92} fontSize={50} fontWeight={800} fill={hot ? ART.amber : ART.tealBright}>{CARD[c].letter}</text>
                <text x={1010} y={300 + p.row * 92} fontSize={42} fontWeight={700} fill={hot ? ART.amber : "#fff"}>{p.what}</text>
              </g>
            )}
          </g>
        );
      })}
      {n === 0 && <Lines x={940} y={330} lines={["Always white", "Quick or very quick"]} size={44} weight={700} />}
      {n >= 4 && <Lines x={940} y={660} lines={["Long flash: six cannot", "pass for three or nine"]} size={40} weight={700} fill={ART.amber} />}
    </Stage>
  )),
  // Sentences: 0 The Teeth and two cardinals, 1 north of North Teeth, 2 east of East Teeth, 3 never cut between.
  scene(4, (t, n, secs) => {
    const view = PASS_VIEW;
    const size = Math.round(view.w * 0.03 * 100) / 100;
    const w = within(S4, Math.min(n, 3), t);
    let at = R0;
    let heading = rhumbBearing(R0, R1);
    if (n === 0) at = R0;
    else if (n === 1) at = lerp(R0, R1, phase(w, 0.05, 0.9));
    else if (n === 2) {
      const f = phase(w, 0, 0.6);
      const g = phase(w, 0.6, 1);
      at = f < 1 ? lerp(R1, R2, f) : lerp(R2, R3, g * 0.6);
      heading = f < 1 ? rhumbBearing(R1, R2) : rhumbBearing(R2, R3);
    } else {
      at = lerp(R2, R3, 0.6 + 0.4 * phase(w, 0, 1));
      heading = rhumbBearing(R2, R3);
    }
    const teeth = CHART_CARDINALS[0]!;
    return (
      <>
        <ChartScene from={view} highlight={n === 0 ? [N_TEETH.id, E_TEETH.id] : n === 1 ? [N_TEETH.id] : n === 2 ? [E_TEETH.id] : undefined}>
          {n === 1 && <ChartSafeSide id="cao-pass-n" mark={N_TEETH.mark.at} side="north" view={view} />}
          {n === 2 && <ChartSafeSide id="cao-pass-e" mark={E_TEETH.mark.at} side="east" view={view} />}
          {(n === 0 || n >= 3) && <ChartDanger id="cao-teeth" c={teeth} />}
          {n >= 1 && <ChartLine from={R0} to={R1} colour="#c2410c" width={1.4} dash="4 3" />}
          {n >= 2 && <ChartLine from={R1} to={R2} colour="#c2410c" width={1.4} dash="4 3" />}
          {n >= 2 && <ChartLine from={R2} to={R3} colour="#c2410c" width={1.4} dash="4 3" />}
          {n >= 3 && <ChartLine from={N_TEETH.mark.at} to={E_TEETH.mark.at} colour="#b42318" width={2.4} />}
          {n >= 3 && lightOn(LIGHTS.north.quick, secs) && <circle cx={project(N_TEETH.mark.at).x} cy={project(N_TEETH.mark.at).y} r={size * 0.3} fill="#f59e0b" opacity={0.5} />}
          <BoatGlyph at={at} heading={heading} size={size * 1.4} />
        </ChartScene>
        <Overlay>
          {n === 0 && <Tag x={1560} y={110} anchor="end" text="The Teeth: two cardinals" size={52} />}
          {n === 1 && <Tag x={1560} y={110} anchor="end" text="N cardinal: keep north" size={52} fill="#4ade80" />}
          {n === 2 && <Tag x={1560} y={110} anchor="end" text="E cardinal: pass east" size={52} fill="#4ade80" />}
          {n >= 3 && <Tag x={1560} y={110} anchor="end" text="Never cut inside" size={52} fill="#ff8a80" />}
        </Overlay>
      </>
    );
  }),
  // Sentences: 0 sits on a small danger, 1 colours and topmark, 2 Fl(2) at night, 3 either side, wide berth, 4 all over the Med.
  scene(5, (t, n, secs) => {
    if (n === 0 || n === 3) {
      return (
        <Stage>
          <SceneTitle t={t}>{n === 0 ? "Isolated danger: safe water all round" : "Either side, with a wide berth"}</SceneTitle>
          <rect x={300} y={160} width={1000} height={620} rx={20} fill="#eaf4fb" />
          {n === 3 && <circle cx={800} cy={470} r={230} fill="none" stroke={SAFE_GREEN} strokeWidth={6} strokeDasharray="18 12" />}
          <PlanRock x={800} y={470} r={70} />
          <IalaMark type="isolated-danger" x={800} y={470} scale={0.9} />
          {n === 3 && (
            <g>
              <Arrow x1={420} y1={720} x2={420} y2={240} colour={SAFE_GREEN} width={8} />
              <Arrow x1={1180} y1={720} x2={1180} y2={240} colour={SAFE_GREEN} width={8} />
            </g>
          )}
        </Stage>
      );
    }
    const night = n === 2;
    return (
      <Stage>
        <SceneTitle t={t}>Isolated danger mark</SceneTitle>
        <BigMark type="isolated-danger" night={night} glow={colourAt(MEW_LIGHT, secs)} />
        <Facts n={n >= 4 ? 3 : n} rows={[
          { k: "Colours", v: "Black, broad red band", at: 1 },
          { k: "Topmark", v: "Two black balls", at: 1 },
          { k: "Light", v: "White, groups of two", at: 2 },
        ]} />
        {night && <PatternBar pattern={MEW_LIGHT} x={740} y={600} width={600} height={30} at={secs % MEW_LIGHT.period} />}
        {n >= 4 && <Lines x={740} y={680} size={40} weight={700} fill={ART.tealBright} lines={["On rocks and shoals", "all over the Med"]} />}
      </Stage>
    );
  }),
  // Sentences: 0 stripes and ball, 1 no danger, 2 where you find it (chart), 3 the light.
  scene(6, (t, n, secs) => {
    if (n === 2) {
      return (
        <>
          <ChartScene from={viewAround(APPROACH.at, 5, 16 / 9)} highlight={[APPROACH.id]} />
          <Overlay><Tag x={40} y={110} text="Kerran Approach: start of the channel" size={48} /></Overlay>
        </>
      );
    }
    const night = n >= 3;
    return (
      <Stage>
        <SceneTitle t={t}>Safe water mark</SceneTitle>
        <BigMark type="safe-water" night={night} glow={colourAt(APPROACH_LIGHT, secs)} />
        <Facts n={n >= 1 ? 2 : 1} rows={[
          { k: "Colours", v: "Red and white stripes", at: 0 },
          { k: "Topmark", v: "One red ball", at: 0 },
          { k: "Meaning", v: "No danger: safe all round", at: 1 },
        ]} />
        {night && (
          <g>
            <text x={740} y={660} fontSize={34} fill={ART.muted}>Light: white, even rhythm</text>
            <PatternBar pattern={APPROACH_LIGHT} x={740} y={690} width={600} height={30} at={secs % APPROACH_LIGHT.period} />
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 yellow, cross, yellow light, 1 marks an area, 2 two kinds in the Med, 3 swimming areas, 4 fish farms, 5 cables and outfalls.
  scene(7, (t, n, secs) => {
    if (n === 3) {
      return (
        <Stage background="#0f2a3d">
          <SceneTitle t={t}>Swimming areas</SceneTitle>
          <SwimmingAreaFigure box={{ x: 200, y: 160, width: 1200, height: 635 }} />
        </Stage>
      );
    }
    if (n === 4) {
      return (
        <Stage background="#0f2a3d">
          <SceneTitle t={t}>Fish farms</SceneTitle>
          <FishFarmFigure box={{ x: 200, y: 160, width: 1200, height: 600 }} />
        </Stage>
      );
    }
    return (
      <Stage>
        <SceneTitle t={t}>Special marks</SceneTitle>
        <BigMark type="special" lit={colourAt(SPECIAL_LIGHT, secs) !== null} />
        {n <= 1 && (
          <Facts n={n + 1} rows={[
            { k: "Colour", v: "Yellow", at: 1 },
            { k: "Topmark (if any)", v: "Yellow cross", at: 1 },
            { k: "Meaning", v: "An area: check the chart", at: 2 },
          ]} />
        )}
        {n === 2 && <Lines x={740} y={360} size={50} weight={800} fill={ART.tealBright} lines={["In the Med:", "swimming areas", "and fish farms"]} />}
        {n >= 5 && <Lines x={740} y={340} size={46} weight={700} lines={["Also yellow:", "cables, outfalls,", "racing marks"]} />}
        {n >= 5 && <Lines x={740} y={680} size={40} weight={800} fill={ART.amber} lines={["Always check the chart"]} />}
      </Stage>
    );
  }),
  // Sentences: 0 newer than the rest, 1 stripes and cross, 2 blue and yellow light, 3 new wreck: keep clear.
  scene(8, (t, n, secs) => {
    const night = n === 2;
    const c = colourAt(ALTERNATING, secs);
    return (
      <Stage>
        <SceneTitle t={t}>Emergency wreck marking buoy</SceneTitle>
        <BigMark type="emergency-wreck" night={night} glow={c} />
        <Facts n={n} rows={[
          { k: "Colours", v: "Blue and yellow stripes", at: 1 },
          { k: "Topmark", v: "Yellow upright cross", at: 1 },
          { k: "Light", v: "Blue, then yellow", at: 2 },
        ]} />
        {night && <PatternBar pattern={ALTERNATING} x={740} y={640} width={600} height={30} at={secs % ALTERNATING.period} />}
        {n === 0 && <Lines x={740} y={680} size={40} weight={700} fill={ART.tealBright} lines={["Added to the system", "in 2006"]} />}
        {n >= 3 && <Lines x={740} y={680} size={42} weight={800} fill="#ff8a80" lines={["A new wreck:", "keep well clear"]} />}
      </Stage>
    );
  }),
  // Sentences: 0 the same in both regions, 1 by day, 2 by night, 3 two questions, 4 next lesson.
  scene(9, (t, n) => {
    if (n === 0) {
      const marks: MarkType[] = ["north", "isolated-danger", "safe-water", "special"];
      return (
        <Stage>
          <SceneTitle t={t}>The same in Region A and Region B</SceneTitle>
          {["Greece", "British Virgin Islands"].map((place, k) => (
            <g key={place}>
              <rect x={70 + k * 760} y={170} width={700} height={600} rx={20} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
              <text x={420 + k * 760} y={240} textAnchor="middle" fontSize={44} fontWeight={700} fill="#fff">{place}</text>
              <rect x={90 + k * 760} y={640} width={660} height={110} fill={SEA} />
              {marks.map((m, i) => <IalaMark key={m} type={m} x={170 + i * 165 + k * 760} y={670} scale={0.95} />)}
            </g>
          ))}
        </Stage>
      );
    }
    return (
      <Stage>
        <SceneTitle t={t}>Reading any mark</SceneTitle>
        <Card x={70} y={180} w={710} h={180} icon={Sun} title="By day" body="topmark first, then colours" titleSize={46} bodySize={36} opacity={on(n, 1)} />
        <Card x={820} y={180} w={710} h={180} icon={Moon} title="By night" body="colour of the light, then count" titleSize={46} bodySize={36} opacity={on(n, 2)} />
        <Card x={70} y={390} w={710} h={180} icon={Compass} title="What is it?" body="name the mark" titleSize={46} bodySize={36} opacity={on(n, 3)} accent="#4ade80" />
        <Card x={820} y={390} w={710} h={180} icon={MapIcon} title="What do I do?" body="pass, keep clear, check the chart" titleSize={46} bodySize={36} opacity={on(n, 3)} accent={ART.amber} />
        <text x={800} y={680} textAnchor="middle" fontSize={44} fontWeight={700} fill="#fff" opacity={on(n, 4)}>Next: lights at night</text>
      </Stage>
    );
  }),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Cardinal, danger and safe-water marks" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercise figures                                                    */
/* ------------------------------------------------------------------ */

function picture(type: MarkType) {
  return <div className="max-w-sm"><MarkPicture type={type} title={`A buoy seen from your boat: ${MARK_INFO[type].colours.toLowerCase()}, topmark ${MARK_INFO[type].topmark.toLowerCase()}`} /></div>;
}

function nightFigure(characteristic: string) {
  return <div className="max-w-md"><NightLight light={pattern(characteristic)} /></div>;
}

const TEETH_MEASURE_VIEW = viewAround(km(7.0, 4.8), 4.6, 4 / 3);
const BANK_PLOT_VIEW = viewAround(km(2.4, 5.6), 4.6, 4 / 3);
const SB_SAFE = rhumbDestination(S_BRENNAN.mark.at, 180, 0.5);
const SB_NORTH = rhumbDestination(S_BRENNAN.mark.at, 0, 0.5);
const depthText = (d: number | null) => (d === null ? "land" : `${d < 21 ? d.toFixed(1) : Math.round(d)} m`);

const NAMES = CARDINALS.map((c) => CARD[c].short);
const SIDES = CARDINALS.map((c) => `To the ${c} of it`);

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

export const QUESTIONS: Question[] = [
  {
    id: "name-from-picture",
    kind: "choice",
    prompt: "You see this buoy off a headland. What is it?",
    figure: picture("west"),
    options: NAMES,
    answer: 3,
    explain: `Look at the topmark first: two black cones point to point, like a wine glass, so a west cardinal. The colours agree: ${CARD.west.colours.toLowerCase()}, because the cones point in to the black band. Safe water lies to its west, so pass west of it.`,
  },
  {
    id: "side-from-description",
    kind: "choice",
    prompt: "A buoy is painted black above yellow, with a topmark of two black cones, both pointing up. Which side should you pass it?",
    options: SIDES,
    answer: 0,
    explain: "Both cones up, and black above yellow (the cones point to the black): a north cardinal. It stands in the north quadrant of a danger and the safe water lies to its north, so pass north of it.",
  },
  {
    id: "east-light",
    kind: "choice",
    prompt: "Which of these lights would you expect on an east cardinal mark?",
    options: [CARD.east.quick, CARD.south.quick, CARD.west.quick, "Fl(3)10s"],
    answer: 0,
    explain: `East is at 3 o'clock, so an east cardinal shows groups of three quick flashes: ${CARD.east.quick} (or ${CARD.east.veryQuick} if very quick). ${CARD.south.quick} is a south cardinal and ${CARD.west.quick} a west cardinal. Fl(3)10s also has three flashes, but ordinary ones, not quick: that is a lighthouse, such as Gull Point. Cardinal lights are always quick or very quick.`,
  },
  {
    id: "night-light",
    kind: "choice",
    prompt: "You see this white light at night. Watch it and count the flashes in a group (Restart begins a fresh group). What is it, and which side do you pass?",
    figure: nightFigure(CARD.south.veryQuick),
    options: CARDINALS.map((c) => `${CARD[c].short}: pass ${c} of it`),
    answer: 2,
    explain: `Six very quick flashes, then a long flash, every ${LIGHTS.south.veryQuick.period} seconds: ${CARD.south.veryQuick}. Six is 6 o'clock, south, and only a south cardinal has the long flash. Safe water lies to its south.`,
  },
  {
    id: "quadrant-280",
    kind: "choice",
    prompt: "A cardinal mark is charted on a true bearing of 280° from the rock it guards. Which mark is it, and where is the safe water?",
    options: CARDINALS.map((c) => `${CARD[c].short}: safe water to its ${c}`),
    answer: CARDINALS.indexOf(quadrantOf(280)),
    explain: `The quadrants are bounded by true bearings from the danger: north ${quadrantText("north")}, east ${quadrantText("east")}, south ${quadrantText("south")} and west ${quadrantText("west")}. 280° is in the west quadrant, so it is a west cardinal, and you pass west of it.`,
  },
  {
    id: "east-teeth-bearing",
    kind: "bearing",
    prompt: "To check which quadrant of The Teeth East Teeth buoy is in, measure the true bearing of the buoy FROM The Teeth: put A on The Teeth and B on the buoy.",
    figure: <PracticeChart mode="measure" zoomable view={TEETH_MEASURE_VIEW} dividers={[km(6.3, 5.6), km(6.3, 4.9)]} title="Practice chart round The Teeth, with dividers" />,
    answer: E_TEETH.bearing,
    tolerance: 3,
    suffix: "T",
    explain: `About ${formatBearing(E_TEETH.bearing, "T")}, ${cables(E_TEETH.distance)} cables from The Teeth. That is between 045° and 135°: the east quadrant. So the buoy must be an east cardinal, and its ${E_TEETH.mark.light} light agrees. Safe water lies to its east.`,
  },
  {
    id: "brennan-plot",
    kind: "plot",
    prompt: `South Brennan buoy (${S_BRENNAN.mark.light}) guards Brennan Bank on the practice chart. Tap a spot about half a mile from the buoy, on the side where the safe water is.`,
    answer: SB_SAFE,
    tolerance: 0.3,
    view: BANK_PLOT_VIEW,
    explain: `It is a south cardinal (yellow over black, cones down, six flashes and a long flash), so the safe water is to its south. Half a mile south of the buoy the charted depth is about ${depthText(depthHere(SB_SAFE))}; half a mile north of it, only ${depthText(depthHere(SB_NORTH))}, shoaling to ${BANK.least} m on the bank.`,
  },
  {
    id: "isolated-berth",
    kind: "choice",
    prompt: "Sailing between islands in Croatia, you see a beacon on a small rock: black with a broad red band and two black balls on top. What do you do?",
    figure: picture("isolated-danger"),
    options: [
      "Pass either side, giving it a wide berth",
      "Pass close: it marks the deepest water",
      "Keep it to port, like a lateral mark",
      "Pass only to the north of it",
    ],
    answer: 0,
    explain: "Two black balls mean an isolated danger mark: a small danger right beneath it, with navigable water all round. Either side is fine, but give it room, because the beacon shows where the danger is, not how far it spreads.",
  },
  {
    id: "safe-water",
    kind: "choice",
    prompt: "Ahead is a buoy with red and white vertical stripes and a single red ball on top. What does it tell you?",
    figure: picture("safe-water"),
    options: [
      "Safe water all round it: often the start of a channel or a landfall",
      "A danger right beneath it",
      "A swimming area",
      "A new wreck",
    ],
    answer: 0,
    explain: "A safe water mark: red and white vertical stripes, a red ball topmark, and an even white light such as one long flash every 10 seconds. There is no danger at the mark, and you can pass either side.",
  },
  {
    id: "swimming-area",
    kind: "choice",
    prompt: "Arriving in a bay on Mallorca, you see a line of small yellow buoys strung across the bay, parallel to the beach. What are they most likely to mark, and what do you do?",
    options: [
      "A swimming area: anchor outside the line, and take the tender in slowly by the marked lane if there is one",
      "The edge of a channel: keep them to port",
      "Mooring buoys: pick one up for the night",
      "A safe-water line: anchor right beside it",
    ],
    answer: 0,
    explain: "Yellow buoys off a beach in summer almost always mark a swimming area. Boats keep out, apart from slow boat lanes where they are marked. Local rules on distances and speeds vary, so follow the signs and the charter company's briefing.",
  },
  {
    id: "fish-farm-night",
    kind: "choice",
    prompt: "Late in the evening in a Greek bay, you see several yellow lights flashing round a dark patch of water ahead. What is it most likely to be?",
    figure: nightFigure("Fl Y 5s"),
    options: [
      "A fish farm, marked by yellow special marks: keep well clear of its pens and moorings",
      "A north cardinal: pass north of it",
      "A safe water mark: pass either side",
      "Boats at anchor showing their anchor lights",
    ],
    answer: 0,
    explain: "Yellow lights belong to special marks, and a group of them round a patch of water is very often a fish farm. Its moorings and lines spread well beyond the pens, so give it plenty of room and never anchor near it. Anchor lights on boats are white, not yellow.",
  },
  {
    id: "wreck-buoy",
    kind: "choice",
    prompt: "A buoy with blue and yellow vertical stripes and a yellow upright cross on top has appeared since your chart was printed. What does it mark?",
    figure: picture("emergency-wreck"),
    options: [
      "A new wreck, not yet on the charts: keep well clear",
      "A special area such as a swimming zone",
      "The middle of a channel",
      "A data buoy measuring the waves",
    ],
    answer: 0,
    explain: "The emergency wreck marking buoy marks a new wreck until it is charted and permanently marked. At night it flashes blue and yellow alternately. Keep well clear and listen for navigational warnings on the radio.",
  },
];

/* ------------------------------------------------------------------ */
/* Practice generator                                                  */
/* ------------------------------------------------------------------ */

type Feature = "topmark" | "colours" | "light";

function describe(c: Cardinal, f: Feature, vq: boolean): string {
  if (f === "topmark") return `a buoy whose topmark is ${CARD[c].topmark.toLowerCase()}`;
  if (f === "colours") return `a black and yellow buoy painted ${CARD[c].colours.toLowerCase()}`;
  const ch = vq ? CARD[c].veryQuick : CARD[c].quick;
  return `a light showing ${ch} (${lightWords(ch)})`;
}

function clockWhy(c: Cardinal): string {
  if (c === "north") return "no groups at all, so north, at 12 o'clock";
  return `${CARD[c].flashes} flashes, like ${CARD[c].clock} on a clock face${c === "south" ? ", plus the long flash that only the south cardinal has" : ""}`;
}

function why(c: Cardinal, f: Feature, vq: boolean): string {
  if (f === "topmark") return `${CARD[c].topmark}. Memory aid: ${CARD[c].aid}`;
  if (f === "colours") return `${CARD[c].colours}: the cones point to the black, ${CARD[c].black}.`;
  const ch = vq ? CARD[c].veryQuick : CARD[c].quick;
  return `${ch} is ${lightWords(ch)}: ${clockWhy(c)}.`;
}

/** Name a cardinal from a picture, a night light, or a description. */
function identifyQuestion(rng: Rng, i: number): Question {
  const c = pick(rng, CARDINALS);
  const form = randInt(rng, 0, 4);
  const vq = rng() < 0.5;
  if (form === 0) {
    return { id: `p${i}-picture-${c}`, kind: "choice", prompt: "You see this buoy. What is it?", figure: picture(c), options: NAMES, answer: CARDINALS.indexOf(c), explain: `${why(c, "topmark", vq)} ${why(c, "colours", vq)} ${capital(CARD[c].aName)} mark: pass ${c} of it.` };
  }
  if (form === 1) {
    const ch = vq ? CARD[c].veryQuick : CARD[c].quick;
    return { id: `p${i}-night-${c}-${vq ? "vq" : "q"}`, kind: "choice", prompt: "You see this white light at night. Count the flashes in a group. What is it?", figure: nightFigure(ch), options: NAMES, answer: CARDINALS.indexOf(c), explain: `${capital(lightWords(ch))} (${ch}): ${clockWhy(c)}. It is ${CARD[c].aName} mark.` };
  }
  const f: Feature = form === 2 ? "topmark" : form === 3 ? "colours" : "light";
  return { id: `p${i}-desc-${f}-${c}-${vq ? "vq" : "q"}`, kind: "choice", prompt: `You see ${describe(c, f, vq)}. Which mark is it?`, options: NAMES, answer: CARDINALS.indexOf(c), explain: `${why(c, f, vq)} That is ${CARD[c].aName} mark.` };
}

/** Which side to pass, from a description. */
function sideQuestion(rng: Rng, i: number): Question {
  const c = pick(rng, CARDINALS);
  const f = pick(rng, ["topmark", "colours", "light"] as Feature[]);
  const vq = rng() < 0.5;
  return {
    id: `p${i}-side-${f}-${c}`,
    kind: "choice",
    prompt: `Ahead you see ${describe(c, f, vq)}. Which side should you pass it?`,
    options: SIDES,
    answer: CARDINALS.indexOf(c),
    explain: `${why(c, f, vq)} So it is ${CARD[c].aName} mark: it stands in the ${c} quadrant of the danger, and the safe water lies to its ${c}. Pass ${c} of it.`,
  };
}

/** The quadrant from a bearing. */
function quadrantQuestion(rng: Rng, i: number): Question {
  let b = randInt(rng, 0, 359);
  while ([45, 135, 225, 315].some((x) => Math.abs(((b - x + 540) % 360) - 180) < 5)) b = (b + 7) % 360;
  const c = quadrantOf(b);
  return {
    id: `p${i}-quadrant-${b}`,
    kind: "choice",
    prompt: `A cardinal mark is charted ${formatBearing(b, "T")} from the danger it guards. Which mark is it?`,
    options: CARDINALS.map((x) => `${CARD[x].short}: safe water to its ${x}`),
    answer: CARDINALS.indexOf(c),
    explain: `${formatBearing(b, "T")} lies between ${formatBearing(CARD[c].quadrant[0])} and ${formatBearing(CARD[c].quadrant[1], "T")}: the ${c} quadrant. A mark there is ${CARD[c].aName}, with the safe water to its ${c}.`,
  };
}

const dangerLies = (c: ChartCardinal) => (c.kind === "bank" ? `${c.dangerName}'s shallowest point (${BANK.least} m) lies` : `${c.dangerName} ${c.lies}`);

/** The practice chart's cardinals. */
function chartQuestion(rng: Rng, i: number): Question {
  const c = pick(rng, CHART_CARDINALS);
  if (rng() < 0.5) {
    const safe = rhumbDestination(c.mark.at, CARD[c.type].dir, 0.5);
    const mid = { lat: (c.danger.lat + c.mark.at.lat) / 2, lon: (c.danger.lon + c.mark.at.lon) / 2 };
    return {
      id: `p${i}-chart-plot-${c.id}`,
      kind: "plot",
      prompt: `${c.name} (${c.mark.light}) guards ${c.dangerName}. Tap a spot about half a mile from the buoy, on the side where the safe water is.`,
      answer: safe,
      tolerance: 0.3,
      view: viewAround(mid, 4.6, 4 / 3),
      explain: `${c.mark.light} is ${CARD[c.type].aName} light. The safe water is to its ${c.type}: the spot is about ${formatBearing(CARD[c.type].dir, "T")} from the buoy, half a mile off. ${dangerLies(c)} ${formatBearing(reciprocal(c.bearing), "T")} from the buoy, ${miles(c.distance)} miles away.`,
    };
  }
  const towards = quadrantOf(reciprocal(c.bearing));
  return {
    id: `p${i}-chart-where-${c.id}`,
    kind: "choice",
    prompt: `${c.name} shows ${c.mark.light}. Roughly which way from the buoy ${c.lies === "lie" ? "do" : "does"} ${c.dangerName} lie?`,
    options: CARDINALS.map((x) => `To its ${x}`),
    answer: CARDINALS.indexOf(towards),
    explain: `${c.mark.light} is ${CARD[c.type].aName}: it stands in the ${c.type} quadrant of the danger, with safe water to its ${c.type}. So the danger is on the other side: ${dangerLies(c)} ${formatBearing(reciprocal(c.bearing), "T")} from the buoy, ${miles(c.distance)} miles away. Keep the buoy between you and the danger.`,
  };
}

const OTHERS: OtherMark[] = ["isolated-danger", "safe-water", "special", "emergency-wreck"];

/** Isolated danger, safe water, special or wreck: what do you do? From a picture or a light. */
function otherMarkQuestion(rng: Rng, i: number): Question {
  const type = pick(rng, OTHERS);
  const night = rng() < 0.4;
  const p = pick(rng, MARK_LIGHTS[type]);
  const actions = actionChoices(rng, type);
  const right = MARK_ACTION[type].key;
  return {
    id: `p${i}-other-${type}-${night ? p.text.replace(/\W+/g, "") : "day"}`,
    kind: "choice",
    prompt: night ? "At night you see this light on a mark ahead. What do you do?" : "You see this mark ahead. What do you do?",
    figure: night
      ? <div className="max-w-md"><NightLight light={p} /></div>
      : picture(type),
    options: actions.map((a) => ACTION_TEXT[a]),
    answer: actions.indexOf(right),
    fixedOrder: true,
    explain: `${MARK_INFO[type].name}${night ? ` (${p.describe})` : ""}. ${MARK_ACTION[type].why}`,
  };
}

export const PRACTICE: PracticeGenerator = {
  title: "Marks practice",
  description: "Six fresh questions each time: name a cardinal by day or night, choose the side to pass, a quadrant bearing, the practice chart's cardinals, and what to do at an isolated danger, safe water, special or wreck mark.",
  generate: (rng) => shuffle(rng, [identifyQuestion(rng, 0), sideQuestion(rng, 1), quadrantQuestion(rng, 2), chartQuestion(rng, 3), otherMarkQuestion(rng, 4), otherMarkQuestion(rng, 5)]),
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}
