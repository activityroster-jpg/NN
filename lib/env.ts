import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Bindings and secrets the Worker receives. Secrets are set in the Cloudflare dashboard. */
export interface AppEnv {
  DB: D1Database;
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
