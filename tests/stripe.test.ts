import { describe, expect, it } from "vitest";
import { hmacSha256Hex } from "@/lib/crypto";
import { verifyStripeSignature } from "@/lib/stripe";

describe("verifyStripeSignature", () => {
  const secret = "whsec_test";
  const body = '{"id":"evt_1","type":"checkout.session.completed"}';
  it("accepts a valid, fresh signature", async () => {
    const t = 1_800_000_000;
    const sig = await hmacSha256Hex(secret, `${t}.${body}`);
    expect(await verifyStripeSignature(body, `t=${t},v1=${sig}`, secret, t + 10)).toBe(true);
  });
  it("rejects a tampered body, wrong secret, stale timestamp or missing header", async () => {
    const t = 1_800_000_000;
    const sig = await hmacSha256Hex(secret, `${t}.${body}`);
    expect(await verifyStripeSignature(body + " ", `t=${t},v1=${sig}`, secret, t)).toBe(false);
    expect(await verifyStripeSignature(body, `t=${t},v1=${sig}`, "whsec_other", t)).toBe(false);
    expect(await verifyStripeSignature(body, `t=${t},v1=${sig}`, secret, t + 301)).toBe(false);
    expect(await verifyStripeSignature(body, null, secret, t)).toBe(false);
  });
});
