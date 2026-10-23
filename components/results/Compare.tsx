"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";

const KEY = "nn_compare";
const MAX = 3;

interface Ctx {
  keys: string[];
  toggle: (key: string) => void;
  clear: () => void;
}

const CompareCtx = createContext<Ctx>({ keys: [], toggle: () => {}, clear: () => {} });

/** Compare selection, remembered per trip (destination + week) in this browser only. */
export function CompareProvider({ scope, children }: { scope: string; children: React.ReactNode }) {
  const [keys, setKeys] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, string[]>;
      setKeys(Array.isArray(raw[scope]) ? raw[scope]!.slice(0, MAX) : []);
    } catch {
      setKeys([]);
    }
  }, [scope]);
  const persist = (next: string[]) => {
    setKeys(next);
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, string[]>;
      raw[scope] = next;
      localStorage.setItem(KEY, JSON.stringify(raw));
    } catch {
      /* storage unavailable: keep in memory */
    }
  };
  return (
    <CompareCtx.Provider
      value={{
        keys,
        toggle: (k) => persist(keys.includes(k) ? keys.filter((x) => x !== k) : keys.length >= MAX ? keys : [...keys, k]),
        clear: () => persist([]),
      }}
    >
      {children}
    </CompareCtx.Provider>
  );
}

export function CompareToggle({ yachtKey, labelAdd, labelOn }: { yachtKey: string; labelAdd: string; labelOn: string }) {
  const { keys, toggle } = useContext(CompareCtx);
  const on = keys.includes(yachtKey);
  const full = !on && keys.length >= MAX;
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-sm ${full ? "cursor-not-allowed opacity-50" : ""}`}>
      <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={on} disabled={full} onChange={() => toggle(yachtKey)} />
      {on ? labelOn : labelAdd}
    </label>
  );
}

export function CompareTray({ href, labelCompare, hint, clearLabel }: { href: string; labelCompare: string; hint: string; clearLabel: string }) {
  const { keys, clear } = useContext(CompareCtx);
  if (keys.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur">
      <div className="container-page flex items-center justify-between gap-3 py-3">
        <p className="text-sm text-muted">{keys.length < 2 ? hint : `${keys.length} / ${MAX}`}</p>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost text-sm" onClick={clear}>
            {clearLabel}
          </button>
          <Link
            href={`${href}&y=${encodeURIComponent(keys.join(","))}`}
            aria-disabled={keys.length < 2}
            className={`btn-primary px-5 py-2.5 text-sm ${keys.length < 2 ? "pointer-events-none opacity-50" : ""}`}
          >
            {labelCompare.replace("{n}", String(keys.length))}
          </Link>
        </div>
      </div>
    </div>
  );
}
