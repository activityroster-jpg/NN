"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { clearSlot, refreshSlot, uploadToSlot } from "@/lib/admin/photo-actions";

export interface BoardSlot {
  key: string;
  label: string;
  query: string;
  group: "home" | "featured" | "other" | "gallery" | "models";
  url: string | null;
  credit: string | null;
  /** Takes uploads only (no Refresh, not filled from the library). */
  uploadOnly?: boolean;
}

const STOCK_CREDIT = /\/ (Pixabay|Unsplash)$/;

type Status = "idle" | "queued" | "fetching" | "uploading" | "error";

/**
 * Every photo slot on the site. Refresh requests join a queue that is worked
 * one at a time; the server allows one stock-photo API call per `gapSec`, so
 * the board waits and retries rather than hammering the API. Drag a file onto
 * a tile (or click "Upload") to use your own photo.
 */
export function PhotoBoard({ slots: initial, gapSec, sourceLabel }: { slots: BoardSlot[]; gapSec: number; sourceLabel: string | null }) {
  const [slots, setSlots] = useState(initial);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [queue, setQueue] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(0);
  const seen = useRef<Record<string, string[]>>({});
  const working = useRef(false);
  const queries = useRef<Record<string, string>>({});

  const update = (key: string, patch: Partial<BoardSlot>) => setSlots((all) => all.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const setS = (key: string, st: Status, m = "") => {
    setStatus((x) => ({ ...x, [key]: st }));
    setMsg((x) => ({ ...x, [key]: m }));
  };

  const enqueue = (key: string) => {
    setQueue((q) => (q.includes(key) ? q : [...q, key]));
    setS(key, "queued", "Queued");
  };

  // Work the queue: one slot at a time, pausing when the server asks us to wait.
  useEffect(() => {
    if (working.current || queue.length === 0) return;
    const key = queue[0]!;
    working.current = true;
    (async () => {
      setS(key, "fetching", "Finding a photo…");
      const r = await refreshSlot(key, seen.current[key] ?? [], queries.current[key]);
      if (r.ok) {
        seen.current[key] = [...(seen.current[key] ?? []), r.sourceId];
        update(key, { url: r.url, credit: r.credit });
        setS(key, "idle", "");
        setQueue((q) => q.slice(1));
        // Space out the next API call even when this one was served from cache.
        await pause(queue.length > 1 ? Math.min(gapSec, 5) : 0, setCountdown);
      } else if ("wait" in r) {
        setS(key, "queued", `Waiting ${r.wait}s for the photo service…`);
        await pause(r.wait, setCountdown);
      } else {
        setS(key, "error", r.error);
        setQueue((q) => q.slice(1));
      }
      working.current = false;
      // Trigger the effect again.
      setQueue((q) => [...q]);
    })();
  }, [queue, gapSec]);

  const onFiles = async (key: string, files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setS(key, "error", "That is not an image file.");
    if (f.size > 12 * 1024 * 1024) return setS(key, "error", "Larger than 12 MB.");
    setS(key, "uploading", "Uploading…");
    const fd = new FormData();
    fd.set("key", key);
    fd.set("file", f);
    const r = await uploadToSlot(fd);
    if (r.ok) {
      update(key, { url: r.url, credit: null });
      setS(key, "idle", "");
    } else setS(key, "error", r.error);
  };

  const empty = slots.filter((s) => !s.url && !s.uploadOnly).map((s) => s.key);

  // Yacht models: one model's slots at a time.
  const modelIds = [...new Set(slots.filter((s) => s.group === "models").map((s) => s.key.split(":")[1]!))];
  const [model, setModel] = useState(modelIds[0] ?? "");
  const [credit, setCredit] = useState("");
  const [batchMsg, setBatchMsg] = useState("");
  const modelSlots = slots.filter((s) => s.group === "models" && s.key.split(":")[1] === model);
  /** Several photos for the chosen model: into empty slots, then over library photos, in order. */
  const addPhotos = async (files: FileList | null) => {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const targets = [...modelSlots.filter((s) => !s.url), ...modelSlots.filter((s) => s.url && STOCK_CREDIT.test(s.credit ?? ""))];
    if (list.length > targets.length) setBatchMsg(`Only ${targets.length} free slot${targets.length === 1 ? "" : "s"} for this yacht: clear some of your photos to add more.`);
    let done = 0;
    for (const [i, f] of list.slice(0, targets.length).entries()) {
      const key = targets[i]!.key;
      if (f.size > 12 * 1024 * 1024) {
        setS(key, "error", "Larger than 12 MB.");
        continue;
      }
      setS(key, "uploading", "Uploading…");
      const fd = new FormData();
      fd.set("key", key);
      fd.set("file", f);
      if (credit.trim()) fd.set("credit", credit.trim());
      const r = await uploadToSlot(fd);
      if (r.ok) {
        update(key, { url: r.url, credit: credit.trim() || null });
        setS(key, "idle", "");
        done++;
      } else setS(key, "error", r.error);
    }
    if (list.length <= targets.length) setBatchMsg(`Added ${done} photo${done === 1 ? "" : "s"}.`);
  };
  const groups: [string, BoardSlot["group"]][] = [
    ["Home page", "home"],
    ["Featured destinations", "featured"],
    ["Other destinations", "other"],
    ["Destination page galleries", "gallery"],
    ["Yacht models (up to 10 photos each)", "models"],
  ];

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <button type="button" className="btn-primary px-4 py-2 text-sm" disabled={!sourceLabel || empty.length === 0} onClick={() => empty.forEach(enqueue)}>
          Fill the {empty.length} empty slot{empty.length === 1 ? "" : "s"}
        </button>
        <p className="text-sm text-muted">
          {sourceLabel ? `Photos from ${sourceLabel}, one request every ${gapSec} seconds.` : "No stock-photo key set: you can still drag your own photos onto the tiles."}
          {queue.length > 0 && ` · ${queue.length} in queue${countdown > 0 ? `, next in ${countdown}s` : ""}`}
        </p>
      </div>

      {groups.map(([title, g]) => (
        <section key={g}>
          <h2 className="mb-3 font-semibold">{title}</h2>
          {g === "models" && (
            <div className="card mb-4 space-y-3 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="field-label">Yacht</span>
                  <select value={model} onChange={(e) => { setModel(e.target.value); setBatchMsg(""); }} className="field py-1.5">
                    {modelIds.map((id) => (
                      <option key={id} value={id}>{slots.find((s) => s.key === `model:${id}:g1`)?.label.replace(/ · photo 1$/, "") ?? id}</option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-56 flex-1">
                  <span className="field-label">Credit shown under the photos (optional)</span>
                  <input value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="© Lagoon / photographer" className="field py-1.5" />
                </label>
                <label className="btn-primary cursor-pointer px-4 py-2 text-sm">
                  Add photos
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
                </label>
              </div>
              <p className="text-xs text-muted">
                Up to {modelSlots.length} photos per yacht, in order. Photos 1–5 fill themselves with library photos of a similar yacht; once you add any photo of your own, the yacht&apos;s page shows only yours. Choose several files at once: they go into empty slots first, then replace library photos.
              </p>
              {batchMsg && <p className="text-sm">{batchMsg}</p>}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(g === "models" ? modelSlots : slots.filter((s) => s.group === g))
              .map((s) => (
                <Tile key={s.key} slot={s} status={status[s.key] ?? "idle"} message={msg[s.key] ?? ""} canRefresh={!!sourceLabel && !s.uploadOnly}
                  onRefresh={() => enqueue(s.key)}
                  onQuery={(q) => { queries.current[s.key] = q; }}
                  onFiles={(f) => onFiles(s.key, f)}
                  onClear={async () => { await clearSlot(s.key); update(s.key, { url: null, credit: null }); }}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function pause(sec: number, tick: (n: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let left = Math.ceil(sec);
    tick(left);
    if (left <= 0) return resolve();
    const id = setInterval(() => {
      left -= 1;
      tick(Math.max(0, left));
      if (left <= 0) {
        clearInterval(id);
        resolve();
      }
    }, 1000);
  });
}

function Tile({ slot, status, message, canRefresh, onRefresh, onQuery, onFiles, onClear }: {
  slot: BoardSlot; status: Status; message: string; canRefresh: boolean;
  onRefresh: () => void; onQuery: (q: string) => void; onFiles: (f: FileList | null) => void; onClear: () => void;
}) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const busy = status === "fetching" || status === "uploading" || status === "queued";
  return (
    <div
      className={`card overflow-hidden ${over ? "ring-2 ring-brand" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
    >
      <div className="relative aspect-[16/10] bg-surface-2">
        {slot.url ? <img src={slot.url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted">Drop a photo here</div>}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">{message}</div>}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{slot.label}</p>
            <p className="truncate text-xs text-muted">{slot.credit ?? (slot.url ? "Your photo" : "Empty")}</p>
          </div>
        </div>
        <input defaultValue={slot.query} onChange={(e) => onQuery(e.target.value)} className="field py-1 text-xs" title="Search words used by Refresh" />
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="btn-secondary px-3 py-1 text-xs" disabled={!canRefresh || busy} onClick={onRefresh}>Refresh</button>
          <button type="button" className="btn-secondary px-3 py-1 text-xs" disabled={busy} onClick={() => input.current?.click()}>Upload</button>
          {slot.url && <button type="button" className="btn-ghost px-2 py-1 text-xs text-danger" disabled={busy} onClick={onClear}>Clear</button>}
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </div>
        {status === "error" && <p className="text-xs text-danger">{message}</p>}
      </div>
    </div>
  );
}
