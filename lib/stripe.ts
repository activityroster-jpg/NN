import type { Currency } from "@/lib/domain/types";
import { hmacSha256Hex, safeEqual } from "@/lib/crypto";
import type { AppEnv } from "@/lib/env";

// Stripe over plain fetch (the Node SDK is avoided on Workers). We store only
// Stripe ids; card details never touch our servers.

export function stripeEnabled(env: AppEnv): boolean {
  return !!env.STRIPE_SECRET_KEY;
}

export interface CheckoutInput {
  amount: number;
  currency: Currency;
  description: string;
  email: string;
  paymentId: string;
  bookingRef: string;
  successUrl: string;
  cancelUrl: string;
  locale: string;
}

const STRIPE_LOCALES = new Set(["en", "de", "fr", "it", "es", "nl"]);

export async function createCheckoutSession(env: AppEnv, input: CheckoutInput): Promise<{ id: string; url: string }> {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
  const cents = Math.round(input.amount * 100);
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(cents),
    "line_items[0][price_data][product_data][name]": input.description,
    customer_email: input.email,
    client_reference_id: input.paymentId,
    "metadata[payment_id]": input.paymentId,
    "metadata[booking_ref]": input.bookingRef,
    "payment_intent_data[metadata][payment_id]": input.paymentId,
    "payment_intent_data[metadata][booking_ref]": input.bookingRef,
    "payment_intent_data[description]": `${input.bookingRef} · ${input.description}`,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    locale: STRIPE_LOCALES.has(input.locale) ? input.locale : "auto",
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      // Same payment and amount never creates two sessions.
      "Idempotency-Key": `${input.paymentId}-${cents}`,
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !json.id || !json.url) throw new Error(`Stripe: ${json.error?.message ?? res.status}`);
  return { id: json.id, url: json.url };
}

/**
 * Verify a Stripe webhook against the raw body (Stripe-Signature: t=…,v1=…).
 * Rejects signatures older than five minutes.
 */
export async function verifyStripeSignature(rawBody: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v ?? "");
  if (!t || sigs.length === 0) return false;
  if (Math.abs(nowSec - Number(t)) > 300) return false;
  const expected = await hmacSha256Hex(secret, `${t}.${rawBody}`);
  return sigs.some((s) => safeEqual(s, expected));
}
