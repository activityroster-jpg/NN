import { describe, expect, it } from "vitest";
import type { CruisingGuide } from "@/lib/cruising/types";
import { validateGuide } from "@/lib/cruising/validate";

// Check one guide file before it is registered:
//   GUIDE=lib/cruising/guides/<id>.ts npx vitest run tests/cruising-one.test.ts
const file = process.env.GUIDE;

describe.skipIf(!file)("one cruising guide", () => {
  it(`${file}: passes the guide checks`, async () => {
    const mod = (await import(`../${file}`)) as Record<string, unknown>;
    const guide = Object.values(mod).find((v): v is CruisingGuide => !!v && typeof v === "object" && "legs" in v);
    expect(guide, "the file must export a guide").toBeTruthy();
    const problems = validateGuide(guide!);
    if (problems.length) console.log(problems.map((x) => "✗ " + x).join("\n"));
    expect(problems).toEqual([]);
  });
});
