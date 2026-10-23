// Web Crypto helpers (available in Workers and Node 20+).

export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return base64url(a);
}

export function randomId(): string {
  return crypto.randomUUID();
}

/** Short human-friendly booking reference, e.g. NN-7K4Q2M (no 0/O/1/I). */
export function bookingRef(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return "NN-" + Array.from(a, (b) => alphabet[b % alphabet.length]).join("");
}

/** Six-digit numeric code for admin sign-in. */
export function numericCode(): string {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0]! % 1_000_000).padStart(6, "0");
}

export function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(s: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

/** Constant-time comparison of two strings. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
