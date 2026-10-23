"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconSliders } from "@/components/Icons";

export interface FilterText {
  filters: string;
  clearFilters: string;
  type: string;
  any: string;
  category: string;
  minCabins: string;
  length: string;
  minYear: string;
  maxPrice: string;
  acOnly: string;
  sort: string;
  sortRecommended: string;
  sortPrice: string;
  sortNewest: string;
  sortLength: string;
  monohull: string;
  catamaran: string;
}

const FILTER_KEYS = ["type", "cat", "ac", "cabins", "len", "year", "max"] as const;

export function Filters({ text, categories, currencySymbol }: { text: FilterText; categories: { id: string; name: string }[]; currencySymbol: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const set = (key: string, value: string) => {
    const q = new URLSearchParams(sp.toString());
    if (value) q.set(key, value);
    else q.delete(key);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };
  const clear = () => {
    const q = new URLSearchParams(sp.toString());
    for (const k of FILTER_KEYS) q.delete(k);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };
  const active = FILTER_KEYS.filter((k) => sp.get(k)).length;

  const select = (key: string, label: string, options: [string, string][]) => (
    <label className="block">
      <span className="field-label">{label}</span>
      <select className="field" value={sp.get(key) ?? ""} onChange={(e) => set(key, e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );

  const body = (
    <div className="space-y-4">
      {select("type", text.type, [["", text.any], ["catamaran", text.catamaran], ["monohull", text.monohull]])}
      {select("cat", text.category, [["", text.any], ...categories.map((c) => [c.id, c.name] as [string, string])])}
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-3 text-[15px]">
        <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={sp.get("ac") === "1"} onChange={(e) => set("ac", e.target.checked ? "1" : "")} />
        {text.acOnly}
      </label>
      {select("cabins", text.minCabins, [["", text.any], ["2", "2+"], ["3", "3+"], ["4", "4+"], ["5", "5+"]])}
      {select("len", text.length, [["", text.any], ["40", "40 ft+"], ["45", "45 ft+"], ["50", "50 ft+"], ["54", "54 ft+"]])}
      {select("year", text.minYear, [["", text.any], ["2018", "2018+"], ["2020", "2020+"], ["2022", "2022+"], ["2024", "2024+"]])}
      {select("max", text.maxPrice, [
        ["", text.any],
        ...[4000, 6000, 8000, 10000, 15000, 20000].map((n) => [String(n), `${currencySymbol}${n.toLocaleString("en-GB")}`] as [string, string]),
      ])}
      {active > 0 && (
        <button type="button" className="text-sm font-semibold text-brand underline" onClick={clear}>
          {text.clearFilters}
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-2 lg:hidden">
        <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setOpen(!open)} aria-expanded={open}>
          <IconSliders className="h-4 w-4" /> {text.filters}
          {active > 0 && <span className="badge bg-brand text-brand-ink">{active}</span>}
        </button>
      </div>
      {open && <div className="card mt-3 p-4 lg:hidden">{body}</div>}
      <div className="hidden lg:block">{body}</div>
    </>
  );
}

export function SortSelect({ text }: { text: FilterText }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">{text.sort}</span>
      <select
        className="rounded-full border border-line bg-card px-3 py-1.5 text-sm font-medium"
        value={sp.get("sort") ?? "recommended"}
        onChange={(e) => {
          const q = new URLSearchParams(sp.toString());
          q.set("sort", e.target.value);
          router.replace(`${pathname}?${q.toString()}`, { scroll: false });
        }}
      >
        <option value="recommended">{text.sortRecommended}</option>
        <option value="price">{text.sortPrice}</option>
        <option value="newest">{text.sortNewest}</option>
        <option value="length">{text.sortLength}</option>
      </select>
    </label>
  );
}
