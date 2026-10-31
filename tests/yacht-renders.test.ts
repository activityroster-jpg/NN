import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MODELS } from "@/lib/fleet";
import { GALLERY } from "@/lib/fleet/illustration";

// Every model's placeholder renders must exist (node scripts/renders/render.mjs <id>).
describe("yacht renders", () => {
  it("has the four photo-style renders for every model", () => {
    for (const m of MODELS)
      for (const k of GALLERY.filter((x) => x !== "plan")) {
        const f = join(process.cwd(), "public/art/yachts", `${m.id}-${k}.webp`);
        expect(existsSync(f), f).toBe(true);
        expect(statSync(f).size, f).toBeGreaterThan(10_000);
      }
  });
});
