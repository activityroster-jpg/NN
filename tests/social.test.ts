import { describe, expect, it } from "vitest";
import { nextFreeSlot } from "@/lib/social/posts";
import { addLocalDays, localDate, localTime, zonedToUtc } from "@/lib/social/time";

const LONDON = "Europe/London";

describe("business-time helpers", () => {
  it("converts London wall-clock time to UTC in summer and winter", () => {
    expect(zonedToUtc("2026-07-01", "18:00", LONDON).toISOString()).toBe("2026-07-01T17:00:00.000Z");
    expect(zonedToUtc("2026-01-15", "18:00", LONDON).toISOString()).toBe("2026-01-15T18:00:00.000Z");
  });
  it("reads the local date and time back", () => {
    const at = new Date("2026-07-01T23:30:00.000Z"); // 00:30 next day in London
    expect(localDate(at, LONDON)).toBe("2026-07-02");
    expect(localTime(at, LONDON)).toBe("00:30");
  });
  it("adds days across a month end", () => {
    expect(addLocalDays("2026-01-31", 1)).toBe("2026-02-01");
  });
});

describe("daily slot", () => {
  it("books today when the slot is still ahead and free", () => {
    const now = new Date("2026-07-01T10:00:00.000Z");
    expect(nextFreeSlot(new Set(), now, "18:00", LONDON).toISOString()).toBe("2026-07-01T17:00:00.000Z");
  });
  it("moves to tomorrow once today's slot has passed", () => {
    const now = new Date("2026-07-01T17:30:00.000Z");
    expect(nextFreeSlot(new Set(), now, "18:00", LONDON).toISOString()).toBe("2026-07-02T17:00:00.000Z");
  });
  it("skips days that already have a post", () => {
    const now = new Date("2026-07-01T10:00:00.000Z");
    const taken = new Set(["2026-07-01", "2026-07-02"]);
    expect(nextFreeSlot(taken, now, "18:00", LONDON).toISOString()).toBe("2026-07-03T17:00:00.000Z");
  });
});
