import { Card, PageTitle } from "@/components/admin/ui";
import { makeIntro, recordNow, resetIntro, testVoice } from "@/lib/admin/narration-actions";
import { GUIDES } from "@/lib/cruising";
import { guideSentences, sentenceHash } from "@/lib/cruising/narration";
import { INTRO_KEY, narrationKey, voiceConfig } from "@/lib/cruising/voice";
import { getEnvAsync } from "@/lib/env";

export const metadata = { title: "Narration" };

export default async function Narration({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const env = await getEnvAsync();
  const { voice, model } = voiceConfig(env);
  const keySet = !!env.ELEVENLABS_API_KEY;
  const storage = !!env.PHOTOS;
  const intro = storage ? !!(await env.PHOTOS!.head(INTRO_KEY)) : false;
  const rows = await Promise.all(
    GUIDES.map(async (g) => {
      const sentences = guideSentences(g);
      let done = 0;
      if (storage) for (const s of sentences) if (await env.PHOTOS!.head(narrationKey(env, sentenceHash(s)))) done++;
      return { id: g.id, name: g.name, total: sentences.length, done };
    }),
  );
  const yes = (b: boolean) => (b ? <span className="font-semibold text-ok">Yes</span> : <span className="font-semibold text-danger">No</span>);
  return (
    <div className="space-y-6">
      <PageTitle title="Narration" sub="Recorded voice and intro music for the cruising guide videos (ElevenLabs). Without a working key the videos fall back to each visitor's device voice and have no music." />
      {ok && <Card><p className="text-sm text-ok">{ok}</p></Card>}
      {error && <Card><p className="text-sm break-words text-danger"><strong>ElevenLabs said:</strong> {error}</p></Card>}
      <Card title="Status">
        <dl className="grid gap-2 text-sm sm:grid-cols-[220px_1fr]">
          <dt className="text-muted">ELEVENLABS_API_KEY on the Worker</dt><dd>{yes(keySet)}</dd>
          <dt className="text-muted">Storage bucket connected</dt><dd>{yes(storage)}</dd>
          <dt className="text-muted">Voice / model</dt><dd><code>{voice}</code> / <code>{model}</code></dd>
          <dt className="text-muted">Intro music stored</dt><dd>{yes(intro)}</dd>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={testVoice}><button className="btn-primary px-4 py-2 text-sm">Test the voice</button></form>
          <form action={makeIntro}><button className="btn-secondary px-4 py-2 text-sm">Generate intro music</button></form>
          <form action={recordNow}><button className="btn-secondary px-4 py-2 text-sm">Record missing narration now</button></form>
          {intro && <form action={resetIntro}><button className="btn-secondary px-4 py-2 text-sm">Regenerate intro music</button></form>}
        </div>
      </Card>
      <Card title="Recorded sentences">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted uppercase"><tr><th className="py-1">Guide</th><th className="py-1">Recorded</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line"><td className="py-2">{r.name}</td><td className="py-2">{r.done} of {r.total}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
