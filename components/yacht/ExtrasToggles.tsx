"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export interface ExtraOption {
  key: "s" | "c" | "h" | "pv" | "dw" | "g";
  label: string;
  help?: string;
  price?: string;
  disabled?: boolean;
}

/** Crew and extras switches. They live in the URL so the server re-prices on every change. */
export function ExtrasToggles({ options, guests, guestsLabel, maxGuests }: { options: ExtraOption[]; guests: number; guestsLabel: string; maxGuests: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const set = (key: string, value: string) => {
    const q = new URLSearchParams(sp.toString());
    q.set(key, value);
    start(() => router.replace(`${pathname}?${q.toString()}`, { scroll: false }));
  };
  return (
    <div className={`space-y-2 ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      <div className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
        <span className="text-sm font-medium">{guestsLabel}</span>
        <div className="flex items-center gap-2">
          <button type="button" className="h-8 w-8 rounded-full border border-line" aria-label="−" onClick={() => set("g", String(Math.max(1, guests - 1)))}>−</button>
          <span className="w-6 text-center font-semibold">{guests}</span>
          <button type="button" className="h-8 w-8 rounded-full border border-line" aria-label="+" disabled={guests >= maxGuests} onClick={() => set("g", String(Math.min(maxGuests, guests + 1)))}>+</button>
        </div>
      </div>
      {options.map((o) => {
        const on = sp.get(o.key) === "1";
        return (
          <label key={o.key} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${on ? "border-brand bg-brand-soft" : "border-line"} ${o.disabled ? "cursor-not-allowed opacity-50" : ""}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--brand)]" checked={on} disabled={o.disabled} onChange={(e) => set(o.key, e.target.checked ? "1" : "0")} />
            <span className="flex-1">
              <span className="flex items-center justify-between gap-2 text-sm font-medium">
                {o.label}
                {o.price && <span className="text-muted">{o.price}</span>}
              </span>
              {o.help && <span className="mt-0.5 block text-xs text-muted">{o.help}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
