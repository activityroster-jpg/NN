/* eslint-disable @next/next/no-img-element */

/** A model's uploaded photo, or a blank panel until one is uploaded (Admin → Photos). */
export function ModelPhoto({ url, alt, className = "" }: { url?: string; id?: string; alt: string; className?: string }) {
  if (!url) return <div role="img" aria-label={`${alt}: photos coming soon`} className={`bg-surface-2 ${className}`} />;
  return <img src={url} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}

export const PHOTO_NOTE = "Photos show the model. The yacht you charter is a specific boat: its own photos, layout, year and equipment come with your official quote.";
export const NO_PHOTO_NOTE = "Photos of this model are coming soon. The yacht you charter is a specific boat: its own photos, layout, year and equipment come with your official quote.";
