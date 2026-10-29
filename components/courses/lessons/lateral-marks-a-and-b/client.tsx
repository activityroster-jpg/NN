"use client";

import { formatPosition } from "@/lib/courses/geo";
import { lerpView, viewAround } from "@/lib/courses/navigation/chart-geometry";
import { lightOn, parseLight } from "@/lib/courses/navigation/lights";
import { km } from "@/lib/courses/navigation/practice-chart";
import { choices, pick, type Rng } from "@/lib/courses/random";
import { ExerciseSet, type PracticeGenerator, type Question } from "../../Exercises";
import LessonPlayer, { SceneTitle, Stage, fade, phase, splitSentences, type Scene } from "../../LessonPlayer";
import LightSim from "../../LightSim";
import { IalaMark, LightGlow, RhythmBar, type MarkType } from "../../marks";
import { CHART_COLOURS, ChartHighlight, ChartLine } from "../../PracticeChart";
import { ART, ChartScene, Lines, Yacht } from "../../scene-art";
import { Arrow, BoatGlyph, LateralMark, Overlay, PlanMark, RED, SilhouetteFilter, Tag } from "./art";
import {
  APPROACH, BUOYS, CHANNEL_LON_W, CHARTER_AREAS, KERRAN_IDS, LATERAL_TYPES, MEANING, REGION_B_PLACES, SHORT_NAME, coloursText, hueWord,
  isCan, mainHue, nthKeptTo, onChannel, opposite, pcLight, shapeWord, sideColour, sideToKeep, topmarkText,
  type Dir, type KerranId, type LateralType, type Region, type Side,
} from "./data";
import { lateralMarksAAndB as SCRIPT } from "./script";
import { MarkView } from "./widgets";

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

const SEA = "#123a5a";
const MUTED = ART.muted;
const RED_TEXT = "#ff8a80";
const GREEN_TEXT = "#5ee08f";
const hueText = (side: Side, region: Region) => (sideColour(side, region) === "R" ? RED_TEXT : GREEN_TEXT);

/** A rounded panel on the stage with a heading. */
function Panel({ x, y, w, h, title, opacity = 1 }: { x: number; y: number; w: number; h: number; title?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={20} fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
      {title && <text x={x + w / 2} y={y + 58} textAnchor="middle" fontSize={44} fontWeight={700} fill="#fff">{title}</text>}
    </g>
  );
}

/** Head-up plan of a two-pair channel, going in or coming out, in either region. */
function HeadUpChannel({ x, dir, region, glowRed }: { x: number; dir: Dir; region: Region; glowRed: boolean }) {
  // Going in, the port-hand marks are on the left; coming out, on the right.
  const leftType: Side = dir === "in" ? "port" : "starboard";
  const cols = [x - 150, x + 150];
  return (
    <g>
      <rect x={x - 230} y={300} width={460} height={430} rx={14} fill="rgba(43,179,192,0.08)" />
      {[400, 560].map((yy) => (
        <g key={yy}>
          {cols.map((cx, ci) => {
            const type: Side = ci === 0 ? leftType : opposite(leftType);
            const red = sideColour(type, region) === "R";
            return (
              <g key={ci}>
                {red && glowRed && <circle cx={cx} cy={yy - 18} r={44} fill={RED} opacity={0.3} />}
                <PlanMark type={type} region={region} x={cx} y={yy} size={38} />
              </g>
            );
          })}
        </g>
      ))}
      <Arrow x1={x} y1={560} x2={x} y2={330} colour={ART.tealBright} width={7} dash="14 10" />
      <Yacht x={x} y={660} heading={0} scale={0.9} sidelights />
    </g>
  );
}

/** One region's pair of lateral marks with captions, going in (scenes 2, 7, 9). */
function GoingIn({ region, label = true }: { region: Region; label?: boolean }) {
  return (
    <g>
      <rect y={690} width={1600} height={210} fill={SEA} />
      <LateralMark type="port" region={region} x={360} y={700} scale={1.7} />
      <LateralMark type="starboard" region={region} x={1240} y={700} scale={1.7} />
      {label && (
        <>
          <Lines x={360} y={250} anchor="middle" size={50} weight={800} fill={hueText("port", region)} lines={[`${hueWord(sideColour("port", region)) === "red" ? "Red" : "Green"} can`, "to port"]} />
          <Lines x={1240} y={250} anchor="middle" size={50} weight={800} fill={hueText("starboard", region)} lines={[`${hueWord(sideColour("starboard", region)) === "red" ? "Red" : "Green"} cone`, "to starboard"]} />
        </>
      )}
      <Arrow x1={800} y1={690} x2={800} y2={300} colour={ART.tealBright} width={12} />
      <text x={830} y={560} fontSize={38} fontWeight={700} fill={ART.tealBright}>Going in</text>
    </g>
  );
}

/** A fork in a channel, seen head-up with the direction of buoyage up the page (scene 6). */
function ChannelFork({ preferred, type }: { preferred: "left" | "right" | null; type: LateralType | null }) {
  const fx = 420;
  const fy = 480;
  const lane = (side: "left" | "right") => (preferred === side ? 120 : preferred ? 54 : 80);
  const markY = 420;
  return (
    <g>
      <g opacity={0.28} stroke={ART.tealBright} fill="none">
        <path d={`M${fx} 760 L${fx} ${fy}`} strokeWidth={130} />
        <path d={`M${fx} ${fy + 40} Q ${fx - 40} ${fy - 120} 190 230`} strokeWidth={lane("left")} />
        <path d={`M${fx} ${fy + 40} Q ${fx + 40} ${fy - 120} 650 230`} strokeWidth={lane("right")} />
      </g>
      {preferred && (
        <g>
          <text x={preferred === "left" ? 150 : 690} y={205} textAnchor="middle" fontSize={36} fontWeight={700} fill={ART.tealBright}>Preferred</text>
          <text x={preferred === "left" ? 690 : 150} y={205} textAnchor="middle" fontSize={32} fill={MUTED}>Secondary</text>
          <path
            d={preferred === "right" ? `M${fx + 4} 740 L${fx + 4} ${fy + 60} Q ${fx + 60} ${fy - 90} 620 270` : `M${fx - 4} 740 L${fx - 4} ${fy + 60} Q ${fx - 60} ${fy - 90} 220 270`}
            stroke="#fff" strokeWidth={5} strokeDasharray="12 12" fill="none"
          />
        </g>
      )}
      {type ? <PlanMark type={type} region="A" x={fx} y={markY} size={44} /> : <circle cx={fx} cy={markY - 20} r={22} fill="#64748b" stroke="#fff" strokeWidth={2.5} />}
      <text x={60} y={720} fontSize={32} fill={MUTED}>↑ Direction of buoyage</text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Scene data                                                          */
/* ------------------------------------------------------------------ */

/** Just west of the leading line, so direction arrows do not hide its printed label. */
const beside = (latMin: number) => km(latMin, CHANNEL_LON_W + 0.15);
// Framed so the boat and buoys stay clear of the captions over the bottom of the picture.
const WIDE = viewAround(onChannel(3.45), 7.4, 16 / 9);
const CLOSE = viewAround(onChannel(3.95), 3.8, 16 / 9);
const S3 = spans(3);
const S5 = spans(5);

/** Where each Port Kerran buoy's light sits in the night scene (looking north up the channel). */
const NIGHT_POS: Record<KerranId, { x: number; y: number; r: number; label: "below" | "above"; offset: number }> = {
  // Real buoys are not synchronised: each light starts its cycle at a different moment.
  no2: { x: 400, y: 560, r: 20, label: "below", offset: 1.3 },
  no1: { x: 1200, y: 560, r: 20, label: "below", offset: 0 },
  no4: { x: 600, y: 452, r: 12, label: "above", offset: 3.7 },
  no3: { x: 1000, y: 452, r: 12, label: "above", offset: 2.4 },
};
const KERRAN_LIGHTS = Object.fromEntries(KERRAN_IDS.map((id) => [id, parseLight(BUOYS[id].light)])) as Record<KerranId, ReturnType<typeof parseLight>>;

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

export const SCENES: Scene[] = [
  // Sentences: 0 road signs, 1 what they do, 2 one scheme, 3 two regions.
  scene(0, (t, n) => {
    const marks: MarkType[] = ["port", "starboard", "north", "safe-water", "special"];
    return (
      <Stage>
        <SceneTitle t={t}>{n < 2 ? "Signposts at sea" : "One system, two regions"}</SceneTitle>
        {n < 2 ? (
          <g>
            <rect y={600} width={1600} height={300} fill={SEA} />
            {marks.map((m, i) => (
              <g key={m} opacity={fade(t, 0.02 + i * 0.03, 0.08 + i * 0.03)}>
                <IalaMark type={m} x={240 + i * 280} y={640} scale={1.05} />
              </g>
            ))}
            {n === 1 && <text x={800} y={250} textAnchor="middle" fontSize={56} fontWeight={700} fill={ART.tealBright}>Channels · Dangers · Harbours</text>}
          </g>
        ) : (
          <g>
            <text x={800} y={185} textAnchor="middle" fontSize={40} fill={MUTED}>The IALA Maritime Buoyage System</text>
            {(["A", "B"] as Region[]).map((r, i) => (
              <g key={r} opacity={n >= 3 ? 1 : 0.35}>
                <rect x={90 + i * 740} y={230} width={680} height={520} rx={22} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" strokeWidth={2.5} />
                <text x={430 + i * 740} y={315} textAnchor="middle" fontSize={64} fontWeight={800} fill="#fff">Region {r}</text>
                <rect x={130 + i * 740} y={690} width={600} height={40} fill={SEA} />
                <LateralMark type="port" region={r} x={300 + i * 740} y={700} scale={1.15} />
                <LateralMark type="starboard" region={r} x={560 + i * 740} y={700} scale={1.15} />
                <text x={430 + i * 740} y={385} textAnchor="middle" fontSize={40} fill={r === "A" ? RED_TEXT : GREEN_TEXT} fontWeight={700}>
                  {r === "A" ? "Red to port" : "Green to port"}
                </text>
              </g>
            ))}
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 lateral = sides, 1 which way? 2 from seaward, 3 magenta arrow.
  scene(1, (t, n) => {
    const w1 = within(spans(1), 1, t);
    const arrowTop = n === 1 ? 740 - 520 * phase(w1, 0.1, 0.7) : 220;
    return (
      <Stage>
        <SceneTitle t={t}>{n === 0 ? "Lateral marks" : "The direction of buoyage"}</SceneTitle>
        <polygon points="60,165 335,165 342,300 300,345 60,352" fill="#c9b98f" />
        <polygon points="485,165 760,165 760,350 525,340 478,300" fill="#c9b98f" />
        <text x={500} y={250} fontSize={34} fontWeight={700} fill="#3b3a36" opacity={on(n, 2)}>← Harbour</text>
        {[420, 560, 700].map((yy) => (
          <g key={yy}>
            <PlanMark type="port" region="A" x={330} y={yy} size={34} />
            <PlanMark type="starboard" region="A" x={490} y={yy} size={34} />
          </g>
        ))}
        {n === 0 && (
          <g>
            <text x={250} y={530} textAnchor="end" fontSize={40} fontWeight={700} fill={RED_TEXT}>Port</text>
            <text x={570} y={530} fontSize={40} fontWeight={700} fill={GREEN_TEXT}>Starboard</text>
          </g>
        )}
        {n >= 1 && <Arrow x1={410} y1={740} x2={410} y2={arrowTop} colour={ART.tealBright} width={12} />}
        {n >= 1 && <Lines x={560} y={470} lines={["Direction", "of buoyage"]} size={40} weight={800} fill={ART.tealBright} />}
        {n >= 2 && <text x={250} y={745} textAnchor="end" fontSize={36} fill={MUTED}>From seaward</text>}
        <g opacity={n >= 3 ? 1 : 0}>
          <Lines x={1190} y={300} anchor="middle" size={42} weight={700} lines={["Along open coasts:", "set by the authorities"]} />
          <g transform="translate(1060 520)">
            <path d="M0 -20 H120 V-46 L180 0 L120 46 V20 H0 Z" fill="none" stroke={CHART_COLOURS.magenta} strokeWidth={6} strokeLinejoin="round" />
          </g>
          <text x={1190} y={640} textAnchor="middle" fontSize={38} fill="#fff">On the chart: a magenta arrow</text>
        </g>
      </Stage>
    );
  }),
  // Sentences: 0 Region A areas, 1 port side red, 2 can and topmark, 3 starboard green cone, 4 summary.
  scene(2, (t, n, secs) => {
    if (n === 0) {
      return (
        <Stage>
          <SceneTitle t={t}>Region A</SceneTitle>
          <Lines x={800} y={330} anchor="middle" size={58} weight={800} fill={ART.tealBright} lines={["Every Mediterranean charter area"]} />
          <Lines x={800} y={440} anchor="middle" size={46} lines={["Croatia · Greece · Italy · Spain · France", "Montenegro · Turkey", "The Seychelles · Thailand"]} />
        </Stage>
      );
    }
    if (n >= 4) {
      return (
        <Stage>
          <SceneTitle t={t}>Region A, going in</SceneTitle>
          <GoingIn region="A" />
        </Stage>
      );
    }
    const type: Side = n <= 2 ? "port" : "starboard";
    const lit = lightOn(parseLight(type === "port" ? "Fl R 5s" : "Fl G 5s"), secs);
    const rows = type === "port"
      ? [{ k: "Side", v: "Port, going in", at: 1 }, { k: "Colour", v: "Red", at: 1 }, { k: "Shape", v: "Can, flat top", at: 2 }, { k: "Topmark", v: "Red can", at: 2 }]
      : [{ k: "Side", v: "Starboard, going in", at: 3 }, { k: "Colour", v: "Green", at: 3 }, { k: "Shape", v: "Cone, pointed", at: 3 }, { k: "Topmark", v: "Green cone, point up", at: 3 }];
    return (
      <Stage>
        <SceneTitle t={t}>{type === "port" ? "Port-hand mark" : "Starboard-hand mark"}</SceneTitle>
        <rect y={690} width={1600} height={210} fill={SEA} />
        <LateralMark type={type} region="A" x={430} y={700} scale={2} lit={lit} />
        {rows.map((r, idx) => (
          <g key={r.k} opacity={n >= r.at ? 1 : 0.18}>
            <text x={860} y={245 + idx * 120} fontSize={36} fill={MUTED}>{r.k}</text>
            <text x={860} y={300 + idx * 120} fontSize={50} fontWeight={800} fill={type === "port" ? RED_TEXT : GREEN_TEXT}>{r.v}</text>
          </g>
        ))}
      </Stage>
    );
  }),
  // Sentences: 0 the chart, 1 with the buoyage, 2 green No 1 and 3, 3 red No 2 and 4, 4 keep between, no corners.
  scene(3, (t, n) => {
    const w = within(S3, n, t);
    const view = n <= 1 ? WIDE : n === 2 ? lerpView(WIDE, CLOSE, phase(w, 0, 0.35)) : CLOSE;
    const boatAt = n <= 1 ? onChannel(2.55) : n < 4 ? onChannel(3.45) : onChannel(3.45 + 1.35 * phase(w, 0.05, 0.95));
    const zoom = n <= 1 ? 0 : n === 2 ? phase(w, 0, 0.35) : 1;
    const ring = 8 - 3 * zoom;
    const hot: KerranId[] = n === 2 ? ["no1", "no3"] : n === 3 ? ["no2", "no4"] : [];
    return (
      <>
        <ChartScene from={view}>
          {n >= 1 && <ChartLine from={beside(2.5)} to={beside(5.0)} colour={CHART_COLOURS.plot} width={3 - zoom} arrow progress={n === 1 ? phase(w, 0.1, 0.8) : 1} />}
          {n === 0 && <ChartHighlight at={APPROACH.at} r={8} />}
          {hot.map((id) => <ChartHighlight key={id} at={BUOYS[id].at} r={ring} colour={BUOYS[id].type === "port" ? "#b42318" : "#15803d"} />)}
          {n >= 1 && <BoatGlyph at={boatAt} heading={0} size={12 - 3 * zoom} />}
        </ChartScene>
        <Overlay>
          {n === 0 && <Tag x={40} y={110} text="Port Kerran: practice chart, Region A" size={48} />}
          {n === 1 && <Tag x={40} y={110} text="↑ Direction of buoyage" size={52} fill={ART.tealBright} />}
          {n === 2 && <Tag x={40} y={110} text="No 1 · No 3: green cones" size={52} fill={GREEN_TEXT} />}
          {n === 3 && <Tag x={40} y={110} text="No 2 · No 4: red cans" size={52} fill={RED_TEXT} />}
          {n === 4 && <Tag x={40} y={110} text="Keep between them" size={52} fill={ART.tealBright} />}
        </Overlay>
      </>
    );
  }),
  // Sentences: 0 light colour = mark colour, 1 red port, green starboard, 2 rhythm: No 1 and No 3, 3 count, time, check.
  scene(4, (t, n, secs) => {
    const labelled: KerranId[] = n === 2 ? ["no1", "no3"] : n >= 3 ? ["no1", "no2", "no3", "no4"] : [];
    const sub = n === 0 ? "Light colour = mark colour" : n === 1 ? "Region A: red = port · green = starboard" : n === 2 ? "The rhythm says which buoy" : "Count · time · check the chart";
    return (
      <Stage background="#040b16">
        <SceneTitle t={t}>At night: only the lights</SceneTitle>
        <text x={800} y={200} textAnchor="middle" fontSize={46} fontWeight={700} fill={ART.tealBright}>{sub}</text>
        <path d="M0 402 L180 392 L330 370 L520 384 L700 360 L860 372 L1010 352 L1180 380 L1400 368 L1600 390 V402 Z" fill="#0a1626" />
        <rect y={402} width={1600} height={498} fill="#061220" />
        {(Object.keys(NIGHT_POS) as KerranId[]).map((id) => {
          const p = NIGHT_POS[id];
          const light = KERRAN_LIGHTS[id];
          const at = secs + p.offset;
          const lit = lightOn(light, at);
          const show = labelled.includes(id);
          const colour = light.colour === "R" ? RED_TEXT : GREEN_TEXT;
          const ly = p.label === "below" ? p.y + 80 : p.y - 70;
          const by = p.label === "below" ? p.y + 102 : p.y - 150;
          return (
            <g key={id}>
              {lit && <ellipse cx={p.x} cy={p.y + p.r * 3} rx={p.r * 0.5} ry={p.r * 2.2} fill={colour} opacity={0.22} />}
              <LightGlow x={p.x} y={p.y} on={lit} colour={light.colour} r={p.r} />
              {show && (
                <g>
                  <text x={p.x} y={ly} textAnchor="middle" fontSize={40} fontWeight={800} fill={colour}>{`${BUOYS[id].name}  ${BUOYS[id].light}`}</text>
                  <RhythmBar light={light} x={p.x - 130} y={by} width={260} height={24} at={at % light.period} />
                </g>
              )}
            </g>
          );
        })}
        {n <= 1 && (
          <g>
            <text x={400} y={665} textAnchor="middle" fontSize={40} fontWeight={700} fill={RED_TEXT}>Port side</text>
            <text x={1200} y={665} textAnchor="middle" fontSize={40} fontWeight={700} fill={GREEN_TEXT}>Starboard side</text>
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 against the buoyage (chart), 1 red now to starboard, 2 you turned round, 3 going out, red to starboard.
  scene(5, (t, n) => {
    if (n === 0) {
      const w = within(S5, 0, t);
      return (
        <>
          <ChartScene from={CLOSE}>
            <ChartLine from={beside(4.9)} to={beside(3.35)} colour={CHART_COLOURS.plot} width={2} arrow progress={phase(w, 0.05, 0.6)} />
            <BoatGlyph at={onChannel(4.85 - 1.4 * phase(w, 0.05, 0.95))} heading={180} size={9} />
          </ChartScene>
          <Overlay>
            <Tag x={40} y={110} text="Leaving: against the buoyage" size={52} />
          </Overlay>
        </>
      );
    }
    return (
      <Stage>
        <SceneTitle t={t}>{n >= 3 ? "Going out: red to starboard" : n === 2 ? "Same marks: you turned round" : "Leaving harbour"}</SceneTitle>
        <Panel x={70} y={170} w={700} h={590} title="Going in" opacity={n === 2 ? 1 : 0.75} />
        <Panel x={830} y={170} w={700} h={590} title="Coming out" />
        <text x={420} y={282} textAnchor="middle" fontSize={34} fill={MUTED}>With the buoyage</text>
        <text x={1180} y={282} textAnchor="middle" fontSize={34} fill={MUTED}>Against the buoyage</text>
        <HeadUpChannel x={420} dir="in" region="A" glowRed={false} />
        <HeadUpChannel x={1180} dir="out" region="A" glowRed={n === 1 || n >= 3} />
        <text x={420} y={745} textAnchor="middle" fontSize={40} fontWeight={800} fill={RED_TEXT}>Red to port</text>
        <text x={1180} y={745} textAnchor="middle" fontSize={40} fontWeight={800} fill={RED_TEXT}>Red to starboard</text>
      </Stage>
    );
  }),
  // Sentences: 0 where a channel divides, 1 read main colour and shape, 2 red can with green band, 3 lights Fl(2+1).
  scene(6, (t, n, secs) => (
    <Stage>
      <SceneTitle t={t}>Preferred channel marks</SceneTitle>
      {n <= 1 && <ChannelFork preferred={null} type={null} />}
      {n === 2 && <ChannelFork preferred="right" type="preferred-channel-to-starboard" />}
      {n === 3 && <ChannelFork preferred="right" type="preferred-channel-to-starboard" />}
      {n === 0 && <Lines x={1180} y={380} anchor="middle" size={52} weight={800} lines={["Where the", "channel divides,", "which way?"]} />}
      {n === 1 && (
        <g>
          <rect x={760} y={690} width={840} height={210} fill={SEA} />
          <LateralMark type="preferred-channel-to-starboard" region="A" x={990} y={700} scale={1.3} />
          <LateralMark type="preferred-channel-to-port" region="A" x={1370} y={700} scale={1.3} />
          <Lines x={990} y={250} anchor="middle" size={38} weight={700} fill={RED_TEXT} lines={["Mainly red can:", "treat as port-hand"]} />
          <Lines x={1370} y={250} anchor="middle" size={38} weight={700} fill={GREEN_TEXT} lines={["Mainly green cone:", "treat as starboard-hand"]} />
        </g>
      )}
      {n === 2 && (
        <g>
          <Lines x={1180} y={215} anchor="middle" size={46} weight={800} fill={ART.tealBright} lines={["Preferred channel", "to starboard"]} />
          <rect x={760} y={690} width={840} height={210} fill={SEA} />
          <LateralMark type="preferred-channel-to-starboard" region="A" x={1180} y={700} scale={1.55} />
          <Lines x={1450} y={430} anchor="middle" size={36} fill={MUTED} lines={["Keep it", "to port"]} />
        </g>
      )}
      {n >= 3 && (
        <g>
          <rect x={760} y={690} width={840} height={210} fill={SEA} />
          <text x={1180} y={230} textAnchor="middle" fontSize={46} fontWeight={800} fill={ART.tealBright}>Fl(2+1): two, then one</text>
          {(["preferred-channel-to-starboard", "preferred-channel-to-port"] as const).map((pc, i) => {
            const light = pcLight(pc, "A");
            const x = 990 + i * 380;
            return (
              <g key={pc}>
                <LateralMark type={pc} region="A" x={x} y={600} scale={1.15} lit={lightOn(light, secs + i * 1.7)} />
                <RhythmBar light={light} x={x - 150} y={650} width={300} height={24} at={(secs + i * 1.7) % light.period} />
                <text x={x} y={725} textAnchor="middle" fontSize={36} fontWeight={700} fill="#fff">{light.text}</text>
              </g>
            );
          })}
        </g>
      )}
    </Stage>
  )),
  // Sentences: 0 cross the Atlantic, 1 Region B places, 2 colours swap (channel), 3 red right returning, 4 shapes do not swap, 5 the BVI.
  scene(7, (t, n) => {
    if (n <= 1) {
      return (
        <Stage>
          <SceneTitle t={t}>Region B</SceneTitle>
          <Lines x={800} y={330} anchor="middle" size={64} weight={800} fill={ART.tealBright} lines={["Across the Atlantic"]} />
          <g opacity={on(n, 1)}>
            <Lines x={800} y={450} anchor="middle" size={46} lines={["The Americas · the Caribbean", "The British Virgin Islands", "Japan · South Korea · the Philippines"]} />
          </g>
        </Stage>
      );
    }
    if (n === 2) {
      return (
        <Stage>
          <SceneTitle t={t}>Region B: the colours swap</SceneTitle>
          <Panel x={70} y={170} w={700} h={590} title="Region A" opacity={0.75} />
          <Panel x={830} y={170} w={700} h={590} title="Region B" />
          <HeadUpChannel x={420} dir="in" region="A" glowRed={false} />
          <HeadUpChannel x={1180} dir="in" region="B" glowRed />
          <text x={420} y={745} textAnchor="middle" fontSize={40} fontWeight={800} fill={RED_TEXT}>Red to port</text>
          <text x={1180} y={745} textAnchor="middle" fontSize={40} fontWeight={800} fill={RED_TEXT}>Red to starboard</text>
        </Stage>
      );
    }
    if (n === 3) {
      return (
        <Stage>
          <SceneTitle t={t}>Red right returning</SceneTitle>
          <Lines x={800} y={380} anchor="middle" size={110} weight={800} fill={RED_TEXT} lines={["Red · Right · Returning"]} />
          <Lines x={800} y={540} anchor="middle" size={46} lines={["Red on your right as you return from the sea"]} fill="#fff" />
        </Stage>
      );
    }
    return (
      <Stage>
        <SceneTitle t={t}>{n === 4 ? "The shapes do not swap" : "In the British Virgin Islands"}</SceneTitle>
        <GoingIn region="B" />
        {n === 4 && (
          <g>
            <Tag x={360} y={560} anchor="middle" text="Can: port" size={44} />
            <Tag x={1240} y={560} anchor="middle" text="Cone: starboard" size={44} />
          </g>
        )}
      </Stage>
    );
  }),
  // Sentences: 0 check your region, 1 Region A Med list, 2 Seychelles and Thailand, 3 BVI is B, 4 the other marks are the same.
  scene(8, (t, n) => {
    if (n >= 4) {
      const others: MarkType[] = ["north", "east", "isolated-danger", "safe-water", "special"];
      return (
        <Stage>
          <SceneTitle t={t}>The same in both regions</SceneTitle>
          <rect y={640} width={1600} height={260} fill={SEA} />
          {others.map((m, i) => <IalaMark key={m} type={m} x={240 + i * 280} y={680} scale={1.05} />)}
          <Lines x={800} y={250} anchor="middle" size={46} weight={700} fill={ART.tealBright} lines={["Cardinal · isolated danger · safe water · special"]} />
        </Stage>
      );
    }
    const a = CHARTER_AREAS.filter((x) => x.region === "A");
    return (
      <Stage>
        <SceneTitle t={t}>Which region is your charter in?</SceneTitle>
        <Panel x={70} y={170} w={940} h={620} title="Region A: red to port" opacity={n >= 1 ? 1 : 0.35} />
        <Panel x={1050} y={170} w={480} h={620} title="Region B" opacity={n >= 3 ? 1 : 0.35} />
        <g opacity={on(n, 1)}>
          {a.slice(0, 9).map((x, i) => (
            <text key={x.id} x={120} y={300 + i * 52} fontSize={36} fill="#fff">{x.name}</text>
          ))}
        </g>
        <g opacity={on(n, 2)}>
          {a.slice(9).map((x, i) => (
            <text key={x.id} x={600} y={300 + i * 52} fontSize={36} fontWeight={700} fill={ART.tealBright}>{x.name}</text>
          ))}
        </g>
        <g opacity={on(n, 3)}>
          <Lines x={1290} y={320} anchor="middle" size={38} lines={["The British", "Virgin Islands", "and the Caribbean"]} />
          <Lines x={1290} y={560} anchor="middle" size={40} weight={800} fill={RED_TEXT} lines={["Red to", "starboard"]} />
        </g>
      </Stage>
    );
  }),
  // Sentences: 0 into the sun shapes show, 1 the order: direction, shape, colour, 2 A vs B summary, 3 next lesson.
  scene(9, (t, n) => {
    if (n === 0) {
      return (
        <Stage>
          <defs>
            <linearGradient id="lmab-sunset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f19a3e" />
              <stop offset="0.75" stopColor="#ffdf9e" />
            </linearGradient>
            <SilhouetteFilter id="lmab-scene-sil" />
          </defs>
          <rect width={1600} height={900} fill="url(#lmab-sunset)" />
          <circle cx={800} cy={420} r={190} fill="#fff6d8" opacity={0.45} />
          <circle cx={800} cy={420} r={95} fill="#fffdf2" />
          <rect y={690} width={1600} height={210} fill="#8a6a45" />
          <text x={800} y={110} textAnchor="middle" fontSize={58} fontWeight={800} fill="#3b2410">Into a low sun</text>
          <g filter="url(#lmab-scene-sil)">
            <LateralMark type="port" region="A" x={420} y={700} scale={1.7} />
            <LateralMark type="starboard" region="A" x={1180} y={700} scale={1.7} />
          </g>
          <g opacity={fade(within(spans(9), 0, t), 0.4, 0.55)}>
            <Tag x={420} y={250} anchor="middle" text="Can = port" size={50} />
            <Tag x={1180} y={250} anchor="middle" text="Cone = starboard" size={50} />
          </g>
        </Stage>
      );
    }
    if (n === 1) {
      return (
        <Stage>
          <SceneTitle t={t}>Reading a lateral mark</SceneTitle>
          {["1. Direction of buoyage", "2. Shape", "3. Colour"].map((s, i) => (
            <g key={s} transform={`translate(400 ${260 + i * 140})`}>
              <rect width={800} height={100} rx={18} fill="rgba(255,255,255,0.06)" />
              <text x={50} y={66} fontSize={50} fontWeight={700} fill="#fff">{s}</text>
            </g>
          ))}
        </Stage>
      );
    }
    return (
      <Stage>
        <SceneTitle t={t}>Going in</SceneTitle>
        <Panel x={70} y={170} w={700} h={590} title="Region A" />
        <Panel x={830} y={170} w={700} h={590} title="Region B" />
        <HeadUpChannel x={420} dir="in" region="A" glowRed={false} />
        <HeadUpChannel x={1180} dir="in" region="B" glowRed={false} />
        <text x={420} y={745} textAnchor="middle" fontSize={40} fontWeight={800} fill={RED_TEXT}>Red to port</text>
        <text x={1180} y={745} textAnchor="middle" fontSize={40} fontWeight={800} fill={RED_TEXT}>Red to starboard</text>
        {n >= 3 && <rect x={0} y={790} width={1600} height={110} fill="rgba(11,25,41,0.9)" />}
        {n >= 3 && <text x={800} y={860} textAnchor="middle" fontSize={44} fontWeight={700} fill={ART.tealBright}>Next: cardinal and other marks</text>}
      </Stage>
    );
  }),
];

export function Video() {
  return <LessonPlayer slug={SCRIPT.slug} title="Lateral marks: Region A and Region B" scenes={SCENES} speak={SCRIPT.speak} />;
}

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

const PLOT_VIEW = viewAround(onChannel(3.9), 4.2, 4 / 3);
const where = (id: KerranId) => formatPosition(BUOYS[id].at);

/** A small picture of a mark for a choice option. */
function OptionMark({ type, region, label }: { type: Side; region: Region; label: string }) {
  return (
    <span className="flex items-center gap-3">
      <svg viewBox="0 0 220 250" className="h-20 w-[4.4rem] shrink-0 rounded-md bg-[#e3f1fa]" role="img" aria-label={label}>
        <rect y={218} width={220} height={32} fill="#2b6a8e" />
        <LateralMark type={type} region={region} x={110} y={230} scale={0.9} />
      </svg>
      <span>{label}</span>
    </span>
  );
}

const FL2_G = parseLight(BUOYS.no3.light);

export const QUESTIONS: Question[] = [
  {
    id: "enter-red-can",
    kind: "choice",
    prompt: "You are entering a harbour in Croatia (Region A), going with the direction of buoyage. A red can-shaped buoy lies ahead. How do you pass it?",
    options: [
      "Keep it on your port side, so you pass to the right of it",
      "Keep it on your starboard side, so you pass to the left of it",
      "Either side: red buoys mark the middle of the channel",
      "Steer straight past it: it marks the deepest water",
    ],
    answer: 0,
    explain: "A red can is a Region A port-hand mark. Going with the direction of buoyage, into harbour, keep it on your port side. That means passing to the right of it, between it and the green marks on the other side of the channel.",
  },
  {
    id: "which-starboard-a",
    kind: "choice",
    prompt: "In Greece (Region A), which of these is a starboard-hand mark?",
    options: [
      <OptionMark key="s" type="starboard" region="A" label="Green cone, green cone topmark" />,
      <OptionMark key="p" type="port" region="A" label="Red can, red can topmark" />,
      <OptionMark key="r" type="starboard" region="B" label="Red cone, red cone topmark" />,
      <OptionMark key="g" type="port" region="B" label="Green can, green can topmark" />,
    ],
    answer: 0,
    explain: "A Region A starboard-hand mark is green and conical, with a single green cone topmark, point up. The red can is the Region A port-hand mark. The red cone and the green can are Region B marks: there the colours swap sides, but the shapes stay where they are.",
  },
  {
    id: "bvi-red-cone",
    kind: "choice",
    prompt: "On a charter in the British Virgin Islands (Region B), you are entering a bay by its marked channel. A red cone-shaped buoy lies ahead. Which side do you keep it?",
    figure: <div className="max-w-xs"><MarkView type="starboard" region="B" look="day" /></div>,
    options: ["On your starboard side", "On your port side", "Either side", "Keep clear: red marks a danger in Region B"],
    answer: 0,
    explain: "In Region B the colours swap: red marks are starboard-hand marks, and the shape agrees, because a cone is always starboard-hand. Coming in from sea, keep it on your starboard side: red, right, returning.",
  },
  {
    id: "bvi-leaving-green",
    kind: "choice",
    prompt: "Leaving Road Town on Tortola (Region B) for the open sea, you pass a green can buoy. Which side do you keep it?",
    options: ["On your starboard side", "On your port side", "Either side", "Pass close to it: green means deep water"],
    answer: 0,
    explain: "In Region B a green can is a port-hand mark: keep it to port coming in. Going out you are against the direction of buoyage, so everything reverses: keep it on your starboard side.",
  },
  {
    id: "pc-meaning",
    kind: "choice",
    prompt: "In Region A, going with the direction of buoyage, you reach a fork in the channel. On the dividing point is a red can buoy with one broad green band, light Fl(2+1) R 10s. What does it tell you?",
    figure: <div className="max-w-xs"><MarkView type="preferred-channel-to-starboard" region="A" look="day" /></div>,
    options: [
      "The preferred channel is to starboard: keep the mark on your port side to follow it",
      "The preferred channel is to port: keep the mark on your starboard side to follow it",
      "There is danger all round it: keep well clear on either side",
      "It marks the middle of the channel: pass either side",
    ],
    answer: 0,
    explain: "It is a preferred channel to starboard mark: a Region A port-hand mark modified with a green band, with the Fl(2+1) light kept for preferred channel marks. Treat it as a port-hand mark, keep it to port, and you take the main channel, which lies to starboard of it.",
  },
  {
    id: "region-b-area",
    kind: "choice",
    prompt: "Which of these charter areas uses IALA Region B, where you keep red marks to starboard coming in?",
    options: ["The British Virgin Islands", "Croatia", "The Seychelles", "Turkey"],
    answer: 0,
    explain: "The British Virgin Islands are in the Caribbean, which like the rest of the Americas uses Region B, even though the islands are British. Croatia, Turkey and the Seychelles all use Region A: red to port going in.",
  },
  {
    id: "plot-no4",
    kind: "plot",
    prompt: "You are entering Port Kerran on the practice chart (Region A) from seaward. Tap the buoy at the inner, harbour end of the channel that you keep on your port side.",
    answer: BUOYS.no4.at,
    tolerance: 0.2,
    view: PLOT_VIEW,
    explain: `Entering, you go with the direction of buoyage, so you keep the red port-hand marks to port. The red cans are No 2 (the outer one) and No 4 (the inner one). No 4, ${BUOYS.no4.light}, is at ${where("no4")}.`,
  },
  {
    id: "night-fl2r",
    kind: "choice",
    prompt: `Entering Port Kerran at night, you see this light ahead: ${BUOYS.no4.light}. Which buoy is it, and which side do you keep it?`,
    figure: <div className="max-w-sm"><LightSim characteristic={BUOYS.no4.light} label="Ahead" /></div>,
    options: ["No 4: keep it to port", "No 4: keep it to starboard", "No 2: keep it to port", "No 3: keep it to starboard"],
    answer: 0,
    explain: `The light is red, and Kerran is in Region A, so it is a port-hand mark. It flashes in groups of two every 5 seconds, Fl(2), and on the chart that is No 4 (No 2 shows a single flash, ${BUOYS.no2.light}). Entering harbour, keep it on your port side.`,
  },
  {
    id: "flashes-a-minute",
    kind: "numeric",
    prompt: `No 3 buoy shows ${BUOYS.no3.light}: groups of two green flashes, repeated every ${FL2_G.period} seconds. How many flashes does it show in one minute?`,
    answer: (60 / FL2_G.period) * 2,
    tolerance: 0.5,
    unit: "flashes",
    explain: `The period, ${FL2_G.period} seconds, is the time for one whole group and the dark gap after it. A minute holds 60 ÷ ${FL2_G.period} = ${60 / FL2_G.period} groups, each of two flashes: ${(60 / FL2_G.period) * 2} flashes. Counting like this is how you check a light against the chart.`,
  },
  {
    id: "sun-silhouette",
    kind: "choice",
    prompt: "Heading into a low evening sun, you cannot make out any colour, but this buoy's outline is clear. You are going with the direction of buoyage. What is it, and which side do you keep it?",
    figure: <div className="max-w-xs"><MarkView type="port" look="sun" /></div>,
    options: ["A port-hand mark: keep it to port", "A starboard-hand mark: keep it to starboard", "A port-hand mark: keep it to starboard", "It depends on the region"],
    answer: 0,
    explain: "A flat-topped can with a can topmark is a port-hand mark, in Region A and Region B alike: only the colours change between regions. Going with the direction of buoyage, keep it on your port side.",
  },
  {
    id: "plot-leaving",
    kind: "plot",
    prompt: "You are leaving Port Kerran for the open sea. Tap the last buoy you keep on your port side before you clear the channel.",
    answer: BUOYS.no1.at,
    tolerance: 0.2,
    view: PLOT_VIEW,
    explain: `Leaving, you go against the direction of buoyage, so everything reverses: the green starboard-hand marks pass down your port side. Going out you pass No 3 first, then No 1, ${BUOYS.no1.light}, at ${where("no1")}, the last one before the open sea.`,
  },
];

/* ------------------------------------------------------------------ */
/* Practice generator                                                  */
/* ------------------------------------------------------------------ */

const DIR_TEXT: Record<Dir, string> = {
  in: "Entering Port Kerran from seaward",
  out: "Leaving Port Kerran for the open sea",
};
const WHY: Record<Dir, string> = {
  in: "Entering, you go with the direction of buoyage",
  out: "Leaving, you go against the direction of buoyage, so everything reverses",
};
const markName = (type: Side) => `${type === "port" ? "Port" : "Starboard"}-hand mark`;
const SIBLING: Record<KerranId, KerranId> = { no1: "no3", no3: "no1", no2: "no4", no4: "no2" };
const PARTNER: Record<KerranId, KerranId> = { no1: "no2", no2: "no1", no3: "no4", no4: "no3" };
const NIGHT_RHYTHMS = ["Fl {c} 5s", "Fl(2) {c} 5s", "Fl(3) {c} 10s", "Q {c}"];

/** Region A or B, day or into the sun: what is it, and which side? */
function sideQuestion(rng: Rng, i: number): Question {
  const region: Region = rng() < 0.5 ? "A" : "B";
  const type = pick(rng, ["port", "starboard"] as Side[]);
  const dir = pick(rng, ["in", "out"] as Dir[]);
  const sun = rng() < 0.35;
  const right = sideToKeep(type, dir);
  const place = region === "A" ? pick(rng, ["Croatia", "Greece", "Turkey", "Mallorca", "the Seychelles"]) : "the British Virgin Islands";
  const all = (["port", "starboard"] as const).flatMap((t) => (["port", "starboard"] as Side[]).map((s) => ({ t, s })));
  const label = (o: { t: Side; s: Side }) => `${markName(o.t)}: keep it to ${o.s}`;
  const { options, answer } = choices(rng, label({ t: type, s: right }), all.map(label));
  const look = `a ${dayLookText(type, region)}`;
  return {
    id: `p${i}-side-${region}-${type}-${dir}-${sun ? "sun" : "day"}`,
    kind: "choice",
    prompt: sun
      ? `In ${place} (Region ${region}), ${dir === "in" ? "entering harbour" : "leaving harbour"}, you are heading into a low sun. You cannot see any colour, but this buoy's outline is clear. What is it, and which side do you keep it?`
      : `In ${place} (Region ${region}), ${dir === "in" ? "entering harbour from the sea" : "leaving harbour for the open sea"}, you see ${look} ahead. What is it, and which side do you keep it?`,
    figure: sun ? <div className="max-w-xs"><MarkView type={type} look="sun" /></div> : undefined,
    options,
    answer,
    explain: `${sun ? `A ${type === "port" ? "can with a can" : "cone with a cone"} topmark` : `${coloursText(type, region)} and ${shapeWord(type)}-shaped`}: in Region ${region}, a ${type}-hand mark. ${dir === "in" ? "Entering, you go with the direction of buoyage" : "Leaving, you go against the direction of buoyage, so everything reverses"}: keep it on your ${right} side.`,
  };
}

const dayLookText = (type: Side, region: Region) => `${hueWord(sideColour(type, region))} ${type === "port" ? "can-shaped buoy with a can topmark" : "conical buoy with a cone topmark"}`;

/** Identify a lateral mark from a picture by day, or from its light at night, in either region. */
function identifyQuestion(rng: Rng, i: number): Question {
  const type = pick(rng, LATERAL_TYPES);
  const region: Region = rng() < 0.5 ? "A" : "B";
  const plain = type === "port" || type === "starboard";
  const night = rng() < 0.5;
  const light = !night ? undefined : plain ? parseLight(pick(rng, NIGHT_RHYTHMS).replace("{c}", mainHue(type, region))) : pcLight(type, region);
  const { options, answer } = choices(rng, SHORT_NAME[type], LATERAL_TYPES.map((t) => SHORT_NAME[t]));
  const colour = light?.colour === "R" ? "red" : "green";
  return {
    id: `p${i}-identify-${region}-${type}-${night ? light!.text.replace(/\W+/g, "") : "day"}`,
    kind: "choice",
    prompt: night ? `Sailing in Region ${region}, at night you see a light: ${light!.text}. What kind of mark is it?` : `Sailing in Region ${region}, you see this mark. What is it?`,
    figure: <div className="max-w-xs"><MarkView type={type} region={region} look={night ? "night" : "day"} light={light} showBar={night} /></div>,
    options,
    answer,
    explain: night
      ? plain
        ? `A ${colour} light that is not Fl(2+1) is a plain lateral mark, and in Region ${region} ${colour} is the ${type}-hand colour. ${MEANING[type]}`
        : `Fl(2+1), two flashes then one, is kept for preferred channel marks, and the ${colour} light matches the mark's main colour (${coloursText(type, region).toLowerCase()} in Region ${region}). ${MEANING[type]}`
      : `${coloursText(type, region)}, ${shapeWord(type)}-shaped, topmark: ${topmarkText(type, region).toLowerCase()}. The shape settles it: ${isCan(type) ? "a can is port-hand" : "a cone is starboard-hand"}. ${MEANING[type]}`,
  };
}

/** Tap the first or second buoy you keep to port or starboard, entering or leaving Port Kerran. */
function plotQuestion(rng: Rng, i: number): Question {
  const dir = pick(rng, ["in", "out"] as Dir[]);
  const side = pick(rng, ["port", "starboard"] as Side[]);
  const nth = pick(rng, [0, 1] as const);
  const b = nthKeptTo("A", dir, side, nth);
  const other = nthKeptTo("A", dir, side, nth === 0 ? 1 : 0);
  const at = BUOYS[b.id as KerranId].at;
  const colour = b.type === "port" ? "red port-hand marks" : "green starboard-hand marks";
  return {
    id: `p${i}-plot-${dir}-${side}-${nth}`,
    kind: "plot",
    prompt: `${DIR_TEXT[dir]}, tap the ${nth === 0 ? "first" : "second"} buoy you keep on your ${side} side.`,
    answer: at,
    tolerance: 0.2,
    view: PLOT_VIEW,
    explain: `${WHY[dir]}. The ${colour} are the ones you keep to ${side}. Going ${dir}, you pass ${nth === 0 ? b.name : other.name} first and ${nth === 0 ? other.name : b.name} second. ${b.name} (${b.light}) is at ${formatPosition(at)}.`,
  };
}

/** Identify a Port Kerran buoy from its light, entering or leaving. */
function nightBuoyQuestion(rng: Rng, i: number): Question {
  const id = pick(rng, KERRAN_IDS);
  const dir = pick(rng, ["in", "out"] as Dir[]);
  const b = BUOYS[id];
  const right = sideToKeep(b.type, dir);
  const sib = BUOYS[SIBLING[id]];
  const partner = BUOYS[PARTNER[id]];
  const { options, answer } = choices(rng, `${b.name}: keep it to ${right}`, [
    `${b.name}: keep it to ${opposite(right)}`,
    `${sib.name}: keep it to ${right}`,
    `${partner.name}: keep it to ${sideToKeep(partner.type, dir)}`,
  ]);
  const colour = b.type === "port" ? "Red" : "Green";
  return {
    id: `p${i}-night-${id}-${dir}`,
    kind: "choice",
    prompt: `${DIR_TEXT[dir]} at night, you see this light ahead: ${b.light}. Which buoy is it, and which side do you keep it?`,
    figure: <div className="max-w-sm"><LightSim characteristic={b.light} label="Ahead" /></div>,
    options,
    answer,
    explain: `${colour} in Region A means a ${b.type}-hand mark. ${b.light.startsWith("Fl(2)") ? "Groups of two flashes" : "A single flash"} every 5 seconds matches ${b.name} on the chart (${sib.name} shows ${sib.light}). ${WHY[dir]}: keep it on your ${right} side.`,
  };
}

/** Which region, and which side for a red or green mark? */
function regionQuestion(rng: Rng, i: number): Question {
  const regionB = rng() < 0.4;
  const place = regionB ? pick(rng, REGION_B_PLACES) : pick(rng, CHARTER_AREAS.filter((a) => a.region === "A")).name;
  const colour = pick(rng, ["red", "green"] as const);
  const portColour = regionB ? "green" : "red";
  const right: Side = colour === portColour ? "port" : "starboard";
  return {
    id: `p${i}-region-${place.replace(/\W+/g, "")}-${colour}`,
    kind: "choice",
    prompt: `Chartering in ${place.replace(/^The /, "the ")}, you are entering harbour from the sea. A ${colour} lateral mark lies ahead. Which side do you keep it?`,
    options: ["On your port side", "On your starboard side", "Either side"],
    fixedOrder: true,
    answer: right === "port" ? 0 : 1,
    explain: regionB
      ? `${place.replace(/^the /, "The ")} uses IALA Region B, where the colours swap: red marks are starboard-hand and green marks port-hand. Entering, keep red to starboard (red right returning) and green to port. The shapes do not swap: cans are still port-hand, cones starboard-hand.`
      : `${place.replace(/^the /, "The ")} uses IALA Region A: entering harbour, red port-hand marks to port and green starboard-hand marks to starboard.`,
  };
}

export const PRACTICE: PracticeGenerator = {
  title: "Which side, which region?",
  description: "Five fresh questions each time: marks in both regions by day and into the sun, lights at night in Port Kerran, a buoy to find on the chart, and the region of a charter area.",
  generate: (rng) => [sideQuestion(rng, 0), nightBuoyQuestion(rng, 1), plotQuestion(rng, 2), identifyQuestion(rng, 3), regionQuestion(rng, 4)],
};

export function Exercises({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  return <ExerciseSet courseSlug={courseSlug} lessonSlug={lessonSlug} questions={QUESTIONS} practice={PRACTICE} />;
}

