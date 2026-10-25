import { Card, PageTitle } from "@/components/admin/ui";
import { GUIDES } from "@/lib/cruising";
import { narrationStatus } from "@/lib/cruising/prerecord";
import { storedVideos } from "@/lib/cruising/videos";
import { getEnvAsync } from "@/lib/env";
import { SHORTS } from "@/lib/shorts";
import { footageStatus, readManifest } from "@/lib/shorts/footage";
import { shortVersion, storedShorts } from "@/lib/shorts/videos";

export const metadata = { title: "Videos" };

function size(bytes: number): string {
  return bytes > 1e6 ? `${(bytes / 1e6).toFixed(0)} MB` : `${Math.round(bytes / 1e3)} KB`;
}

export default async function Videos() {
  const env = await getEnvAsync();
  const versions = new Map<string, string>();
  for (const s of SHORTS) versions.set(s.id, shortVersion(env, s, await readManifest(env, s.id)));
  const [stored, narration, shorts, footage] = await Promise.all([storedVideos(env), narrationStatus(env), storedShorts(env, versions), footageStatus(env)]);
  const STRAND = { howto: "How-to", fact: "Sailing fact", place: "Destination" };
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

      <Card title="Shorts">
        <p className="mb-4 text-sm text-muted">Vertical one-minute videos (1080×1920) for TikTok, Instagram Reels and YouTube Shorts: how-tos, sailing facts and destination teasers. Each uses stock footage from Pixabay, chosen automatically after a deploy, and is rendered the same way as the guide videos. Paste the caption into the post.</p>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted uppercase">
            <tr><th className="py-2">Short</th><th className="py-2">Narration</th><th className="py-2">Footage</th><th className="py-2">Video</th><th className="py-2"></th></tr>
          </thead>
          <tbody>
            {SHORTS.map((s) => {
              const v = shorts.get(s.id);
              const n = narration.get(s.id) ?? { recorded: 0, total: 0 };
              const f = footage.get(s.id) ?? { have: 0, total: 0, picks: [] };
              const done = n.total > 0 && n.recorded === n.total;
              return (
                <tr key={s.id} className="border-t border-line align-top">
                  <td className="py-3 pr-4">
                    <span className="font-semibold">{s.title}</span>
                    <span className="block text-xs text-muted">{STRAND[s.strand]} · {s.scenes.length} scenes</span>
                    <textarea readOnly rows={3} className="mt-2 w-full max-w-md rounded-md border border-line bg-surface p-2 text-xs text-ink/80" value={`${s.caption}\n\n${s.hashtags.map((h) => `#${h}`).join(" ")}`} />
                    <span className="block text-xs text-muted">Checked against: {s.sources.join("; ")}</span>
                  </td>
                  <td className="py-3">{done ? <span className="text-ok">Recorded</span> : <span className="text-warn">{n.recorded} of {n.total} sentences</span>}</td>
                  <td className="py-3">
                    {f.have === f.total ? <span className="text-ok">{f.total} clips</span> : <span className="text-warn">{f.have} of {f.total} clips</span>}
                    {f.picks.length > 0 && (
                      <span className="block text-xs text-muted">
                        {f.picks.map((pk, i) => (
                          <span key={pk.id}>{i > 0 && ", "}<a href={pk.pageURL} target="_blank" rel="noreferrer" className="underline">{pk.user}</a></span>
                        ))}{" "}(Pixabay)
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-ink/80">
                    {v ? (
                      <>
                        {v.uploaded.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {size(v.size)}
                        {!v.current && <span className="block text-xs text-warn">The short has changed since; a new video is on its way.</span>}
                      </>
                    ) : (
                      <span className="text-muted">{done && f.have === f.total ? "Not made yet" : "Waits for narration and footage"}</span>
                    )}
                  </td>
                  <td className="py-3 text-right">{v && <a href={`/admin/shorts/download/${s.id}`} className="btn-primary px-4 py-2 text-sm">Download MP4</a>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
