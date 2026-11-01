import type { AppEnv } from "@/lib/env";
import { sentenceHash } from "@/lib/cruising/narration";
import { narrationPrefix, voiceEnabled } from "@/lib/cruising/voice";
import type { StoredVideo } from "@/lib/cruising/videos";
import { HOWTO, SERIES, type HowToGuide } from "./howto";
import { HOWTO_SCRIPTS } from "./howto-scripts";

// Charter know-how videos as MP4s for YouTube, made by the videos workflow from
// /render/howto/<id> and stored in R2 as videos/howto/<id>-<version>.mp4, with a
// .jpg thumbnail and a .json of chapter times beside each. The version changes
// when the script, the guide's summary, the voice or the design changes.

/** Bump when the know-how video visuals change, so every one is rendered again. */
export const HOWTO_VIDEO_DESIGN = "v1";
export const HOWTO_VIDEO_PREFIX = "videos/howto/";

export function howToVideoVersion(env: AppEnv, id: string): string {
  const g = HOWTO.find((x) => x.id === id);
  const series = SERIES.find((s) => s.id === g?.series)?.title ?? "";
  return sentenceHash(JSON.stringify(HOWTO_SCRIPTS[id] ?? null) + (g?.summary ?? "") + series + HOWTO_VIDEO_DESIGN + (voiceEnabled(env) ? narrationPrefix(env) : "device"));
}

export function howToVideoKey(id: string, version: string): string {
  return `${HOWTO_VIDEO_PREFIX}${id}-${version}.mp4`;
}

/** The newest stored MP4 per guide, and whether it matches the current version. */
export async function storedHowToVideos(env: AppEnv): Promise<Map<string, StoredVideo>> {
  const out = new Map<string, StoredVideo>();
  if (!env.PHOTOS) return out;
  const all: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.PHOTOS.list({ prefix: HOWTO_VIDEO_PREFIX, cursor, limit: 1000 });
    all.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  for (const g of HOWTO) {
    const mine = all.filter((o) => o.key.startsWith(`${HOWTO_VIDEO_PREFIX}${g.id}-`) && o.key.endsWith(".mp4")).sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());
    const currentKey = howToVideoKey(g.id, howToVideoVersion(env, g.id));
    const pick = mine.find((o) => o.key === currentKey) ?? mine[0];
    if (pick) out.set(g.id, { key: pick.key, size: pick.size, uploaded: pick.uploaded, current: pick.key === currentKey });
  }
  return out;
}

const clock = (s: number) => {
  const t = Math.floor(s);
  const m = Math.floor(t / 60);
  return `${m}:${String(t % 60).padStart(2, "0")}`;
};

/** YouTube title and description, with chapters when the render stored their times. */
export function howToYoutubeText(g: HowToGuide, url: string, chapters: { title: string; start: number }[] | null): { title: string; description: string } {
  const series = SERIES.find((s) => s.id === g.series)?.title ?? "";
  const title = `${g.title} | Charter know-how`.slice(0, 100);
  const lines = [g.summary, "", `Part of Charter know-how (${series}) from Nautical Nomads. The full guide, with printable checklists:`, url];
  // YouTube needs the first chapter at 0:00 and at least three, each ten seconds or longer.
  const ch = (chapters ?? []).filter((c, i, a) => i === 0 || c.start - a[i - 1]!.start >= 10);
  if (ch.length >= 3) {
    lines.push("", "Chapters");
    ch.forEach((c, i) => lines.push(`${clock(i === 0 ? 0 : c.start)} ${i === 0 ? "Introduction" : c.title}`));
  }
  lines.push("", "General guidance for charter crews: your charter company's briefing, the boat's manuals and local rules always come first.", "", "#sailing #yachtcharter #sailingtips #learntosail #nauticalnomads");
  return { title, description: lines.join("\n") };
}
