import { GUIDES } from "@/lib/cruising";
import { narrationStatus } from "@/lib/cruising/prerecord";
import { storedVideos, videoKey, videoVersion } from "@/lib/cruising/videos";
import { getEnvAsync } from "@/lib/env";

// Which guide videos need rendering: used by the "Make guide videos" workflow.
// A guide is ready to render only when all of its narration is recorded.
export async function GET() {
  const env = await getEnvAsync();
  const [stored, narration] = await Promise.all([storedVideos(env), narrationStatus(env)]);
  const guides = GUIDES.map((g) => {
    const version = videoVersion(env, g);
    const n = narration.get(g.id) ?? { recorded: 0, total: 0 };
    return {
      id: g.id,
      name: g.name,
      version,
      key: videoKey(g.id, version),
      current: stored.get(g.id)?.current ?? false,
      ready: n.total > 0 && n.recorded === n.total,
      narration: `${n.recorded}/${n.total}`,
    };
  });
  return Response.json({ guides }, { headers: { "Cache-Control": "no-store" } });
}
