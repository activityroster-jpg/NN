// Render one short to MP4 (1080×1920, 25 fps) from the live site.
//   node scripts/videos/make-short.mjs <site> <short id> <output file>
// Composes the scene footage (cropped to portrait) with ffmpeg, draws the
// overlay (wordmark, headings, captions, diagrams) frame by frame from
// /render/short/<id> as transparent PNGs on top, then mixes the recorded
// narration over a quiet sea ambience. Needs playwright (chromium) and ffmpeg.
// Local checks: FOOTAGE_FILE=<clip.mp4> uses that clip for every footage
// scene, FOOTAGE_FALLBACK=1 draws a test pattern instead, unrecorded
// sentences stay silent, and VIDEO_LIMIT_SECONDS=15 renders only the start.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const [, , site, id, out] = process.argv;
if (!site || !id || !out) throw new Error("usage: make-short.mjs <site> <short id> <output.mp4>");
const FPS = 25;
const W = 1080;
const H = 1920;
mkdirSync(dirname(out), { recursive: true });
const work = mkdtempSync(join(tmpdir(), `short-${id}-`));

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err = (err + d).slice(-4000)));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err}`))));
  });
}
const fetchTo = async (url, file) => {
  const res = await fetch(new URL(url, site));
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
};

const { chromium } = await import("playwright").catch(() => import("playwright-core"));
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(`${site}/render/short/${id}`, { waitUntil: "load" });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60_000 });
console.log("measuring narration…");
const plan = await page.evaluate(() => window.__prepare());
const limit = Number(process.env.VIDEO_LIMIT_SECONDS || 0);
if (limit > 0 && limit < plan.duration) {
  plan.duration = limit;
  plan.scenes = plan.scenes.filter((s) => s.start < limit).map((s) => ({ ...s, end: Math.min(s.end, limit) }));
  plan.clips = plan.clips.filter((c) => c.start < limit);
}
const frames = Math.ceil(plan.duration * FPS);
const mocked = plan.clips.filter((c) => c.mock).length;
console.log(`${id}: ${plan.duration.toFixed(1)} s, ${plan.scenes.length} scenes, ${plan.clips.length} sentences${mocked ? ` (${mocked} not recorded)` : ""}, ${frames} frames`);
const local = !!(process.env.FOOTAGE_FALLBACK || process.env.FOOTAGE_FILE);
if (mocked && !local) throw new Error("narration is not fully recorded; the workflow only renders ready shorts");

// 1. Background: each scene's footage, cropped to portrait and looped or cut
// to the scene's length; a solid colour where the overlay covers the frame.
const bgFile = join(work, "bg.mp4");
{
  const inputs = [];
  const filters = [];
  const labels = [];
  let n = 0;
  for (const [i, sc] of plan.scenes.entries()) {
    const dur = (sc.end - sc.start).toFixed(3);
    if (sc.kind === "footage" && process.env.FOOTAGE_FALLBACK) {
      filters.push(`testsrc2=size=${W}x${H}:rate=${FPS}:duration=${dur},format=yuv420p[v${i}]`);
    } else if (sc.kind === "footage") {
      let f = process.env.FOOTAGE_FILE;
      if (!f) {
        if (!sc.footage) throw new Error(`scene ${i + 1}: no footage chosen yet`);
        f = join(work, `f${i}.mp4`);
        await fetchTo(sc.footage.url, f);
      }
      inputs.push("-stream_loop", "-1", "-ss", String(sc.footage?.start || 0), "-t", String(Number(dur) + 1), "-i", f);
      filters.push(`[${n++}:v]fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=${dur},trim=duration=${dur},setpts=PTS-STARTPTS[v${i}]`);
    } else {
      filters.push(`color=c=${sc.colour}:size=${W}x${H}:rate=${FPS}:duration=${dur},format=yuv420p[v${i}]`);
    }
    labels.push(`[v${i}]`);
  }
  filters.push(`${labels.join("")}concat=n=${labels.length}:v=1:a=0[bg]`);
  const script = join(work, "bg.txt");
  writeFileSync(script, filters.join(";\n"));
  console.log("composing footage…");
  await run("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex_script", script, "-map", "[bg]", "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-r", String(FPS), bgFile]);
}

// 2. Overlay: every frame of the stage, with alpha, on top of the background.
const videoFile = join(work, "video.mp4");
{
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-i", bgFile, "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-", "-filter_complex", "[1:v]format=rgba[ov];[0:v][ov]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]", "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-r", String(FPS), videoFile], { stdio: ["pipe", "ignore", "inherit"] });
  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.__seek(t), i / FPS);
    const png = await page.screenshot({ type: "png", omitBackground: true });
    if (!ff.stdin.write(png)) await once(ff.stdin, "drain");
    if (i % 250 === 0) console.log(`  frame ${i}/${frames} (${Math.round((Date.now() - started) / 1000)} s)`);
  }
  ff.stdin.end();
  const [code] = await once(ff, "close");
  if (code !== 0) throw new Error(`ffmpeg (overlay) exited ${code}`);
}
await browser.close();

// 3. Sound: each sentence at its start time with short edge fades (no clicks),
// over the ambience looped for the whole length and faded at both ends.
const audioFile = join(work, "audio.m4a");
{
  const inputs = [];
  const filters = [];
  const labels = [];
  let n = 0;
  const dur = plan.duration.toFixed(3);
  if (plan.bed) {
    const f = join(work, "bed.mp3");
    try {
      await fetchTo(plan.bed.url, f);
      inputs.push("-stream_loop", "-1", "-i", f);
      filters.push(`[${n++}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:${dur},asetpts=PTS-STARTPTS,volume=${plan.bed.gain},afade=t=in:d=1,afade=t=out:st=${(plan.duration - 1.5).toFixed(3)}:d=1.5[bed]`);
      labels.push("[bed]");
    } catch (e) {
      console.warn(`no ambience: ${e.message}`);
    }
  }
  for (const [k, c] of plan.clips.entries()) {
    if (c.mock) continue;
    const f = join(work, `s${k}.mp3`);
    await fetchTo(c.url, f);
    inputs.push("-i", f);
    const ms = Math.round(c.start * 1000);
    filters.push(`[${n++}:a]aresample=44100,aformat=channel_layouts=stereo,afade=t=in:d=0.015,afade=t=out:st=${Math.max(0, c.dur - 0.025).toFixed(3)}:d=0.025,adelay=${ms}|${ms}[c${k}]`);
    labels.push(`[c${k}]`);
  }
  if (labels.length === 0) filters.push(`anullsrc=r=44100:cl=stereo,atrim=0:${dur}[a]`);
  else filters.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,apad,atrim=0:${dur}[a]`);
  const script = join(work, "mix.txt");
  writeFileSync(script, filters.join(";\n"));
  await run("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex_script", script, "-map", "[a]", "-c:a", "aac", "-b:a", "160k", audioFile]);
}

// 4. Together, plus the cover (the hook, from the finished video).
await run("ffmpeg", ["-y", "-loglevel", "error", "-i", videoFile, "-i", audioFile, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", out]);
await run("ffmpeg", ["-y", "-loglevel", "error", "-ss", plan.poster.toFixed(2), "-i", out, "-frames:v", "1", "-q:v", "2", out.replace(/\.mp4$/, ".jpg")]);
rmSync(work, { recursive: true, force: true });
console.log(`✓ ${out}`);
