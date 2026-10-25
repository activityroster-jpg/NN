import Anthropic from "@anthropic-ai/sdk";
import type { AppEnv } from "@/lib/env";

// Writes an Instagram caption for a dropped photo. Claude looks at the
// photo when ANTHROPIC_API_KEY is set; otherwise Cloudflare's built-in
// vision model has a go; otherwise a plain template, so the queue never
// waits on a caption. The admin can always edit the result.

export type CaptionSource = "claude" | "workers-ai" | "template";

const VOICE = `You write Instagram captions for Nautical Nomads (@thenauticalnomads), a yacht charter agency: sailing holidays in the Mediterranean, the Caribbean and the Indian Ocean, with or without a skipper, for people who may never have sailed before. Voice: warm, plain British English, confident, unhurried; a friend who sails. No hype, no exclamation marks, at most one emoji and usually none, no "Dive in" or "Set sail" clichés, no claims about the photo you cannot see (if you cannot tell where it is, do not name a place). Two to four short sentences that describe the moment and why it is good, then an optional soft invitation to plan a week. Then a blank line and five to eight lowercase hashtags, specific before generic. Under 400 characters before the hashtags. Return only the caption.`;

const DEFAULT_TAGS = "#sailing #yachtcharter #sailingholiday #mediterranean #boatlife #nauticalnomads";

function tidy(text: string): string {
  let t = text.trim().replace(/^["“]+|["”]+$/g, "").trim();
  if (t.length > 2200) t = t.slice(0, 2190).trim();
  const tags = t.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  if (tags.length > 30) for (const extra of tags.slice(30)) t = t.replace(extra, "").trim();
  return t;
}

function template(note: string): string {
  const lead = note ? note.replace(/\s+/g, " ").trim().replace(/[.]*$/, ".") : "A week on the water, at your own pace.";
  return `${lead} Plan yours with Nautical Nomads.\n\n${DEFAULT_TAGS}`;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function ask(note: string): string {
  return `Write the caption for this photo.${note ? ` What we know about it: ${note}` : " Nothing else is known about it."}`;
}

async function withClaude(env: AppEnv, image: ArrayBuffer, note: string): Promise<string | null> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const res = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4096,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: VOICE,
    messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: toBase64(image) } }, { type: "text", text: ask(note) }] }],
  });
  if (res.stop_reason === "refusal") return null;
  const text = res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text.trim() || null;
}

async function withWorkersAi(env: AppEnv, image: ArrayBuffer, note: string): Promise<string | null> {
  const out = await env.AI!.run("@cf/meta/llama-3.2-11b-vision-instruct", { prompt: `${VOICE}\n\n${ask(note)}`, image: [...new Uint8Array(image)], max_tokens: 400 });
  const text = typeof out === "string" ? out : ((out as { response?: string }).response ?? "");
  return text.trim() || null;
}

export async function generateCaption(env: AppEnv, image: ArrayBuffer, note: string): Promise<{ caption: string; source: CaptionSource }> {
  if (env.ANTHROPIC_API_KEY) {
    try {
      const c = await withClaude(env, image, note);
      if (c) return { caption: tidy(c), source: "claude" };
    } catch (e) {
      console.error("caption (claude)", e);
    }
  }
  if (env.AI) {
    try {
      const c = await withWorkersAi(env, image, note);
      if (c) return { caption: tidy(c), source: "workers-ai" };
    } catch (e) {
      console.error("caption (workers ai)", e);
    }
  }
  return { caption: template(note), source: "template" };
}

/** Which writer the admin can expect. */
export function captionWriter(env: AppEnv): CaptionSource {
  return env.ANTHROPIC_API_KEY ? "claude" : env.AI ? "workers-ai" : "template";
}
