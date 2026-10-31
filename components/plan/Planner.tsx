"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { IconArrowLeft, IconArrowRight, IconCheck, IconChef, IconHelm, IconUsers } from "@/components/Icons";

export interface PlannerDestination {
  id: string;
  name: string;
  region: string;
  featured: boolean;
  seasonMonths: number[];
  peakMonths: number[];
  gradient: string;
  /** Hero photo (Admin → Photos); the gradient shows until there is one. */
  image: string | null;
}

export interface PlannerText {
  stepWhere: string;
  stepWhen: string;
  stepWho: string;
  whereTitle: string;
  whereMore: string;
  whenTitle: string;
  whenSub: string;
  peak: string;
  outOfSeason: string;
  notSureDates: string;
  notSureDatesLink: string;
  whoTitle: string;
  guestsLabel: string;
  skipperQ: string;
  skipperYes: string;
  skipperYesHelp: string;
  skipperNo: string;
  skipperNoHelp: string;
  skipperUnsure: string;
  skipperUnsureHelp: string;
  chefQ: string;
  chefYes: string;
  chefYesHelp: string;
  chefNo: string;
  typeQ: string;
  typeAny: string;
  monohull: string;
  catamaran: string;
  seeOptions: string;
  stepYacht: string;
  yachtTitle: string;
  yachtSub: string;
  yachtSuggest: string;
  sleeps: string;
  tooSmall: string;
  requestQuote: string;
  estimate: string;
  estimateNote: string;
  details: string;
  withCrew: string;
  back: string;
  next: string;
}

type Skipper = "yes" | "no" | "unsure";

export interface PlannerModel {
  id: string;
  name: string;
  builder: string;
  kind: "monohull" | "catamaran";
  feet: number | null;
  cabins: string;
  berthsMax: number | null;
  cover: string | null;
  /** Crewed charter: the estimate includes the crew, APA on top. */
  crewed: boolean;
}

const MAX_MODELS = 3;

export function Planner({
  locale,
  intlLocale,
  destinations,
  text,
  today,
  initial,
  models,
}: {
  locale: string;
  intlLocale: string;
  destinations: PlannerDestination[];
  text: PlannerText;
  /** ISO date. */
  today: string;
  initial: { d?: string; w?: string; g?: number };
  models: PlannerModel[];
}) {
  const router = useRouter();
  const startDest = destinations.find((d) => d.id === initial.d);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(startDest ? (initial.w ? 2 : 1) : 0);
  const [picked, setPicked] = useState<string[]>([]);
  const [dest, setDest] = useState<PlannerDestination | undefined>(startDest);
  const [week, setWeek] = useState<string | undefined>(initial.w);
  const [guests, setGuests] = useState(initial.g ?? 4);
  const [skipper, setSkipper] = useState<Skipper>("unsure");
  const [chef, setChef] = useState(false);
  const [kind, setKind] = useState<"" | "monohull" | "catamaran">("");
  // Weekly estimates for the chosen destination and week (yacht step).
  const [est, setEst] = useState<{ key: string; currency: string; prices: Record<string, number | null> } | undefined>();
  const estKey = dest && week ? `${dest.id}|${week}` : "";
  useEffect(() => {
    if (step !== 3 || !estKey || est?.key === estKey) return;
    const [d, w] = estKey.split("|") as [string, string];
    let live = true;
    fetch(`/api/estimates?d=${encodeURIComponent(d)}&w=${encodeURIComponent(w)}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ currency: string; prices: Record<string, number | null> }>) : null))
      .then((j) => {
        if (live && j) setEst({ key: estKey, currency: j.currency, prices: j.prices });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [step, estKey, est?.key]);
  const estimateFor = (id: string) => {
    const p = est?.key === estKey ? est.prices[id] : null;
    if (p == null || !est) return null;
    const price = new Intl.NumberFormat(intlLocale, { style: "currency", currency: est.currency, maximumFractionDigits: 0 }).format(p);
    return text.estimate.replace("{price}", price);
  };

  // The next 15 months from this month.
  const months = useMemo(() => {
    const [y, m] = today.split("-").map(Number) as [number, number];
    return Array.from({ length: 15 }, (_, i) => {
      const idx = m - 1 + i;
      return { year: y + Math.floor(idx / 12), month: (idx % 12) + 1 };
    });
  }, [today]);

  const firstSeasonMonth = useMemo(() => {
    if (!dest) return months[0]!;
    return months.find((x) => dest.seasonMonths.includes(x.month)) ?? months[0]!;
  }, [dest, months]);

  const [ym, setYm] = useState<{ year: number; month: number } | undefined>(() => {
    if (initial.w) {
      const [y, m] = initial.w.split("-").map(Number) as [number, number];
      return { year: y, month: m };
    }
    return undefined;
  });
  const activeYm = ym ?? firstSeasonMonth;

  const saturdays = useMemo(() => {
    const out: string[] = [];
    const d = new Date(Date.UTC(activeYm.year, activeYm.month - 1, 1));
    while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1);
    while (d.getUTCMonth() === activeYm.month - 1) {
      const iso = d.toISOString().slice(0, 10);
      // Need at least 3 days' notice.
      if (iso > today && Date.parse(iso) - Date.parse(today) >= 3 * 86_400_000) out.push(iso);
      d.setUTCDate(d.getUTCDate() + 7);
    }
    return out;
  }, [activeYm, today]);

  const monthLabel = (year: number, month: number, style: "short" | "long" = "short") =>
    new Intl.DateTimeFormat(intlLocale, { month: style, year: style === "long" ? "numeric" : undefined, timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  const dayLabel = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  const weekEnd = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + 7 * 86_400_000).toISOString().slice(0, 10);

  const steps = [text.stepWhere, text.stepWhen, text.stepWho, text.stepYacht];
  // Crew sleep aboard too: a skipper or chef takes a berth.
  const people = guests + (skipper === "no" ? 0 : 1) + (chef ? 1 : 0);
  const shown = models.filter((m) => !kind || m.kind === kind);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < MAX_MODELS ? [...p, id] : p));
  const go = () => {
    if (!dest || !week) return;
    const q = new URLSearchParams({ d: dest.id, w: week, g: String(guests), s: skipper, c: chef ? "1" : "0" });
    if (picked.length) q.set("models", picked.join(","));
    router.push(`/${locale}/enquire?${q.toString()}`);
  };

  const featured = destinations.filter((d) => d.featured);
  const others = destinations.filter((d) => !d.featured);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <ol className="mb-8 flex items-center gap-2 text-sm">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <button
              type="button"
              disabled={i > step || (i === 1 && !dest) || (i >= 2 && !week)}
              onClick={() => setStep(i as 0 | 1 | 2 | 3)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-medium ${i === step ? "bg-ink text-surface" : i < step ? "bg-brand-soft text-ink" : "text-muted"}`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${i < step ? "bg-brand text-brand-ink" : "border border-current"}`}>
                {i < step ? <IconCheck className="h-3 w-3" /> : i + 1}
              </span>
              {s}
              {i === 0 && dest && step > 0 ? <span className="hidden text-muted sm:inline">· {dest.name}</span> : null}
              {i === 1 && week && step > 1 ? <span className="hidden text-muted sm:inline">· {dayLabel(week)}</span> : null}
            </button>
            {i < steps.length - 1 && <span className="h-px w-6 bg-line" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section>
          <h1 className="h-display text-4xl sm:text-5xl">{text.whereTitle}</h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {featured.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setDest(d);
                  setYm(undefined);
                  setWeek(undefined);
                  setStep(1);
                }}
                className={`group relative flex h-40 flex-col justify-end overflow-hidden rounded-2xl p-5 text-left text-white ring-offset-2 transition hover:shadow-lg ${dest?.id === d.id ? "ring-2 ring-brand" : ""}`}
                style={d.image ? { backgroundImage: `linear-gradient(rgba(0,0,0,.05),rgba(0,0,0,.55)), url(${d.image})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: d.gradient }}
              >
                <span className="text-xs font-semibold tracking-wider uppercase opacity-85">{d.region}</span>
                <span className="h-display text-3xl leading-tight">{d.name}</span>
                <IconArrowRight className="absolute top-5 right-5 h-5 w-5 opacity-70 transition group-hover:translate-x-1" />
              </button>
            ))}
          </div>
          <p className="mt-8 mb-3 text-sm font-semibold text-muted">{text.whereMore}</p>
          <div className="flex flex-wrap gap-2">
            {others.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`chip ${dest?.id === d.id ? "chip-on" : ""}`}
                onClick={() => {
                  setDest(d);
                  setYm(undefined);
                  setWeek(undefined);
                  setStep(1);
                }}
              >
                {d.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && dest && (
        <section>
          <h1 className="h-display text-4xl sm:text-5xl">{text.whenTitle}</h1>
          <p className="mt-2 text-ink/70">{text.whenSub}</p>
          <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2">
            {months.map((m) => {
              const inSeason = dest.seasonMonths.includes(m.month);
              const on = m.year === activeYm.year && m.month === activeYm.month;
              return (
                <button
                  key={`${m.year}-${m.month}`}
                  type="button"
                  disabled={!inSeason}
                  onClick={() => setYm(m)}
                  className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-sm transition ${on ? "border-brand bg-brand-soft" : "border-line bg-card hover:border-ink/30"} disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  <span className="font-semibold capitalize">{monthLabel(m.year, m.month)}</span>
                  <span className="text-xs text-muted">{m.year}</span>
                </button>
              );
            })}
          </div>
          <h2 className="mt-6 mb-3 text-lg font-semibold capitalize">{monthLabel(activeYm.year, activeYm.month, "long")}</h2>
          {saturdays.length === 0 || !dest.seasonMonths.includes(activeYm.month) ? (
            <p className="text-muted">{text.outOfSeason}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {saturdays.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setWeek(s);
                    setStep(2);
                  }}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${week === s ? "border-brand bg-brand-soft" : "border-line bg-card hover:border-ink/30"}`}
                >
                  <span>
                    <span className="block font-semibold">{dayLabel(s)} → {dayLabel(weekEnd(s))}</span>
                    <span className="text-xs text-muted">7 nights</span>
                  </span>
                  {dest.peakMonths.includes(activeYm.month) && <span className="badge bg-accent/15 text-accent">{text.peak}</span>}
                </button>
              ))}
            </div>
          )}
          <p className="mt-8 text-sm text-ink/70">
            {text.notSureDates}{" "}
            <a className="font-semibold text-brand underline" href={`/${locale}/enquire?d=${dest.id}`}>
              {text.notSureDatesLink}
            </a>
          </p>
          <div className="mt-8">
            <button type="button" className="btn-ghost" onClick={() => setStep(0)}>
              <IconArrowLeft className="h-4 w-4" /> {text.back}
            </button>
          </div>
        </section>
      )}

      {step === 2 && dest && week && (
        <section>
          <h1 className="h-display text-4xl sm:text-5xl">{text.whoTitle}</h1>

          <div className="card mt-8 flex items-center justify-between p-5">
            <span className="flex items-center gap-3 font-semibold">
              <IconUsers className="h-6 w-6 text-sea" /> {text.guestsLabel}
            </span>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="−" className="h-10 w-10 rounded-full border border-line text-xl" onClick={() => setGuests(Math.max(1, guests - 1))}>
                −
              </button>
              <output className="w-8 text-center text-2xl font-semibold" aria-live="polite">{guests}</output>
              <button type="button" aria-label="+" className="h-10 w-10 rounded-full border border-line text-xl" onClick={() => setGuests(Math.min(12, guests + 1))}>
                +
              </button>
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <IconHelm className="h-6 w-6 text-sea" /> {text.skipperQ}
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["yes", text.skipperYes, text.skipperYesHelp],
                  ["no", text.skipperNo, text.skipperNoHelp],
                  ["unsure", text.skipperUnsure, text.skipperUnsureHelp],
                ] as const
              ).map(([v, label, help]) => (
                <label key={v} className={`cursor-pointer rounded-xl border p-4 transition ${skipper === v ? "border-brand bg-brand-soft" : "border-line bg-card hover:border-ink/30"}`}>
                  <input type="radio" name="skipper" value={v} checked={skipper === v} onChange={() => setSkipper(v)} className="sr-only" />
                  <span className="block font-semibold">{label}</span>
                  <span className="mt-1 block text-sm text-ink/70">{help}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <IconChef className="h-6 w-6 text-sea" /> {text.chefQ}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  [true, text.chefYes, text.chefYesHelp],
                  [false, text.chefNo, ""],
                ] as const
              ).map(([v, label, help]) => (
                <label key={String(v)} className={`cursor-pointer rounded-xl border p-4 transition ${chef === v ? "border-brand bg-brand-soft" : "border-line bg-card hover:border-ink/30"}`}>
                  <input type="radio" name="chef" checked={chef === v} onChange={() => setChef(v)} className="sr-only" />
                  <span className="block font-semibold">{label}</span>
                  {help && <span className="mt-1 block text-sm text-ink/70">{help}</span>}
                </label>
              ))}
            </div>
          </fieldset>


          <div className="mt-10 flex items-center justify-between">
            <button type="button" className="btn-ghost" onClick={() => setStep(1)}>
              <IconArrowLeft className="h-4 w-4" /> {text.back}
            </button>
            <button type="button" className="btn-primary px-7 py-3.5 text-base" onClick={() => setStep(3)}>
              {text.seeOptions} <IconArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {step === 3 && dest && week && (
        <section>
          <h1 className="h-display text-4xl sm:text-5xl">{text.yachtTitle}</h1>
          <p className="mt-3 text-ink/75">{text.yachtSub}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                ["", text.typeAny],
                ["catamaran", text.catamaran],
                ["monohull", text.monohull],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" onClick={() => setKind(v)} className={`chip ${kind === v ? "chip-on" : ""}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {shown.map((m) => {
              const on = picked.includes(m.id);
              const small = m.berthsMax != null && m.berthsMax < people;
              const full = !on && picked.length >= MAX_MODELS;
              return (
                <label key={m.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${on ? "border-brand bg-brand-soft" : "border-line bg-card hover:border-ink/30"} ${full ? "opacity-60" : ""}`}>
                  <input type="checkbox" className="sr-only" checked={on} disabled={full} onChange={() => toggle(m.id)} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.cover ?? `/art/yachts/${m.id}-sailing.webp`} alt="" loading="lazy" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold tracking-wider text-muted uppercase">{m.builder}</span>
                    <span className="block font-semibold">{m.name}</span>
                    <span className="block text-sm text-ink/70">
                      {[m.feet ? `${m.feet} ft` : null, m.cabins, m.berthsMax ? text.sleeps.replace("{n}", String(m.berthsMax)) : null].filter(Boolean).join(" · ")}
                      {small && <span className="text-warn"> · {text.tooSmall.replace("{n}", String(people))}</span>}
                    </span>
                    {estimateFor(m.id) && (
                      <span className="mt-1 block text-sm font-semibold">
                        {estimateFor(m.id)}
                        {m.crewed && <span className="font-normal text-ink/70"> · {text.withCrew}</span>}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end justify-between gap-2">
                    {on ? <IconCheck className="h-5 w-5 text-brand" /> : <span className="h-5 w-5" aria-hidden="true" />}
                    <a href={`/${locale}/yachts/${m.id}`} target="_blank" rel="noopener" className="text-sm font-semibold text-brand underline-offset-2 hover:underline" onClick={(e) => e.stopPropagation()}>
                      {text.details} ↗
                    </a>
                  </span>
                </label>
              );
            })}
          </div>
          {est?.key === estKey && <p className="mt-4 text-xs text-muted">{text.estimateNote}</p>}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="btn-ghost" onClick={() => setStep(2)}>
              <IconArrowLeft className="h-4 w-4" /> {text.back}
            </button>
            <div className="flex flex-wrap items-center gap-3">
              {picked.length === 0 && (
                <button type="button" className="btn-secondary" onClick={go}>
                  {text.yachtSuggest}
                </button>
              )}
              <button type="button" className="btn-primary px-7 py-3.5 text-base" disabled={picked.length === 0} onClick={go}>
                {text.requestQuote} <IconArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
