"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import type { Scene } from "@/components/cruising/GuidePlayer";
import { splitSentences } from "@/lib/cruising/narration";

// A 1920×1080 stage the MP4 renderer drives frame by frame (scripts/videos).
// window.__prepare() measures every recorded sentence and returns the
// timeline; window.__seek(seconds) draws that moment. Timings match the
// player: a short lead-in before each sentence and a hold after each scene.
// Used for the cruising guides and the course lessons.

const LEAD_FIRST = 0.15;
const LEAD_NEXT = 0.25;
const HOLD = 0.7;

interface Sentence {
  text: string;
  url: string;
  start: number;
  dur: number;
}
interface SceneTime {
  start: number;
  end: number;
  speechEnd: number;
  min: number;
  sentences: Sentence[];
}
export interface RenderPlan {
  duration: number;
  /** A good still for the thumbnail. */
  poster: number;
  intro: { url: string; fadeAt: number } | null;
  clips: { url: string; start: number; dur: number }[];
  /** Scene titles and start times, for YouTube chapters. */
  chapters: { title: string; start: number }[];
}

declare global {
  interface Window {
    __ready?: boolean;
    __prepare?: () => Promise<RenderPlan>;
    __seek?: (seconds: number) => Promise<void>;
  }
}

export default function ScenesStage({ scenes, audioUrl, poster }: { scenes: Scene[]; audioUrl: (sentence: string) => string; poster: (timeline: { start: number; end: number }[]) => number }) {
  const [frame, setFrame] = useState({ scene: 0, t: 0, sentence: 0, seconds: 0, caption: "" });

  useEffect(() => {
    let timeline: SceneTime[] = [];
    window.__prepare = async () => {
      const ctx = new OfflineAudioContext(1, 44100, 44100);
      const measure = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url}: ${res.status}`);
        return (await ctx.decodeAudioData(await res.arrayBuffer())).duration;
      };
      timeline = [];
      let clock = 0;
      for (const sc of scenes) {
        const texts = splitSentences(sc.narration);
        const sentences: Sentence[] = [];
        let at = clock;
        for (let i = 0; i < texts.length; i++) {
          const url = audioUrl(texts[i]!);
          const dur = await measure(url);
          at += i === 0 ? LEAD_FIRST : LEAD_NEXT;
          sentences.push({ text: texts[i]!, url, start: at, dur });
          at += dur;
        }
        const min = sc.seconds ?? 0;
        const end = Math.max(at, clock + min) + HOLD;
        timeline.push({ start: clock, end, speechEnd: at, min, sentences });
        clock = end;
      }
      return {
        duration: clock,
        poster: poster(timeline),
        intro: scenes[0]?.sound ? { url: scenes[0].sound, fadeAt: timeline[0]!.end } : null,
        clips: timeline.flatMap((s) => s.sentences.map(({ url, start, dur }) => ({ url, start, dur }))),
        chapters: timeline.map((s, i) => ({ title: scenes[i]!.title, start: s.start })),
      };
    };
    window.__seek = (time: number) =>
      new Promise<void>((resolve) => {
        let k = timeline.findIndex((s) => time < s.end);
        if (k < 0) k = timeline.length - 1;
        const s = timeline[k]!;
        const local = time - s.start;
        let si = 0;
        s.sentences.forEach((x, j) => {
          if (time >= x.start - (j === 0 ? LEAD_FIRST : LEAD_NEXT)) si = j;
        });
        const lengths = s.sentences.map((x) => x.text.length);
        const total = lengths.reduce((a, b) => a + b, 0) || 1;
        const cur = s.sentences[si];
        const done = lengths.slice(0, si).reduce((a, b) => a + b, 0);
        const within = cur ? Math.min(1, Math.max(0, (time - cur.start) / cur.dur)) * cur.text.length : 0;
        let t = time >= s.speechEnd ? 1 : (done + within) / total;
        if (s.min > 0) t = Math.min(t, local / s.min);
        if (time >= s.speechEnd && local >= s.min) t = 1;
        flushSync(() => setFrame({ scene: k, t: Math.max(0, Math.min(1, t)), sentence: si, seconds: local, caption: cur?.text ?? "" }));
        requestAnimationFrame(() => resolve());
      });
    window.__ready = true;
  }, [scenes, audioUrl, poster]);

  const sc = scenes[frame.scene];
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, overflow: "hidden", background: "#1b3a52" }}>
      {sc?.render(frame.t, frame.sentence, frame.seconds)}
      {frame.caption && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center", padding: "0 160px" }}>
          <p style={{ margin: 0, maxWidth: 1400, background: "rgba(19,41,59,.85)", color: "#fff", borderRadius: 14, padding: "10px 22px", fontSize: 34, lineHeight: 1.3, textAlign: "center", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" }}>
            {frame.caption}
          </p>
        </div>
      )}
    </div>
  );
}
