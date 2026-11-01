import { describe, expect, it } from "vitest";
import { MODELS } from "@/lib/fleet";
import { isStockCredit, MODEL_RE, MODEL_SLOTS, SLOTS, uploadOnly } from "@/lib/photos/slots";

describe("yacht model photo slots", () => {
  it("has ten per model: 1–5 filled from the library, 6–10 uploads only", () => {
    expect(MODEL_SLOTS).toBe(10);
    for (const m of MODELS) {
      const mine = SLOTS.filter((s) => s.key.startsWith(`model:${m.id}:`));
      expect(mine.map((s) => s.key)).toEqual(Array.from({ length: 10 }, (_, i) => `model:${m.id}:g${i + 1}`));
      expect(mine.slice(0, 5).every((s) => !uploadOnly(s) && s.query.length > 0)).toBe(true);
      expect(mine.slice(5).every((s) => uploadOnly(s))).toBe(true);
    }
  });

  it("parses slot keys 1–10 and nothing else", () => {
    expect(MODEL_RE.exec("model:lagoon-42:g10")?.[2]).toBe("10");
    expect(MODEL_RE.exec("model:lagoon-42:g1")?.[2]).toBe("1");
    expect(MODEL_RE.test("model:lagoon-42:g11")).toBe(false);
    expect(MODEL_RE.test("model:lagoon-42:g0")).toBe(false);
  });

  it("tells library photos from uploads by their credit", () => {
    expect(isStockCredit("Jane Doe / Pixabay")).toBe(true);
    expect(isStockCredit("Sam / Unsplash")).toBe(true);
    expect(isStockCredit("© Lagoon / Nicolas Claris")).toBe(false);
    expect(isStockCredit(null)).toBe(false);
  });
});
