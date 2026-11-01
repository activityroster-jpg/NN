import { PhotoBoard, type BoardSlot } from "@/components/admin/PhotoBoard";
import { Card, PageTitle } from "@/components/admin/ui";
import { getDb } from "@/lib/db";
import { getEnvAsync } from "@/lib/env";
import { MIN_GAP_SEC, photoSource } from "@/lib/photos/picker";
import { readSlots, SLOTS, uploadOnly } from "@/lib/photos/slots";
import { storageEnabled } from "@/lib/photos/storage";
import { pixabayEnabled } from "@/lib/photos/pixabay";

export const metadata = { title: "Photos" };

export default async function Photos() {
  const env = await getEnvAsync();
  const db = await getDb();
  const values = await readSlots(db);
  const slots: BoardSlot[] = SLOTS.map((s) => ({ ...s, url: values[s.key]?.url ?? null, credit: values[s.key]?.credit ?? null, uploadOnly: uploadOnly(s) }));
  const source = photoSource(env);
  const storage = storageEnabled(env);
  return (
    <div className="space-y-6">
      <PageTitle title="Photos" sub="Every photo slot on the site. Refresh fetches the next matching stock photo; drag your own photo onto a tile to use it instead. Photographers are credited on the site." />
      {!storage && (
        <Card>
          <p className="text-sm text-warn">
            Photo storage is not set up, so uploads{pixabayEnabled(env) ? " and Pixabay photos" : ""} won&apos;t work yet. Cloudflare → R2 → Create bucket → <code>nautical-nomads-photos</code>, location Europe, then deploy again.
          </p>
        </Card>
      )}
      {!source && (
        <Card>
          <p className="text-sm">No stock-photo key is set. Add <code>PIXABAY_API_KEY</code> (with the storage bucket) or <code>UNSPLASH_ACCESS_KEY</code> to the Worker to enable Refresh.</p>
        </Card>
      )}
      <PhotoBoard slots={slots} gapSec={MIN_GAP_SEC} sourceLabel={source === "pixabay" ? "Pixabay" : source === "unsplash" ? "Unsplash" : null} />
    </div>
  );
}
