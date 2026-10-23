import { describe, expect, it } from "vitest";
import { categorise } from "@/lib/domain/categories";

describe("categorise", () => {
  const mono = (lengthFt: number, airCon: boolean) => categorise({ kind: "monohull", lengthFt, airCon });
  const cat = (lengthFt: number, airCon: boolean) => categorise({ kind: "catamaran", lengthFt, airCon });

  it("monohulls follow the agreed length and AC thresholds", () => {
    expect(mono(46, false)).toBe("standard-mono");
    expect(mono(49, true)).toBe("standard-mono");
    expect(mono(50, true)).toBe("premium-mono");
    expect(mono(53, true)).toBe("premium-mono");
    expect(mono(54, true)).toBe("luxury-mono");
    expect(mono(56, true)).toBe("luxury-mono");
  });

  it("a long yacht without AC is Standard", () => {
    expect(mono(55, false)).toBe("standard-mono");
    expect(cat(50, false)).toBe("standard-cat");
  });

  it("catamarans follow the agreed thresholds", () => {
    expect(cat(40, false)).toBe("standard-cat");
    expect(cat(41, true)).toBe("standard-cat");
    expect(cat(42, true)).toBe("premium-cat");
    expect(cat(47, true)).toBe("premium-cat");
    expect(cat(48, true)).toBe("luxury-cat");
  });

  it("does not categorise power boats or gulets", () => {
    expect(categorise({ kind: "power", lengthFt: 60, airCon: true })).toBeNull();
    expect(categorise({ kind: "gulet", lengthFt: 80, airCon: true })).toBeNull();
  });
});
