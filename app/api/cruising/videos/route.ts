import { GUIDES } from "@/lib/cruising";
import { storedVideos, videoKey, videoVersion } from "@/lib/cruising/videos";
import { getEnvAsync } from "@/lib/env";

// Which guide videos need rendering: used by the "Make guide videos" workflow.
export async function GET() {
  const env = await getEnvAsync();
  const stored = await storedVideos(env);
  const guides = GUIDES.map((g) => {
    const version = videoVersion(env, g);
    return { id: g.id, name: g.name, version, key: videoKey(g.id, version), current: stored.get(g.id)?.current ?? false };
  });
  return Response.json({ guides }, { headers: { "Cache-Control": "no-store" } });
}
