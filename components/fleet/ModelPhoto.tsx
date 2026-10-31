/* eslint-disable @next/next/no-img-element */
import type { HullKind } from "@/lib/fleet";

/** A model's photo, or a drawn silhouette while the builder's photos are not in yet. */
export function ModelPhoto({ url, kind, alt, className = "" }: { url?: string; kind: HullKind; alt: string; className?: string }) {
  return url ? (
    <img src={url} alt={alt} loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <img src={`/demo/${kind}-1.svg`} alt="" loading="lazy" className={`object-cover opacity-80 ${className}`} />
  );
}

export const PHOTO_NOTE = "Photos are the builder's own and show the model. The yacht you charter is a specific boat: its photos, layout, year and equipment come with your official quote.";
