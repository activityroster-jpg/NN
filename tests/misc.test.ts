import { describe, expect, it } from "vitest";
import { addDays, nextSaturday, parseIsoDate, saturdays } from "@/lib/domain/dates";
import { convert } from "@/lib/domain/money";
import { parseEcbXml } from "@/lib/fx";
import { hmacSha256Hex, safeEqual } from "@/lib/crypto";

describe("dates", () => {
  it("finds Saturdays", () => {
    expect(nextSaturday("2027-07-01")).toBe("2027-07-03");
    expect(nextSaturday("2027-07-03")).toBe("2027-07-03");
    expect(saturdays("2027-07-01", 3)).toEqual(["2027-07-03", "2027-07-10", "2027-07-17"]);
    expect(addDays("2027-12-28", 7)).toBe("2028-01-04");
  });
  it("rejects impossible dates", () => {
    expect(() => parseIsoDate("2027-02-30")).toThrow();
    expect(() => parseIsoDate("tomorrow")).toThrow();
  });
});

describe("money", () => {
  it("converts through EUR", () => {
    const rates = { EUR: 1, GBP: 0.85, USD: 1.1 };
    expect(convert(1100, "USD", "EUR", rates)).toBeCloseTo(1000);
    expect(convert(1000, "EUR", "GBP", rates)).toBeCloseTo(850);
  });
  it("parses the ECB feed", () => {
    const xml = `<Cube currency='USD' rate='1.0835'/><Cube currency='JPY' rate='160.1'/><Cube currency='GBP' rate='0.8412'/>`;
    expect(parseEcbXml(xml)).toEqual({ USD: 1.0835, GBP: 0.8412 });
  });
});

describe("crypto", () => {
  it("computes Stripe-compatible HMAC-SHA256 hex", async () => {
    // Known vector: HMAC-SHA256(key="key", "The quick brown fox jumps over the lazy dog")
    expect(await hmacSha256Hex("key", "The quick brown fox jumps over the lazy dog")).toBe(
      "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
    );
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
  });
});
