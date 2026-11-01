import { HOWTO } from "@/lib/cruising/howto";
import { howToNarrationId } from "@/lib/cruising/howto-scripts";
import { howToVideoKey, howToVideoVersion, storedHowToVideos } from "@/lib/cruising/howto-videos";
import { narrationStatus } from "@/lib/cruising/prerecord";
import { getEnvAsync } from "@/lib/env";

// Which charter know-how videos need rendering: used by the videos workflow. A
// video is ready to render only when all of its narration is recorded.
export async function GET() {
  const env = await getEnvAsync();
  const [stored, narration] = await Promise.all([storedHowToVideos(env), narrationStatus(env)]);
  const howtos = HOWTO.map((g) => {
    const version = howToVideoVersion(env, g.id);
    const n = narration.get(howToNarrationId(g.id)) ?? { recorded: 0, total: 0 };
    return {
      id: g.id,
      title: g.title,
      version,
      key: howToVideoKey(g.id, version),
      current: stored.get(g.id)?.current ?? false,
      ready: n.total > 0 && n.recorded === n.total,
      narration: `${n.recorded}/${n.total}`,
    };
  });
  return Response.json({ howtos }, { headers: { "Cache-Control": "no-store" } });
}
