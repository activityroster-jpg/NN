/* eslint-disable @next/next/no-img-element */
import { modelById } from "@/lib/fleet";

/**
 * Stand-in photo by hull type (the house's licensed photos) for a model with
 * no photos yet; always shown as a similar yacht, never as the model.
 */
export const fallbackPhoto = (kind: "catamaran" | "monohull") => (kind === "catamaran" ? "/photos/house/catamaran-swim-platform.jpg" : "/photos/house/winch-under-sail.jpg");

/** A model's photo, or the stand-in for its hull type. */
export function ModelPhoto({ url, id, alt, className = "" }: { url?: string; id: string; alt: string; className?: string }) {
  return <img src={url ?? fallbackPhoto(modelById(id)?.kind ?? "monohull")} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}

export const PHOTO_NOTE = "Photos are the builder's own and show the model. The yacht you charter is a specific boat: its photos, layout, year and equipment come with your official quote.";

/** Under library photos of a similar yacht. */
export const similarNote = (kindPlural: string, name: string) =>
  `Photos show similar ${kindPlural}, not the ${name} itself; the layout drawing is typical of the model. The yacht you charter is a specific boat: its own photos, layout, year and equipment come with your official quote.`;
