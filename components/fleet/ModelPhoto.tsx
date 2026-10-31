/* eslint-disable @next/next/no-img-element */
import { illustrationUrl } from "@/lib/fleet/illustration";

/** A model's photo, or its drawn illustration while the builder's photos are not in yet. */
export function ModelPhoto({ url, id, alt, className = "" }: { url?: string; id: string; alt: string; className?: string }) {
  return <img src={url ?? illustrationUrl(id)} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}

export const PHOTO_NOTE = "Photos are the builder's own and show the model. The yacht you charter is a specific boat: its photos, layout, year and equipment come with your official quote.";
export const ILLUSTRATION_NOTE = "Illustrations of the model until the builder's photos are in. The yacht you charter is a specific boat: its photos, layout, year and equipment come with your official quote.";
