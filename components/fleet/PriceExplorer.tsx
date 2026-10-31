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

const SEASON_LABEL = { low: "Low season", shoulder: "Shoulder season", peak: "Peak season", closed: "" } as const;
const SEASON_TONE = { low: "bg-sea/50", shoulder: "bg-warn/60", peak: "bg-brand", closed: "bg-ink/20" } as const;

/**
 * The model page's price box: pick a destination and week for that week's
 * estimate, and see how the price moves month by month.
 */
export function PriceExplorer({ modelId, locale, currency, destinations, note }: { modelId: string; locale: string; currency: string; destinations: PriceDestination[]; note: string }) {
  const withWeeks = destinations.filter((d) => d.weeks.length);
  const [destId, setDestId] = useState(withWeeks[0]?.id ?? "");
  const dest = withWeeks.find((d) => d.id === destId) ?? withWeeks[0];
  const [week, setWeek] = useState<string | undefined>(undefined);
  const chosen = dest?.weeks.find((x) => x.w === week) ?? dest?.weeks[0];

  const money = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const day = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  const monthName = (ym: string) => new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));

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
  const top = Math.max(1, ...months.map((m) => m.max));

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
        <span className="text-3xl font-semibold tabular-nums">{money(chosen.price)}</span> <span className="text-sm text-ink/70">for the week, boat only</span>
      </p>
      <p className="text-xs text-muted">{SEASON_LABEL[chosen.season]} in {dest.name}</p>
      <a href={`/${locale}/enquire?model=${modelId}&d=${dest.id}&w=${chosen.w}`} className="btn-primary mt-3 text-sm">
        Ask for a quote for this week <IconArrowRight className="h-4 w-4" />
      </a>

      <p className="mt-5 text-xs font-semibold tracking-wider text-muted uppercase">Month by month in {dest.name}</p>
      <ul className="mt-2 space-y-1">
        {months.map((m) => {
          const on = chosen.w.slice(0, 7) === m.ym;
          return (
            <li key={m.ym}>
              <button type="button" onClick={() => setWeek(m.first)} className={`grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-2 rounded-md px-1 py-0.5 text-left text-sm hover:bg-card/70 ${on ? "bg-card font-semibold" : ""}`}>
                <span>{monthName(m.ym)}</span>
                <span className="h-2 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                  <span className={`block h-full rounded-full ${SEASON_TONE[m.season]}`} style={{ width: `${Math.round((m.max / top) * 100)}%` }} />
                </span>
                <span className="tabular-nums">{m.min === m.max ? money(m.min) : `${money(m.min)}–${money(m.max)}`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">{note}</p>
    </div>
  );
}
