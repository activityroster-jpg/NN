// Render one cruising guide or course lesson video to MP4 (1920×1080, 25 fps) from the live site.
//   node scripts/videos/make-guide-video.mjs <site> <guide id> <output file>
//   RENDER_PATH=/render/lesson node scripts/videos/make-guide-video.mjs <site> <lesson slug> <output file>
// Opens <RENDER_PATH>/<id> (default /render/cruising), draws every frame, mixes the recorded narration
// and the intro sting with the same timing and fades as the player, and muxes
// them with ffmpeg. Needs playwright (chromium) and ffmpeg.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const [, , site, id, out] = process.argv;
if (!site || !id || !out) throw new Error("usage: make-guide-video.mjs <site> <guide id> <output.mp4>");
const FPS = 25;
mkdirSync(dirname(out), { recursive: true });
const work = mkdtempSync(join(tmpdir(), `guide-${id}-`));

function run(cmd, args, input) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: [input ? "pipe" : "ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err = (err + d).slice(-4000)));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err}`))));
    if (input) input(p.stdin);
  });
}

// "playwright" in CI; "playwright-core" with a local browser (CHROMIUM_PATH) elsewhere.
const { chromium } = await import("playwright").catch(() => import("playwright-core"));
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(`${site}${process.env.RENDER_PATH || "/render/cruising"}/${id}`, { waitUntil: "load" });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60_000 });
console.log("measuring narration…");
const plan = await page.evaluate(() => window.__prepare());
// For quick tests: VIDEO_LIMIT_SECONDS=30 renders only the start.
const limit = Number(process.env.VIDEO_LIMIT_SECONDS || 0);
if (limit > 0 && limit < plan.duration) {
  plan.duration = limit;
  plan.clips = plan.clips.filter((c) => c.start < limit);
}
const frames = Math.ceil(plan.duration * FPS);
console.log(`${id}: ${plan.duration.toFixed(1)} s, ${plan.clips.length} sentences, ${frames} frames`);

// 1. Picture
const videoFile = join(work, "video.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS), videoFile], { stdio: ["pipe", "ignore", "inherit"] });
const started = Date.now();
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.__seek(t), i / FPS);
  const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!ff.stdin.write(jpg)) await once(ff.stdin, "drain");
  if (i % 500 === 0) console.log(`  frame ${i}/${frames} (${Math.round((Date.now() - started) / 1000)} s)`);
}
ff.stdin.end();
const [code] = await once(ff, "close");
if (code !== 0) throw new Error(`ffmpeg (video) exited ${code}`);
// Thumbnail: the finished week map, for search results and share cards.
await page.evaluate((t) => window.__seek(t), plan.poster);
writeFileSync(out.replace(/\.mp4$/, ".jpg"), await page.screenshot({ type: "jpeg", quality: 88 }));
// Chapter start times, for the YouTube description.
writeFileSync(out.replace(/\.mp4$/, ".json"), JSON.stringify({ duration: plan.duration, chapters: plan.chapters ?? [] }));
await browser.close();

// 2. Sound: every clip at its start time with 15 ms / 25 ms edge fades (no
// clicks), and the intro sting fading out as the first scene ends.
const inputs = [];
const filters = [];
const labels = [];
const fetchTo = async (url, file) => {
  const res = await fetch(new URL(url, site));
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
};
if (plan.intro) {
  const f = join(work, "intro.mp3");
  await fetchTo(plan.intro.url, f);
  inputs.push("-i", f);
  const st = Math.max(0, plan.intro.fadeAt - 0.5);
  filters.push(`[0:a]aresample=44100,aformat=channel_layouts=stereo,volume=0.8,afade=t=out:st=${st.toFixed(3)}:d=0.5[m]`);
  labels.push("[m]");
}
for (const [k, c] of plan.clips.entries()) {
  const f = join(work, `s${k}.mp3`);
  await fetchTo(c.url, f);
  inputs.push("-i", f);
  const n = inputs.length / 2 - 1;
  const ms = Math.round(c.start * 1000);
  filters.push(`[${n}:a]aresample=44100,aformat=channel_layouts=stereo,afade=t=in:d=0.015,afade=t=out:st=${Math.max(0, c.dur - 0.025).toFixed(3)}:d=0.025,adelay=${ms}|${ms}[c${k}]`);
  labels.push(`[c${k}]`);
}
filters.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,apad,atrim=0:${plan.duration.toFixed(3)}[a]`);
const scriptFile = join(work, "mix.txt");
writeFileSync(scriptFile, filters.join(";\n"));
const audioFile = join(work, "audio.m4a");
await run("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex_script", scriptFile, "-map", "[a]", "-c:a", "aac", "-b:a", "192k", audioFile]);

// 3. Together
await run("ffmpeg", ["-y", "-loglevel", "error", "-i", videoFile, "-i", audioFile, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", out]);
rmSync(work, { recursive: true, force: true });
console.log(`✓ ${out}`);
