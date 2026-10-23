/* eslint-disable @next/next/no-img-element */
import type { Yacht } from "@/lib/domain/types";

/** First photo of a yacht, or a neutral illustration when the feed has none. */
export function YachtImage({ yacht, className = "", index = 0, eager = false }: { yacht: Pick<Yacht, "images" | "kind" | "name" | "model">; className?: string; index?: number; eager?: boolean }) {
  const src = yacht.images[index] ?? yacht.images[0] ?? `/demo/${yacht.kind === "catamaran" ? "catamaran" : "monohull"}-1.svg`;
  return (
    <img
      src={src}
      alt={`${yacht.name}, ${yacht.model}`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
