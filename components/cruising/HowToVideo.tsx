"use client";

// The narrated video of a charter know-how guide: the brand intro, then one
// scene per script scene, drawn from its `visual` (title, points, steps, table
// or tip) in the guide-video style. Items appear with the sentence that
// introduces them. Narration is the recorded voice when available.

import {
  Anchor, Backpack, Bath, BatteryCharging, BookOpen, Calendar, Camera, CircleCheck, Clock, CloudLightning, CloudRain, Cog, Compass,
  CookingPot, Droplets, Euro, Eye, FileText, Fish, Flame, Footprints, Fuel, Gauge, Glasses, IdCard, Info, LifeBuoy, ListChecks, Lock,
  Map as MapIcon, Moon, Mountain, Package, Phone, PlugZap, Radio, Receipt, Recycle, Refrigerator, RotateCcw, Ruler, Sailboat, Search,
  ShieldCheck, Ship, Shirt, ShoppingCart, Siren, Store, Sun, Sunset, Thermometer, Timer, TriangleAlert, Ban, Users, Utensils, Wallet,
  Waves, Wind, Wrench, Zap, Trash2, type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import GuidePlayer, { fade, phase, Stage, type Scene } from "@/components/cruising/GuidePlayer";
import { brandIntroScene } from "@/components/cruising/GuideVideo";
import { narrationUrl, splitSentences } from "@/lib/cruising/narration";
import { howToNarrationId, type HowToIcon, type HowToScene, type HowToScript } from "@/lib/cruising/howto-scripts";

const ICONS: Record<HowToIcon, LucideIcon> = {
  cart: ShoppingCart, list: ListChecks, package: Package, fridge: Refrigerator, store: Store, utensils: Utensils, file: FileText,
  camera: Camera, wind: Wind, gauge: Gauge, droplets: Droplets, battery: BatteryCharging, flame: Flame, anchor: Anchor, lifebuoy: LifeBuoy,
  sailboat: Sailboat, radio: Radio, compass: Compass, map: MapIcon, sun: Sun, shirt: Shirt, backpack: Backpack, phone: Phone, wallet: Wallet,
  lightning: CloudLightning, rain: CloudRain, thermometer: Thermometer, alert: TriangleAlert, wrench: Wrench, cog: Cog, fuel: Fuel,
  waves: Waves, shield: ShieldCheck, clock: Clock, euro: Euro, lock: Lock, moon: Moon, ruler: Ruler, zap: Zap, users: Users, id: IdCard,
  check: CircleCheck, recycle: Recycle, sunset: Sunset, mountain: Mountain, bath: Bath, pot: CookingPot, trash: Trash2, glasses: Glasses,
  footprints: Footprints, plug: PlugZap, info: Info, search: Search, eye: Eye, receipt: Receipt, ban: Ban, siren: Siren, book: BookOpen,
  calendar: Calendar, timer: Timer, fish: Fish, ship: Ship, rotate: RotateCcw,
};

const BG = "#13293b";
const PEACH = "#f2b49c";
const MUTED = "#b9c7d3";
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

/** Greedy word wrap to lines of at most `max` characters. */
function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    if (line && (line + " " + w).length > max) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out;
}

/** Where each sentence starts and ends as a fraction of the scene (by length). */
function spans(narration: string): Array<[number, number]> {
  const parts = splitSentences(narration);
  const total = parts.reduce((n, s) => n + s.length, 0) || 1;
  let at = 0;
  return parts.map((s) => {
    const span: [number, number] = [at / total, (at + s.length) / total];
    at += s.length;
    return span;
  });
}

/** 0 → 1 as an item appears: it fades in over the first part of its sentence. */
function appear(at: number, sentence: number, t: number, sp: Array<[number, number]>): number {
  if (sentence > at) return 1;
  if (sentence < at) return 0;
  const s = sp[at];
  if (!s) return 1;
  return phase((t - s[0]) / (s[1] - s[0] || 1), 0, 0.18);
}

function Swell({ seconds }: { seconds: number }) {
  return (
    <>
      {[0, 1, 2].map((k) => (
        <path
          key={k}
          d={`M -50 ${830 + k * 30} ${Array.from({ length: 18 }, (_, i) => `Q ${i * 100} ${830 + k * 30 + (i % 2 ? -10 : 10) * Math.sin(seconds * 1.1 + k)} ${i * 100 + 50} ${830 + k * 30}`).join(" ")}`}
          fill="none"
          stroke={PEACH}
          strokeWidth={2}
          opacity={0.08 + k * 0.04}
        />
      ))}
    </>
  );
}

function Frame({ kicker, title, t, seconds, children }: { kicker: string; title?: string; t: number; seconds: number; children: React.ReactNode }) {
  return (
    <Stage background={BG}>
      <Swell seconds={seconds} />
      <text x={160} y={96} fontSize={24} letterSpacing={6} fill={PEACH} fontFamily={FONT} opacity={fade(t, 0, 0.08)}>
        {kicker.toUpperCase()}
      </text>
      {title && (
        <text x={160} y={170} fontSize={title.length > 30 ? 54 : 62} fontWeight={800} fill="#fff" fontFamily={FONT} opacity={fade(t, 0, 0.1)}>
          {title}
        </text>
      )}
      {children}
    </Stage>
  );
}

function IconDisc({ icon, x, y, r, opacity = 1, filled = false }: { icon: HowToIcon; x: number; y: number; r: number; opacity?: number; filled?: boolean }) {
  const Icon = ICONS[icon] ?? Info;
  const size = r * 1.05;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={filled ? PEACH : "rgba(242,180,156,0.12)"} stroke={PEACH} strokeWidth={2} />
      <Icon x={x - size / 2} y={y - size / 2} size={size} color={filled ? BG : PEACH} strokeWidth={1.75} aria-hidden="true" />
    </g>
  );
}

/** A row that slides and fades in. */
function Row({ y, h, k, children }: { y: number; h: number; k: number; children: React.ReactNode }) {
  return (
    <g opacity={k} transform={`translate(${(1 - k) * 40} 0)`}>
      <rect x={160} y={y} width={1280} height={h} rx={18} fill="rgba(255,255,255,0.06)" stroke={k >= 1 ? "rgba(255,255,255,0.14)" : PEACH} strokeWidth={2} />
      {children}
    </g>
  );
}

function sceneFor(sc: HowToScene, kicker: string, summary: string): Scene {
  const sp = spans(sc.narration);
  const v = sc.visual;
  /** The sentence from which item k shows: the explicit `at`, else lead (default 1) + k. */
  const atOf = (k: number): number => {
    if (v.kind === "title" || v.kind === "tip") return 0;
    const explicit = v.at?.[k];
    return explicit !== undefined ? explicit : (v.lead ?? 1) + k;
  };
  return {
    title: sc.title,
    narration: sc.narration,
    seconds: sc.seconds,
    render: (t, sentence, seconds) => {
      if (v.kind === "title") {
        const lines = wrap(summary, 52);
        return (
          <Frame kicker={kicker} t={t} seconds={seconds}>
            <IconDisc icon={v.icon} x={800} y={290} r={92} opacity={fade(t, 0, 0.12)} />
            <text x={800} y={480} textAnchor="middle" fontSize={sc.title.length > 30 ? 66 : 78} fontWeight={800} fill="#fff" fontFamily={FONT} opacity={fade(t, 0.05, 0.18)}>
              {sc.title}
            </text>
            <text x={800} y={560} textAnchor="middle" fontSize={34} fill={MUTED} fontFamily={FONT} opacity={fade(t, 0.15, 0.3)}>
              {lines.map((l, i) => (
                <tspan key={i} x={800} dy={i === 0 ? 0 : 48}>{l}</tspan>
              ))}
            </text>
          </Frame>
        );
      }
      if (v.kind === "tip") {
        const lines = wrap(v.text, 40);
        const h = 200 + lines.length * 60;
        const y0 = 470 - h / 2;
        return (
          <Frame kicker={kicker} title={sc.title} t={t} seconds={seconds}>
            <g opacity={fade(t, 0.02, 0.15)} transform={`translate(0 ${(1 - fade(t, 0.02, 0.15)) * 20})`}>
              <rect x={260} y={y0 + 40} width={1080} height={h} rx={28} fill="rgba(242,180,156,0.1)" stroke={PEACH} strokeWidth={2.5} />
              <IconDisc icon={v.icon} x={800} y={y0 + 40} r={52} filled />
              <text x={800} y={y0 + 170} textAnchor="middle" fontSize={44} fontWeight={600} fill="#fff" fontFamily={FONT}>
                {lines.map((l, i) => (
                  <tspan key={i} x={800} dy={i === 0 ? 0 : 60}>{l}</tspan>
                ))}
              </text>
            </g>
          </Frame>
        );
      }
      if (v.kind === "table") {
        const cols = v.head.length;
        const widths = cols === 3 ? [200, 260, 820] : [640, 640];
        const xs = widths.map((_, i) => 160 + 36 + widths.slice(0, i).reduce((a, b) => a + b, 0));
        const rowH = Math.min(110, 520 / (v.rows.length + 1));
        return (
          <Frame kicker={kicker} title={sc.title} t={t} seconds={seconds}>
            {v.head.some(Boolean) && (
              <g opacity={fade(t, 0.02, 0.1)}>
                {v.head.map((hd, i) => (
                  <text key={i} x={xs[i]} y={250 + rowH * 0.6} fontSize={26} letterSpacing={3} fill={PEACH} fontFamily={FONT}>{hd.toUpperCase()}</text>
                ))}
              </g>
            )}
            {v.rows.map((r, k) => {
              const y = 250 + rowH * (k + 1);
              return (
                <Row key={k} y={y} h={rowH - 14} k={appear(atOf(k), sentence, t, sp)}>
                  {r.map((c, i) => (
                    <text key={i} x={xs[i]} y={y + (rowH - 14) / 2 + 14} fontSize={i === 0 ? 40 : 36} fontWeight={i === 0 ? 800 : 500} fill={i === 0 ? "#fff" : MUTED} fontFamily={FONT}>{c}</text>
                  ))}
                </Row>
              );
            })}
          </Frame>
        );
      }
      // points and steps
      const items = v.kind === "points" ? v.points : v.steps.map((s) => ({ title: s, body: undefined, icon: undefined as HowToIcon | undefined }));
      const n = items.length;
      // Rows sit between the title and the caption strip (y 220–760).
      const gap = 16;
      const area = 540;
      const rowH = Math.min(112, (area - gap * (n - 1)) / n);
      const top = 220 + Math.max(0, (area - n * rowH - gap * (n - 1)) / 2) * 0.5;
      return (
        <Frame kicker={kicker} title={sc.title} t={t} seconds={seconds}>
          {items.map((it, k) => {
            const y = top + k * (rowH + gap);
            const cy = y + rowH / 2;
            const shown = appear(atOf(k), sentence, t, sp);
            const r = Math.min(40, rowH * 0.36);
            return (
              <Row key={k} y={y} h={rowH} k={shown}>
                {v.kind === "steps" ? (
                  <g>
                    <circle cx={160 + 36 + r} cy={cy} r={r} fill={PEACH} />
                    <text x={160 + 36 + r} y={cy + r * 0.4} textAnchor="middle" fontSize={r * 1.1} fontWeight={800} fill={BG} fontFamily={FONT}>{k + 1}</text>
                  </g>
                ) : (
                  <IconDisc icon={it.icon!} x={160 + 36 + r} y={cy} r={r} />
                )}
                <text x={160 + 36 + r * 2 + 32} y={it.body ? cy - 4 : cy + 14} fontSize={it.body ? 38 : 40} fontWeight={700} fill="#fff" fontFamily={FONT}>{it.title}</text>
                {it.body && (
                  <text x={160 + 36 + r * 2 + 32} y={cy + 34} fontSize={28} fill={MUTED} fontFamily={FONT}>{it.body}</text>
                )}
              </Row>
            );
          })}
        </Frame>
      );
    },
  };
}

/** The guide's scenes (brand intro first), for the player and the MP4 renderer. */
export function buildHowToScenes(script: HowToScript, opts: { kicker: string; summary: string; recorded: boolean }): Scene[] {
  const first = script.scenes[0]!;
  return [
    brandIntroScene("CHARTER KNOW-HOW", first.title, opts.kicker, opts.recorded ? "/api/narration/intro" : undefined),
    ...script.scenes.map((sc) => sceneFor(sc, `Charter know-how · ${opts.kicker}`, opts.summary)),
  ];
}

export default function HowToVideo({ script, title, kicker, summary, recorded = false }: { script: HowToScript; title: string; kicker: string; summary: string; recorded?: boolean }) {
  const scenes = useMemo(() => buildHowToScenes(script, { kicker, summary, recorded }), [script, kicker, summary, recorded]);
  const source = { id: howToNarrationId(script.id), speak: script.speak };
  return <GuidePlayer title={title} scenes={scenes} pronounce={script.speak} poster={1} audioUrl={recorded ? (text: string) => narrationUrl(source, text) : undefined} />;
}
