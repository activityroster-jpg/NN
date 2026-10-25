import { narrationStatus } from "@/lib/cruising/prerecord";
import { getEnvAsync } from "@/lib/env";
import { SHORTS } from "@/lib/shorts";
import { footageStatus, readManifest } from "@/lib/shorts/footage";
import { shortKey, shortVersion, storedShorts } from "@/lib/shorts/videos";

// Which shorts need rendering: used by the "Make guide videos" workflow. A
// short is ready only when all its narration is recorded and footage chosen.
export async function GET() {
  const env = await getEnvAsync();
  const versions = new Map<string, string>();
  for (const s of SHORTS) versions.set(s.id, shortVersion(env, s, await readManifest(env, s.id)));
  const [stored, narration, footage] = await Promise.all([storedShorts(env, versions), narrationStatus(env), footageStatus(env)]);
  const shorts = SHORTS.map((s) => {
    const version = versions.get(s.id)!;
    const n = narration.get(s.id) ?? { recorded: 0, total: 0 };
    const f = footage.get(s.id) ?? { have: 0, total: 0 };
    return {
      id: s.id,
      title: s.title,
      version,
      key: shortKey(s.id, version),
      current: stored.get(s.id)?.current ?? false,
      ready: n.total > 0 && n.recorded === n.total && f.have === f.total,
      narration: `${n.recorded}/${n.total}`,
      footage: `${f.have}/${f.total}`,
    };
  });
  return Response.json({ shorts }, { headers: { "Cache-Control": "no-store" } });
}
