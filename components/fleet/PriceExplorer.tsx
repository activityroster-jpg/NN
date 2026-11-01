"use client";

import { useMemo, useState } from "react";
import { IconArrowRight } from "@/components/Icons";

export interface PriceWeek {
  /** Saturday, ISO date. */
  w: string;
  season: "low" | "shoulder" | "peak" | "closed";
  /** In the visitor's currency. */
  price: number;
}

export interface PriceDestination {
  id: string;
  name: string;
  weeks: PriceWeek[];
}

const SEASON_LABEL = { low: "Low season", shoulder: "Mid season", peak: "Peak season", closed: "" } as const;

/**
 * The model page's price box: pick a destination and week for that week's
 * estimate, and see how the price moves month by month.
 */
export function PriceExplorer({ modelId, locale, currency, destinations, note, cover = "boat only" }: { modelId: string; locale: string; currency: string; destinations: PriceDestination[]; note: string; cover?: string }) {
  const withWeeks = destinations.filter((d) => d.weeks.length);
  const [destId, setDestId] = useState(withWeeks[0]?.id ?? "");
  const dest = withWeeks.find((d) => d.id === destId) ?? withWeeks[0];
  const [week, setWeek] = useState<string | undefined>(undefined);
  const chosen = dest?.weeks.find((x) => x.w === week) ?? dest?.weeks[0];

  const money = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const day = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

  // Month by month: the lowest and highest week, and the first week to jump to.
  const months = useMemo(() => {
    const out: { ym: string; min: number; max: number; first: string; season: PriceWeek["season"] }[] = [];
    for (const x of dest?.weeks ?? []) {
      const ym = x.w.slice(0, 7);
      const last = out[out.length - 1];
      if (last?.ym === ym) {
        last.min = Math.min(last.min, x.price);
        last.max = Math.max(last.max, x.price);
        if (x.season === "peak" || (x.season === "shoulder" && last.season === "low")) last.season = x.season;
      } else out.push({ ym, min: x.price, max: x.price, first: x.w, season: x.season });
    }
    return out;
  }, [dest]);

  if (!dest || !chosen) return null;
  return (
    <div className="mt-5 rounded-xl bg-brand-soft px-4 py-4">
      <p className="text-xs font-semibold tracking-wider text-brand uppercase">Estimated price</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="sr-only">Destination</span>
          <select
            value={dest.id}
            onChange={(e) => {
              setDestId(e.target.value);
              setWeek(undefined);
            }}
            className="field w-full min-w-0 py-2 text-sm"
          >
            {withWeeks.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className="sr-only">Week starting</span>
          <select value={chosen.w} onChange={(e) => setWeek(e.target.value)} className="field w-full min-w-0 py-2 text-sm">
            {dest.weeks.map((x) => (
              <option key={x.w} value={x.w}>{day(x.w)}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-3">
        <span className="text-3xl font-semibold tabular-nums">{money(chosen.price)}</span> <span className="text-sm text-ink/70">for the week, {cover}</span>
      </p>
      <p className="text-xs text-muted">{SEASON_LABEL[chosen.season]} in {dest.name}</p>
      <a href={`/${locale}/enquire?model=${modelId}&d=${dest.id}&w=${chosen.w}`} className="btn-primary mt-3 text-sm">
        Ask for a quote for this week <IconArrowRight className="h-4 w-4" />
      </a>

      <p className="mt-5 text-xs font-semibold tracking-wider text-muted uppercase">Month by month in {dest.name}</p>
      <MonthChart months={months} selected={chosen.w.slice(0, 7)} onPick={(m) => setWeek(m.first)} money={money} />
      <p className="mt-3 text-xs text-muted">{note}</p>
    </div>
  );
}

type Month = { ym: string; min: number; max: number; first: string; season: PriceWeek["season"] };

/** A round scale top and step for the price axis. */
function niceScale(max: number): { top: number; step: number } {
  const raw = max / 3;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((v) => v >= raw) ?? 10 * mag;
  return { top: Math.ceil(max / step) * step, step };
}

const short = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}`.replace(/\.0$/, "") + "k" : String(n));

/**
 * Column chart, months along the bottom: each column reaches the month's
 * dearest week. Hover (or focus) shows the month's range; click picks its
 * first week. One hue; the selected month is solid, the rest lighter.
 */
function MonthChart({ months, selected, onPick, money }: { months: Month[]; selected: string; onPick: (m: Month) => void; money: (n: number) => string }) {
  const [hover, setHover] = useState<string | undefined>();
  const { top, step } = niceScale(Math.max(1, ...months.map((m) => m.max)));
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const sym = money(0).replace(/[\d\s.,]/g, "");
  const label = (ym: string) => new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));
  const range = (m: Month) => (m.min === m.max ? money(m.max) : `${money(m.min)}–${money(m.max)}`);
  const SEASON = { low: "low season", shoulder: "mid season", peak: "peak season", closed: "" } as const;
  const shown = months.find((m) => m.ym === (hover ?? selected));
  const H = 150;
  return (
    <div className="mt-2">
      <div className="flex gap-2">
        {/* Price axis */}
        <div className="relative w-9 shrink-0 text-right text-[11px] text-muted tabular-nums" style={{ height: H }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
              {t === 0 ? "0" : `${sym}${short(t)}`}
            </span>
          ))}
        </div>
        {/* Plot */}
        <div className="relative min-w-0 flex-1" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className={`absolute inset-x-0 border-t ${t === 0 ? "border-ink/25" : "border-ink/10"}`} style={{ bottom: `${(t / top) * 100}%` }} aria-hidden="true" />
          ))}
          <div className="absolute inset-0 flex items-end gap-1 px-0.5 sm:gap-1.5">
            {months.map((m) => {
              const on = m.ym === selected;
              const lit = on || m.ym === hover;
              const h = (m.max / top) * 100;
              return (
                <button
                  key={m.ym}
                  type="button"
                  onClick={() => onPick(m)}
                  onMouseEnter={() => setHover(m.ym)}
                  onMouseLeave={() => setHover(undefined)}
                  onFocus={() => setHover(m.ym)}
                  onBlur={() => setHover(undefined)}
                  aria-label={`${label(m.ym)} ${m.ym.slice(0, 4)}: ${range(m)} a week, ${SEASON[m.season]}`}
                  aria-pressed={on}
                  className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-t-[4px] focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {on && <span className="absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap text-ink tabular-nums" style={{ bottom: `calc(${h}% + 2px)` }}>{sym}{short(m.max)}</span>}
                  <span className={`block w-full max-w-9 rounded-t-[4px] transition-colors ${on ? "bg-brand" : lit ? "bg-brand/70" : "bg-brand/40"}`} style={{ height: `${h}%` }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Months along the bottom, with the year under January and the first month */}
      <div className="flex gap-2" aria-hidden="true">
        <div className="w-9 shrink-0" />
        <div className="flex min-w-0 flex-1 gap-1 px-0.5 sm:gap-1.5">
          {months.map((m, i) => {
            const yearChange = i === 0 || months[i - 1]!.ym.slice(0, 4) !== m.ym.slice(0, 4);
            return (
              <span key={m.ym} className={`min-w-0 flex-1 pt-1 text-center text-[11px] leading-tight ${m.ym === selected ? "font-semibold text-ink" : "text-muted"}`}>
                {label(m.ym)}
                <span className="block h-3 text-[10px] text-muted">{yearChange ? m.ym.slice(0, 4) : ""}</span>
              </span>
            );
          })}
        </div>
      </div>
      <p className="mt-2 min-h-5 text-sm" aria-live="polite">
        {shown && (
          <>
            <span className="font-semibold">{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${shown.ym}-01T00:00:00Z`))}</span>
            <span className="text-ink/75">: {range(shown)} a week · {SEASON[shown.season]}</span>
          </>
        )}
      </p>
    </div>
  );
}
