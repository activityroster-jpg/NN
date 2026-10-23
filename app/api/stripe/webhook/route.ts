import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { payment, webhookEvent } from "@/lib/db/schema";
import { getEnvAsync } from "@/lib/env";
import { recordPayment } from "@/lib/services/bookings";
import { verifyStripeSignature } from "@/lib/stripe";

// Stripe → us. Verified against the raw body; idempotent by event id.
export async function POST(req: Request) {
  const env = await getEnvAsync();
  if (!env.STRIPE_WEBHOOK_SECRET) return new Response("not configured", { status: 503 });
  const raw = await req.text();
  if (!(await verifyStripeSignature(raw, req.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET))) {
    return new Response("bad signature", { status: 400 });
  }
  const event = JSON.parse(raw) as { id: string; type: string; data: { object: Record<string, unknown> } };
  const db = await getDb();
  const inserted = await db.insert(webhookEvent).values({ id: event.id, type: event.type }).onConflictDoNothing().returning();
  if (inserted.length === 0) return new Response("duplicate", { status: 200 });

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object as { id: string; payment_status?: string; payment_intent?: string; metadata?: { payment_id?: string } };
    const paymentId = s.metadata?.payment_id;
    if (paymentId && s.payment_status === "paid") {
      const row = await db.select().from(payment).where(eq(payment.id, paymentId)).get();
      if (row) await recordPayment(db, env, paymentId, "stripe", { sessionId: s.id, paymentIntent: s.payment_intent });
    }
  }
  return new Response("ok", { status: 200 });
}
