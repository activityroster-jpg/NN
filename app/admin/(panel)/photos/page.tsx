/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Card, PageTitle } from "@/components/admin/ui";
import { autoFillPhotos, clearPhoto, usePhoto } from "@/lib/admin/actions";
import { getDb } from "@/lib/db";
import { DESTINATION_IDS } from "@/lib/domain/destinations";
import { getEnvAsync } from "@/lib/env";
import { pexelsEnabled, searchPhotos, SUGGESTED_QUERIES, type Photo } from "@/lib/photos/pexels";
import { searchUnsplash, unsplashEnabled } from "@/lib/photos/unsplash";
import { destinationViews } from "@/lib/services/destination-settings";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Photos" };

const TARGETS = [...DESTINATION_IDS.map((d) => ({ key: `destination:${d}`, label: `Destination: ${d}` })), { key: "home:monohull", label: "Home: sailing yacht card" }, { key: "home:catamaran", label: "Home: catamaran card" }];

export default async function Photos({ searchParams }: { searchParams: Promise<{ target?: string; q?: string; page?: string; filled?: string }> }) {
  const sp = await searchParams;
  const env = await getEnvAsync();
  const db = await getDb();
  const target = TARGETS.find((t) => t.key === sp.target)?.key ?? TARGETS[0]!.key;
  const suggested = SUGGESTED_QUERIES[target.split(":")[1] ?? ""] ?? "sailing";
  const q = (sp.q ?? "").trim() || suggested;
  const page = Math.max(1, Number(sp.page) || 1);
  const source = unsplashEnabled(env) ? "unsplash" : pexelsEnabled(env) ? "pexels" : null;
  const enabled = source !== null;
  let photos: Photo[] = [];
  let total = 0;
  let error: string | null = null;
  if (source) {
    try {
      ({ photos, total } = source === "unsplash" ? await searchUnsplash(env, q, page) : await searchPhotos(env, q, page));
    } catch (e) {
      error = String(e);
    }
  }
  const [views, settings] = await Promise.all([destinationViews(db), getSettings(db)]);
  const current: { key: string; label: string; url: string | null; credit: string | null }[] = [
    ...views.map((d) => ({ key: `destination:${d.id}`, label: d.id, url: d.heroImageUrl, credit: d.heroCredit })),
    { key: "home:monohull", label: "Home: sailing yacht", url: settings.images.monohull?.url ?? null, credit: settings.images.monohull?.credit ?? null },
    { key: "home:catamaran", label: "Home: catamaran", url: settings.images.catamaran?.url ?? null, credit: settings.images.catamaran?.credit ?? null },
  ];

  return (
    <div className="space-y-6">
      <PageTitle title="Photos" sub={`Search free stock photos and set them as destination heroes or home-page images. Photos are served from ${source === "unsplash" ? "Unsplash" : "Pexels"} and the photographer is credited.`} />
      {!enabled && (
        <Card>
          <p className="text-sm">Photo search is off. Add the secret <code>UNSPLASH_ACCESS_KEY</code> (free key: unsplash.com/developers → New Application) or <code>PEXELS_API_KEY</code> to the Worker. You can still paste a photo URL on the Destinations page.</p>
        </Card>
      )}
      <Card title="Search">
        <form className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
          <select name="target" defaultValue={target} className="field">
            {TARGETS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <input name="q" defaultValue={q} className="field" placeholder="e.g. Hvar harbour sailing yacht" />
          <button className="btn-primary px-4 py-2 text-sm">Search</button>
        </form>
        <p className="mt-2 text-xs text-muted">Tip: name a place plus “sailing”, “harbour”, “bay” or “catamaran”. Landscape photos only. Suggested: “{suggested}”.</p>
      </Card>
      {error && <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">Photo search failed: {error}</p>}
      {enabled && (
        <Card title="Fill every empty slot at once">
          <form action={autoFillPhotos} className="flex flex-wrap items-center gap-3">
            <button className="btn-primary px-4 py-2 text-sm">Fill empty destinations and home cards</button>
            <p className="text-sm text-muted">Picks the best-matching landscape photo for each destination that has none, plus the two home-page cards. Photos you have already chosen are kept. You can swap any result below afterwards.</p>
          </form>
          {sp.filled !== undefined && <p className="mt-3 text-sm text-ok">{sp.filled === "0" ? "Nothing filled: photo search is off or nothing was empty." : `Filled ${sp.filled} slot${sp.filled === "1" ? "" : "s"}.`}</p>}
        </Card>
      )}
      {enabled && (
        <Card title={`Results for “${q}” (${total})`} actions={
          <div className="flex gap-2 text-sm">
            {page > 1 && <Link className="text-brand underline" href={`/admin/photos?target=${target}&q=${encodeURIComponent(q)}&page=${page - 1}`}>← Previous</Link>}
            {photos.length === 24 && <Link className="text-brand underline" href={`/admin/photos?target=${target}&q=${encodeURIComponent(q)}&page=${page + 1}`}>Next →</Link>}
          </div>
        }>
          {photos.length === 0 ? <p className="text-sm text-muted">No photos. Try other words.</p> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((p) => (
                <form key={p.id} action={usePhoto} className="card overflow-hidden">
                  <input type="hidden" name="target" value={target} />
                  <input type="hidden" name="url" value={p.url} />
                  <input type="hidden" name="credit" value={`${p.photographer} / ${p.source === "unsplash" ? "Unsplash" : "Pexels"}`} />
                  <input type="hidden" name="download" value={p.downloadLocation ?? ""} />
                  <img src={p.thumb} alt={p.alt} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 p-2 text-xs">
                    <a href={p.pageUrl} target="_blank" rel="noopener noreferrer" className="truncate text-muted hover:underline">{p.photographer}</a>
                    <button className="btn-primary px-3 py-1 text-xs">Use</button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </Card>
      )}
      <Card title="Currently set">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {current.map((c) => (
            <div key={c.key} className="card overflow-hidden">
              {c.url ? <img src={c.url} alt="" className="aspect-[16/10] w-full object-cover" /> : <div className="flex aspect-[16/10] items-center justify-center bg-surface-2 text-xs text-muted">no photo</div>}
              <div className="flex items-center justify-between gap-2 p-2 text-xs">
                <span className="truncate"><strong>{c.label}</strong>{c.credit ? ` · ${c.credit}` : ""}</span>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/admin/photos?target=${c.key}`} className="text-brand underline">Find</Link>
                  {c.url && <form action={clearPhoto}><input type="hidden" name="target" value={c.key} /><button className="text-danger underline">Clear</button></form>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
