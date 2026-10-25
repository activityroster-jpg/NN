import type { AppEnv } from "@/lib/env";

// Instagram's content publishing API ("Instagram API with Instagram Login":
// a professional account and a Meta app, no Facebook Page needed). The
// long-lived token comes from the app dashboard and is refreshed by us.

const GRAPH = "https://graph.instagram.com";
const version = (env: AppEnv) => env.INSTAGRAM_API_VERSION ?? "v23.0";

export interface IgMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
}

interface IgError {
  error?: { message?: string; code?: number; error_subcode?: number };
}

async function call<T>(env: AppEnv, path: string, token: string, init?: { method?: "GET" | "POST"; form?: Record<string, string> }): Promise<T> {
  const url = new URL(`${GRAPH}/${version(env)}/${path}`);
  const method = init?.method ?? "GET";
  const body = new URLSearchParams(init?.form ?? {});
  if (method === "GET") {
    url.searchParams.set("access_token", token);
    for (const [k, v] of body) url.searchParams.set(k, v);
  } else body.set("access_token", token);
  const res = await fetch(url, { method, body: method === "POST" ? body : undefined, signal: AbortSignal.timeout(30_000) });
  const data = (await res.json().catch(() => ({}))) as T & IgError;
  if (!res.ok || data.error) {
    const e = data.error;
    throw new Error(`Instagram: ${e?.message ?? res.status}${e?.code ? ` (code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ""})` : ""}`);
  }
  return data;
}

/** Who the token belongs to. */
export async function igMe(env: AppEnv, token: string): Promise<{ id: string; userId: string; username: string }> {
  const me = await call<{ id: string; user_id?: string; username: string }>(env, "me", token, { form: { fields: "id,user_id,username" } });
  return { id: me.id, userId: me.user_id ?? me.id, username: me.username };
}

/** A fresh 60-day token; the current one must be at least a day old and not yet expired. */
export async function igRefresh(env: AppEnv, token: string): Promise<{ accessToken: string; expiresIn: number }> {
  const r = await call<{ access_token: string; expires_in: number }>(env, "refresh_access_token", token, { form: { grant_type: "ig_refresh_token" } });
  return { accessToken: r.access_token, expiresIn: r.expires_in };
}

/** The account's latest posts, newest first. */
export async function igRecentMedia(env: AppEnv, token: string, limit = 12): Promise<IgMedia[]> {
  const r = await call<{ data: IgMedia[] }>(env, "me/media", token, { form: { fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp", limit: String(limit) } });
  return r.data ?? [];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Publish one photo: create a media container from a public JPEG URL, wait
 * until Instagram has fetched it, then publish. Returns the post id and link.
 */
export async function igPublishImage(env: AppEnv, userId: string, token: string, imageUrl: string, caption: string): Promise<{ id: string; permalink: string | null }> {
  const container = await call<{ id: string }>(env, `${userId}/media`, token, { method: "POST", form: { image_url: imageUrl, caption } });
  for (let i = 0; i < 8; i++) {
    const st = await call<{ status_code?: string; status?: string }>(env, container.id, token, { form: { fields: "status_code,status" } }).catch(() => null);
    if (!st || st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw new Error(`Instagram could not fetch the photo (${st.status ?? st.status_code})`);
    await sleep(2000);
  }
  const published = await call<{ id: string }>(env, `${userId}/media_publish`, token, { method: "POST", form: { creation_id: container.id } });
  const info = await call<{ permalink?: string }>(env, published.id, token, { form: { fields: "permalink" } }).catch(() => ({ permalink: undefined }));
  return { id: published.id, permalink: info.permalink ?? null };
}
