"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addInstagramPost } from "@/lib/admin/social-actions";

// Drop a photo, choose the shape, add it to the queue. The crop and the JPEG
// conversion happen in the browser, so the server only ever receives a
// ready-to-post 1080-wide JPEG (Instagram accepts JPEG only, 4:5 to 1.91:1).

const SHAPES = [
  { key: "portrait", label: "Portrait 4:5", w: 1080, h: 1350 },
  { key: "square", label: "Square 1:1", w: 1080, h: 1080 },
  { key: "landscape", label: "Landscape 1.91:1", w: 1080, h: 566 },
] as const;
type ShapeKey = (typeof SHAPES)[number]["key"];

const WRITER_LABEL = { claude: "Claude writes the caption from the photo", "workers-ai": "Cloudflare's built-in model writes the caption (add ANTHROPIC_API_KEY for better ones)", template: "No caption writer is set up: a plain caption is used, edit it before it posts" };

/** Centre-crop and scale the photo to the shape, without any grading. */
async function crop(file: File, w: number, h: number): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.max(w / bmp.width, h / bmp.height);
  const sw = w / scale;
  const sh = h / scale;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, w, h);
  bmp.close();
  return canvas;
}

export interface Look {
  /** The house grade: on by default so the grid looks like one set. */
  enabled: boolean;
  /** -20 … 20 */
  brightness: number;
  /** -20 … 20 */
  warmth: number;
}
export const DEFAULT_LOOK: Look = { enabled: true, brightness: 0, warmth: 0 };

/**
 * The house look, in plain pixel maths so every browser renders it the same:
 * auto-levels (so phone photos with different exposure line up), a lifted
 * black point and gentle S-curve, slightly muted colour, a touch of warmth
 * and a soft vignette. Brightness and warmth are the only knobs.
 */
function grade(ctx: CanvasRenderingContext2D, w: number, h: number, look: Look) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) hist[((d[i]! * 299 + d[i + 1]! * 587 + d[i + 2]! * 114) / 1000) | 0]!++;
  const total = w * h;
  let lo = 0;
  let hi = 255;
  for (let v = 0, acc = 0; v < 256; v++) if ((acc += hist[v]!) >= total * 0.005) { lo = v; break; }
  for (let v = 255, acc = 0; v >= 0; v--) if ((acc += hist[v]!) >= total * 0.005) { hi = v; break; }
  if (hi - lo < 40) { lo = 0; hi = 255; } // fog, plain sky: leave the range alone
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    let x = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
    x = 0.03 + x * 0.97; // lifted blacks
    x += (x - 0.5) * 0.08 * (1 - Math.abs(x - 0.5) * 2); // gentle S-curve
    x += (look.brightness / 100) * 0.5;
    lut[v] = Math.round(Math.min(1, Math.max(0, x)) * 255);
  }
  const sat = 0.92;
  const warm = 4 + look.warmth * 0.4;
  const cx = w / 2;
  const cy = h / 2;
  const r2max = cx * cx + cy * cy;
  for (let y = 0, i = 0; y < h; y++) {
    const dy = (y - cy) * (y - cy);
    for (let x = 0; x < w; x++, i += 4) {
      const r = lut[d[i]!]!;
      const g = lut[d[i + 1]!]!;
      const b = lut[d[i + 2]!]!;
      const l = (r * 299 + g * 587 + b * 114) / 1000;
      const v = 1 - (0.16 * ((x - cx) * (x - cx) + dy)) / r2max; // vignette
      d[i] = (l + (r - l) * sat + warm) * v;
      d[i + 1] = (l + (g - l) * sat) * v;
      d[i + 2] = (l + (b - l) * sat - warm) * v;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function toJpeg(base: HTMLCanvasElement, look: Look): Promise<Blob> {
  const out = document.createElement("canvas");
  out.width = base.width;
  out.height = base.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(base, 0, 0);
  if (look.enabled) grade(ctx, out.width, out.height, look);
  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read that image"))), "image/jpeg", 0.9));
}

export function InstagramComposer({ writer, connected }: { writer: keyof typeof WRITER_LABEL; connected: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [shape, setShape] = useState<ShapeKey>("portrait");
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"" | "preparing" | "adding">("");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [over, setOver] = useState(false);
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const blob = useRef<Blob | null>(null);
  const base = useRef<HTMLCanvasElement | null>(null);
  const job = useRef(0);

  // Re-grade the cropped photo; the latest request wins when sliders move quickly.
  const render = async (lk: Look) => {
    if (!base.current) return;
    const mine = ++job.current;
    setBusy("preparing");
    try {
      const b = await toJpeg(base.current, lk);
      if (mine !== job.current) return;
      blob.current = b;
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(b);
      });
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Could not read that image" });
    }
    if (mine === job.current) setBusy("");
  };
  const prepare = async (f: File, key: ShapeKey) => {
    const sh = SHAPES.find((x) => x.key === key)!;
    setBusy("preparing");
    setMsg(null);
    try {
      base.current = await crop(f, sh.w, sh.h);
      await render(look);
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Could not read that image" });
      setBusy("");
    }
  };
  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setMsg({ kind: "error", text: "That is not an image file." });
    setFile(f);
    void prepare(f, shape);
  };
  const changeShape = (key: ShapeKey) => {
    setShape(key);
    if (file) void prepare(file, key);
  };
  const changeLook = (patch: Partial<Look>) => {
    const next = { ...look, ...patch };
    setLook(next);
    void render(next);
  };
  const add = async () => {
    if (!blob.current) return;
    const sh = SHAPES.find((x) => x.key === shape)!;
    setBusy("adding");
    const fd = new FormData();
    fd.set("file", new File([blob.current], "photo.jpg", { type: "image/jpeg" }));
    fd.set("width", String(sh.w));
    fd.set("height", String(sh.h));
    fd.set("note", note);
    const r = await addInstagramPost(fd);
    setBusy("");
    if (r.ok) {
      setMsg({ kind: "ok", text: r.source === "template" ? "Added. No caption writer is set up, so edit the plain caption below before it posts." : "Added to the queue with a caption. Check it below." });
      setFile(null);
      blob.current = null;
      base.current = null;
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      setNote("");
      if (input.current) input.current.value = "";
      router.refresh();
    } else setMsg({ kind: "error", text: r.error });
  };

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-64 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${over ? "border-brand bg-brand-soft/50" : "border-line bg-surface hover:border-ink/40"}`}
      >
        {preview ? (
          <img src={preview} alt="" className="max-h-[420px] rounded-lg shadow" />
        ) : (
          <div className="text-sm text-muted">
            <p className="text-base font-semibold text-ink">Drop a photo here</p>
            <p className="mt-1">or click to choose one. It is cropped to the shape on the right and posted at 1080 px wide.</p>
            {busy === "preparing" && <p className="mt-2">Preparing…</p>}
          </div>
        )}
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold text-muted uppercase">Shape</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {SHAPES.map((x) => (
              <button key={x.key} type="button" onClick={() => changeShape(x.key)} className={`rounded-lg border px-3 py-1.5 ${shape === x.key ? "border-brand bg-brand text-brand-ink" : "border-line bg-card hover:bg-ink/5"}`}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={look.enabled} onChange={(e) => changeLook({ enabled: e.target.checked })} />
            <span className="font-medium">Nautical look</span>
            <span className="text-xs text-muted">same grade on every photo, so the grid matches</span>
          </label>
          {look.enabled && (
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted">
              <label>
                Brightness {look.brightness > 0 ? `+${look.brightness}` : look.brightness}
                <input type="range" min={-20} max={20} value={look.brightness} onChange={(e) => changeLook({ brightness: Number(e.target.value) })} className="mt-1 w-full" />
              </label>
              <label>
                Warmth {look.warmth > 0 ? `+${look.warmth}` : look.warmth}
                <input type="range" min={-20} max={20} value={look.warmth} onChange={(e) => changeLook({ warmth: Number(e.target.value) })} className="mt-1 w-full" />
              </label>
            </div>
          )}
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-muted uppercase">Anything the caption should know</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. Hvar harbour, Croatia, last week's flotilla" className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2" />
        </label>
        <p className="text-xs text-muted">{WRITER_LABEL[writer]}.</p>
        <button type="button" onClick={add} disabled={!preview || busy !== ""} className="btn-primary w-full px-4 py-2 disabled:opacity-50">
          {busy === "adding" ? "Writing the caption…" : "Add to the queue"}
        </button>
        {!connected && <p className="text-xs text-warn">Instagram is not connected yet. Photos still queue; they post once it is.</p>}
        {msg && <p className={`text-xs ${msg.kind === "ok" ? "text-ok" : "text-danger"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
