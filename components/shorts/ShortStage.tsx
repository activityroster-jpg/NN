"use client";

import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { estimateSeconds, sceneSentences, shortNarrationUrl } from "@/lib/shorts/narration";
import type { Short } from "@/lib/shorts/types";
import MedMooringDiagram from "./MedMooringDiagram";

// A 1080×1920 stage the MP4 renderer drives frame by frame (scripts/videos/
// make-short.mjs). The page draws only what sits on top of the footage: the
// wordmark, headings, captions, diagrams and the end card, on a transparent
// background; the renderer composes the footage underneath with ffmpeg.
// window.__prepare() measures every recorded sentence and returns the
// timeline; window.__seek(seconds) draws that moment.

const W = 1080;
const H = 1920;
const LEAD_FIRST = 0.2;
const LEAD_NEXT = 0.3;
const HOLD = 0.6;
const CREAM = "#faf6ec";
const INK = "#2a2826";
const SANS = "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif";
const SERIF = "var(--font-cormorant), ui-serif, Georgia, serif";

export interface SceneFootage {
  url: string;
  start: number;
}
interface Sentence {
  text: string;
  captioned: boolean;
  url: string;
  start: number;
  dur: number;
  mock: boolean;
}
interface SceneTime {
  start: number;
  end: number;
  speechEnd: number;
  sentences: Sentence[];
}
export interface ShortPlan {
  width: number;
  height: number;
  duration: number;
  /** A good still for the cover: the hook with its heading showing. */
  poster: number;
  scenes: { start: number; end: number; footage: SceneFootage | null; colour: string }[];
  clips: { url: string; start: number; dur: number; mock: boolean }[];
  bed: { url: string; gain: number } | null;
}
interface StageWindow {
  __ready?: boolean;
  __prepare?: () => Promise<ShortPlan>;
  __seek?: (seconds: number) => Promise<void>;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const fade = (local: number, from: number, len = 0.35) => clamp01((local - from) / len);

export default function ShortStage({ short, footage, bed }: { short: Short; footage: Record<number, SceneFootage>; bed: string | null }) {
  const scenes = useMemo(() => short.scenes.map((sc) => ({ ...sc, lines: sceneSentences(sc) })), [short]);
  const [frame, setFrame] = useState({ scene: 0, local: 0, t: 0, caption: "", captionAt: 0 });

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    const w = window as unknown as StageWindow;
    let timeline: SceneTime[] = [];
    w.__prepare = async () => {
      const ctx = new OfflineAudioContext(1, 44100, 44100);
      const measure = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url}: ${res.status}`);
        return (await ctx.decodeAudioData(await res.arrayBuffer())).duration;
      };
      timeline = [];
      let clock = 0;
      for (const sc of scenes) {
        const sentences: Sentence[] = [];
        let at = clock;
        for (const [i, line] of sc.lines.entries()) {
          const url = shortNarrationUrl(short, line.text);
          let dur: number;
          let mock = false;
          try {
            dur = await measure(url);
          } catch {
            // Not recorded (local preview): keep the timing plausible.
            dur = estimateSeconds(line.text);
            mock = true;
          }
          at += i === 0 ? LEAD_FIRST : LEAD_NEXT;
          sentences.push({ text: line.text, captioned: line.captioned, url, start: at, dur, mock });
          at += dur;
        }
        const end = Math.max(at, clock + (sc.seconds ?? 0)) + HOLD;
        timeline.push({ start: clock, end, speechEnd: at, sentences });
        clock = end;
      }
      return {
        width: W,
        height: H,
        duration: clock,
        poster: Math.min(1.2, Math.max(0, timeline[0]!.end - 0.1)),
        scenes: timeline.map((s, i) => {
          const v = scenes[i]!.visual;
          return { start: s.start, end: s.end, footage: v.kind === "footage" ? (footage[i] ?? null) : null, colour: v.kind === "end" ? "0x2a2826" : v.kind === "diagram" ? "0xfaf6ec" : "0x4a6b85" };
        }),
        clips: timeline.flatMap((s) => s.sentences.map(({ url, start, dur, mock }) => ({ url, start, dur, mock }))),
        bed: bed ? { url: bed, gain: 0.16 } : null,
      };
    };
    w.__seek = (time: number) =>
      new Promise<void>((resolve) => {
        let k = timeline.findIndex((s) => time < s.end);
        if (k < 0) k = timeline.length - 1;
        const s = timeline[k]!;
        const local = time - s.start;
        const span = Math.max(0.5, s.speechEnd - s.start);
        const t = time >= s.speechEnd ? 1 : clamp01(local / span);
        let caption = "";
        let captionAt = 0;
        for (const x of s.sentences) {
          if (time >= x.start - 0.12 && x.captioned) {
            caption = x.text;
            captionAt = x.start - 0.12;
          }
        }
        flushSync(() => setFrame({ scene: k, local, t, caption, captionAt: time - captionAt }));
        requestAnimationFrame(() => resolve());
      });
    w.__ready = true;
  }, [scenes, short, footage, bed]);

  const sc = scenes[frame.scene]!;
  const v = sc.visual;
  const dark = v.kind !== "diagram"; // light text on footage and the end card
  const fg = dark ? CREAM : INK;
  const shadow = dark ? "0 2px 18px rgba(0,0,0,.45)" : "none";
  const hook = frame.scene === 0;

  return (
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden", background: "transparent", color: fg, fontFamily: SANS }}>
      {v.kind === "diagram" && (
        <>
          <div style={{ position: "absolute", inset: 0, background: CREAM }} />
          <MedMooringDiagram step={v.step} t={frame.t} />
        </>
      )}
      {v.kind === "footage" && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 420, background: "linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,0))" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 760, background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.5))" }} />
        </>
      )}
      {v.kind === "end" && <div style={{ position: "absolute", inset: 0, background: INK }} />}

      {v.kind !== "end" && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 232, textAlign: "center", fontSize: 30, fontWeight: 300, letterSpacing: "0.32em", textTransform: "uppercase", textShadow: shadow }}>
          Nautical&nbsp;&nbsp;&nbsp;Nomads
        </div>
      )}

      {(sc.badge || sc.heading) && (
        <div style={{ position: "absolute", left: 90, right: 90, top: hook ? 640 : v.kind === "diagram" ? 350 : 400, textAlign: "center", opacity: fade(frame.local, 0.05), transform: `translateY(${(1 - fade(frame.local, 0.05)) * 18}px)` }}>
          {sc.badge && (
            <div style={{ display: "inline-block", padding: "10px 26px", borderRadius: 999, background: "#c75d3e", color: "#fff", fontSize: 28, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 26 }}>{sc.badge}</div>
          )}
          {sc.heading && <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: hook ? 150 : 104, lineHeight: 1, textShadow: shadow }}>{sc.heading}</div>}
          {sc.sub && <div style={{ marginTop: 18, fontSize: hook ? 78 : 56, fontWeight: 700, lineHeight: 1.05, textShadow: shadow }}>{sc.sub}</div>}
        </div>
      )}

      {v.kind === "end" && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 720, textAlign: "center", opacity: fade(frame.local, 0.1, 0.5) }}>
          <div style={{ fontSize: 56, fontWeight: 300, letterSpacing: "0.32em", textTransform: "uppercase" }}>Nautical&nbsp;&nbsp;&nbsp;Nomads</div>
          <div style={{ width: 64, height: 3, background: "#c75d3e", margin: "40px auto" }} />
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 60, color: "#e2d9c6" }}>Yacht charters made simple</div>
          <div style={{ marginTop: 34, fontSize: 50, fontWeight: 600, color: "#e0856a" }}>nauticalnomads.com</div>
        </div>
      )}

      {frame.caption && (
        <div style={{ position: "absolute", left: 90, right: 90, top: v.kind === "diagram" ? 1360 : v.kind === "end" ? 1250 : 1180, display: "flex", justifyContent: "center", opacity: fade(frame.captionAt, 0, 0.22) }}>
          <p
            style={{
              margin: 0,
              maxWidth: 900,
              padding: v.kind === "diagram" ? 0 : "22px 32px",
              borderRadius: 24,
              background: v.kind === "footage" ? "rgba(19,41,59,.62)" : "transparent",
              color: v.kind === "diagram" ? INK : "#fff",
              fontSize: 54,
              lineHeight: 1.25,
              fontWeight: 600,
              textAlign: "center",
              textShadow: v.kind === "diagram" ? "none" : "0 2px 10px rgba(0,0,0,.35)",
            }}
          >
            {frame.caption}
          </p>
        </div>
      )}
    </div>
  );
}
