import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Bindings and secrets the Worker receives. Secrets are set in the Cloudflare dashboard. */
export interface AppEnv {
  DB: D1Database;
  /** Self-hosted photos (see wrangler.jsonc). Optional until the bucket exists. */
  PHOTOS?: R2Bucket;
  /** Workers AI (wrangler.jsonc): writes Instagram captions when no Anthropic key is set. */
  AI?: Ai;
  SITE_URL?: string;
  ADMIN_EMAILS?: string;
  CRON_SECRET?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  MMK_API_TOKEN?: string;
  NAUSYS_USERNAME?: string;
  NAUSYS_PASSWORD?: string;
  /** Pexels API key: lets the admin search and pick stock photos. */
  PEXELS_API_KEY?: string;
  /** Unsplash access key: alternative photo source for the admin. */
  UNSPLASH_ACCESS_KEY?: string;
  /** Pixabay API key: photos are downloaded into PHOTOS, never hotlinked (their terms). */
  PIXABAY_API_KEY?: string;
  PIXABAY_API_BASE?: string;
  /** ElevenLabs: recorded narration for the cruising guide videos. */
  ELEVENLABS_API_KEY?: string;
  /** Optional overrides: voice, model, and API base (local testing only). */
  ELEVENLABS_VOICE_ID?: string;
  ELEVENLABS_MODEL?: string;
  ELEVENLABS_API_BASE?: string;
  /** Claude writes the Instagram captions when set (console.anthropic.com). */
  ANTHROPIC_API_KEY?: string;
  /** Instagram Graph API version, e.g. v23.0 (override if Meta retires the default). */
  INSTAGRAM_API_VERSION?: string;
  /** "true" forces the demo fleet even when live credentials are set (staging). */
  DEMO_FLEET?: string;
}

export function getEnv(): AppEnv {
  return getCloudflareContext().env as unknown as AppEnv;
}

export async function getEnvAsync(): Promise<AppEnv> {
  return (await getCloudflareContext({ async: true })).env as unknown as AppEnv;
}

export function siteUrl(env: AppEnv): string {
  return (env.SITE_URL ?? "https://nauticalnomads.com").replace(/\/$/, "");
}

export function adminEmails(env: AppEnv): string[] {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
