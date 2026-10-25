import { Card, PageTitle } from "@/components/admin/ui";
import { GUIDES } from "@/lib/cruising";
import { narrationStatus } from "@/lib/cruising/prerecord";
import { storedVideos } from "@/lib/cruising/videos";
import { getEnvAsync } from "@/lib/env";

export const metadata = { title: "Videos" };

function size(bytes: number): string {
  return bytes > 1e6 ? `${(bytes / 1e6).toFixed(0)} MB` : `${Math.round(bytes / 1e3)} KB`;
}

export default async function Videos() {
  const env = await getEnvAsync();
  const [stored, narration] = await Promise.all([storedVideos(env), narrationStatus(env)]);
  return (
    <div className="space-y-6">
      <PageTitle title="Videos" sub="The cruising guide videos as MP4 files (1920×1080, with narration, music and captions) for YouTube, Instagram and TikTok. They are made automatically after each deploy and every six hours, once a guide's narration is fully recorded, and take about 15 minutes. If narration stops part way, the ElevenLabs account is usually out of credits." />
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted uppercase">
            <tr><th className="py-2">Guide</th><th className="py-2">Narration</th><th className="py-2">Video</th><th className="py-2"></th></tr>
          </thead>
          <tbody>
            {GUIDES.map((g) => {
              const v = stored.get(g.id);
              const n = narration.get(g.id) ?? { recorded: 0, total: 0 };
              const done = n.total > 0 && n.recorded === n.total;
              return (
                <tr key={g.id} className="border-t border-line align-middle">
                  <td className="py-3 font-semibold">{g.name}<span className="block text-xs font-normal text-muted">{g.country}</span></td>
                  <td className="py-3">
                    {done ? <span className="text-ok">Recorded</span> : <span className="text-warn">{n.recorded} of {n.total} sentences</span>}
                  </td>
                  <td className="py-3 text-ink/80">
                    {v ? (
                      <>
                        {v.uploaded.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {size(v.size)}
                        {!v.current && <span className="block text-xs text-warn">The guide has changed since; a new video is on its way.</span>}
                      </>
                    ) : (
                      <span className="text-muted">{done ? "Not made yet" : "Waits for the narration"}</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {v && <a href={`/admin/videos/download/${g.id}`} className="btn-primary px-4 py-2 text-sm">Download MP4</a>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
