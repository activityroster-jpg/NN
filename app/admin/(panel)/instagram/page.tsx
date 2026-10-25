/* eslint-disable @next/next/no-img-element */
import { InstagramComposer } from "@/components/admin/InstagramComposer";
import { Card, PageTitle } from "@/components/admin/ui";
import { connectInstagram, disconnectInstagram, postInstagramNow, regenerateInstagramCaption, removeInstagramPost, saveInstagramTime, updateInstagramPost } from "@/lib/admin/social-actions";
import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { captionWriter } from "@/lib/social/caption";
import { igRecentMedia, type IgMedia } from "@/lib/social/instagram";
import { getAccount, listPosts, socialSettings, type SocialPost } from "@/lib/social/posts";
import { addLocalDays, dateLabel, HALF_HOURS, localDate, localTime } from "@/lib/social/time";

export const metadata = { title: "Instagram" };

const INSTAGRAM_URL = "https://www.instagram.com/thenauticalnomads/";

function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return <p className={`rounded-lg px-4 py-3 text-sm ${error ? "bg-danger/10 text-danger" : "bg-ok/10 text-ok"}`}>{error ?? ok}</p>;
}

function Tile({ src, label, tone, href }: { src: string; label?: string; tone?: "queued" | "failed"; href?: string }) {
  const img = <img src={src} alt="" className="h-full w-full object-cover" />;
  return (
    <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
      {label && <span className={`absolute top-1 left-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${tone === "failed" ? "bg-danger text-white" : "bg-black/65 text-white"}`}>{label}</span>}
    </div>
  );
}

export default async function Instagram({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const env = await getEnvAsync();
  const db = await getDb();
  const [account, { time, tz }, { queue, posted }] = await Promise.all([getAccount(db), socialSettings(db), listPosts(db)]);
  let recent: IgMedia[] = [];
  let recentError = "";
  if (account) {
    try {
      recent = await igRecentMedia(env, account.accessToken, 12);
    } catch (e) {
      recentError = e instanceof Error ? e.message : String(e);
    }
  }
  const writer = captionWriter(env);
  const now = new Date();
  const today = localDate(now, tz);
  const days = Array.from({ length: 60 }, (_, i) => addLocalDays(today, i));
  const daysLeft = account ? Math.max(0, Math.round((Date.parse(account.expiresAt) - now.getTime()) / 86_400_000)) : 0;
  const gridQueue = [...queue].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const when = (p: SocialPost) => `${dateLabel(localDate(new Date(p.scheduledAt), tz))} ${localTime(new Date(p.scheduledAt), tz)}`;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Instagram"
        sub={`Drop a photo, get a caption, and it joins the queue: one post a day at ${time} (${tz.replace("_", " ")}), or whenever you move it to. Posts go out within ten minutes of their time.`}
        actions={
          <form action={saveInstagramTime} className="flex items-center gap-2 text-sm">
            <label htmlFor="daily-time" className="text-muted">Post every day at</label>
            <select id="daily-time" name="time" defaultValue={time} className="rounded-lg border border-line bg-card px-2 py-1.5">
              {HALF_HOURS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button className="btn-primary px-3 py-1.5 text-sm">Save</button>
          </form>
        }
      />
      <Flash ok={ok} error={error} />

      {account ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p>
              Connected to <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="font-semibold underline">@{account.username}</a>. The access token renews itself; it currently runs to {new Date(account.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              {daysLeft < 7 && <span className="text-warn"> ({daysLeft} days left: if posts start failing, paste a fresh token below)</span>}.
            </p>
            <form action={disconnectInstagram}>
              <button className="rounded-lg border border-line px-3 py-1.5 hover:bg-ink/5">Disconnect</button>
            </form>
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-muted">Paste a new access token</summary>
            <form action={connectInstagram} className="mt-2 flex flex-wrap gap-2">
              <input name="token" placeholder="IGAA…" className="min-w-72 flex-1 rounded-lg border border-line bg-card px-3 py-2 font-mono text-xs" autoComplete="off" />
              <button className="btn-primary px-4 py-2 text-sm">Connect</button>
            </form>
          </details>
        </Card>
      ) : (
        <Card title="Connect @thenauticalnomads">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink/85">
            <li>In the Instagram app, make the account a professional account: <strong>Settings → Account type and tools → Switch to professional account</strong> (Creator or Business, both work). It stays free.</li>
            <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="underline">developers.facebook.com/apps</a>, sign in with the Facebook or Instagram login, click <strong>Create app</strong>, choose the <strong>Instagram</strong> use case, name it <em>Nautical Nomads Poster</em> and create it.</li>
            <li>In the app, open <strong>Instagram → API setup with Instagram login</strong>. Under <strong>Generate access tokens</strong>, click <strong>Add account</strong>, log in as @thenauticalnomads and accept. Then click <strong>Generate token</strong> and copy it (it starts with IGAA).</li>
            <li>Paste the token here and click Connect. The token lasts 60 days and renews itself from then on.</li>
          </ol>
          <form action={connectInstagram} className="mt-4 flex flex-wrap gap-2">
            <input name="token" placeholder="Paste the access token" className="min-w-72 flex-1 rounded-lg border border-line bg-card px-3 py-2 font-mono text-xs" autoComplete="off" />
            <button className="btn-primary px-4 py-2 text-sm">Connect</button>
          </form>
        </Card>
      )}

      <Card title="New post">
        <InstagramComposer writer={writer} connected={!!account} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="How the grid will look">
          <p className="mb-3 text-xs text-muted">Queued photos first, newest date at the top left, then what is already on the account. Instagram shows the grid in 3:4 tiles and the full photo when opened.</p>
          <div className="grid grid-cols-3 gap-0.5">
            {gridQueue.map((p) => (
              <Tile key={p.id} src={`/media/${p.imageKey}`} label={p.status === "failed" ? "Failed" : when(p)} tone={p.status === "failed" ? "failed" : "queued"} />
            ))}
            {recent.map((m) => (
              <Tile key={m.id} src={m.media_type === "VIDEO" ? (m.thumbnail_url ?? "") : (m.media_url ?? "")} href={m.permalink} />
            ))}
            {!account && posted.map((p) => <Tile key={p.id} src={`/media/${p.imageKey}`} href={p.permalink ?? undefined} />)}
          </div>
          {recentError && <p className="mt-2 text-xs text-warn">Could not load the account&apos;s posts: {recentError}</p>}
          {gridQueue.length + recent.length === 0 && <p className="mt-2 text-xs text-muted">Nothing to show yet.</p>}
        </Card>

        <div className="space-y-4">
          <Card title={`Queue (${queue.length})`}>
            {queue.length === 0 && <p className="text-sm text-muted">Nothing queued. Drop a photo above.</p>}
            <div className="divide-y divide-line">
              {queue.map((p) => {
                const d = localDate(new Date(p.scheduledAt), tz);
                const t = localTime(new Date(p.scheduledAt), tz);
                const dayOptions = days.includes(d) ? days : [d, ...days];
                const timeOptions = HALF_HOURS.includes(t) ? HALF_HOURS : [t, ...HALF_HOURS];
                return (
                  <form key={p.id} className="grid gap-3 py-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                    <input type="hidden" name="id" value={p.id} />
                    <img src={`/media/${p.imageKey}`} alt="" className="w-[120px] rounded-lg" style={{ aspectRatio: `${p.width} / ${p.height}`, objectFit: "cover" }} />
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <select name="date" defaultValue={d} className="rounded-lg border border-line bg-card px-2 py-1.5">
                          {dayOptions.map((x) => (
                            <option key={x} value={x}>{dateLabel(x)}</option>
                          ))}
                        </select>
                        <select name="time" defaultValue={t} className="rounded-lg border border-line bg-card px-2 py-1.5">
                          {timeOptions.map((x) => (
                            <option key={x} value={x}>{x}</option>
                          ))}
                        </select>
                        {p.status === "failed" && <span className="text-xs text-danger">Failed: {p.error}</span>}
                        {p.status === "posting" && <span className="text-xs text-muted">Publishing…</span>}
                        {p.captionSource && p.status === "scheduled" && <span className="text-xs text-muted">Caption: {p.captionSource === "workers-ai" ? "built-in model" : p.captionSource}</span>}
                      </div>
                      <textarea name="caption" defaultValue={p.caption} rows={5} maxLength={2200} className="w-full rounded-lg border border-line bg-card px-3 py-2" />
                      <div className="flex flex-wrap items-center gap-2">
                        <input name="note" defaultValue={p.note ?? ""} maxLength={300} placeholder="Tell the caption writer more, then regenerate" className="min-w-60 flex-1 rounded-lg border border-line bg-card px-3 py-1.5 text-xs" />
                        <button formAction={regenerateInstagramCaption} className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-ink/5">Regenerate caption</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button formAction={updateInstagramPost} className="btn-primary px-4 py-1.5 text-sm">Save</button>
                        <button formAction={postInstagramNow} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-ink/5" disabled={!account}>Post now</button>
                        <button formAction={removeInstagramPost} className="rounded-lg border border-line px-3 py-1.5 text-sm text-danger hover:bg-danger/10">Remove</button>
                      </div>
                    </div>
                  </form>
                );
              })}
            </div>
          </Card>

          {posted.length > 0 && (
            <Card title="Posted">
              <ul className="divide-y divide-line text-sm">
                {posted.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2">
                    <img src={`/media/${p.imageKey}`} alt="" className="h-12 w-12 rounded object-cover" />
                    <span className="flex-1 truncate text-ink/80">{p.caption.split("\n")[0]}</span>
                    <span className="text-xs text-muted">{p.postedAt ? new Date(p.postedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</span>
                    {p.permalink && <a href={p.permalink} target="_blank" rel="noreferrer" className="text-xs underline">Open</a>}
                    <form action={removeInstagramPost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-xs text-muted hover:text-danger">Hide</button>
                    </form>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
