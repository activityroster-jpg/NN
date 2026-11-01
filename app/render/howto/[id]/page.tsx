import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HowToRenderStage from "@/components/cruising/HowToRenderStage";
import { howToById, SERIES } from "@/lib/cruising/howto";
import { HOWTO_SCRIPTS } from "@/lib/cruising/howto-scripts";

// Bare 1920×1080 stage for rendering a charter know-how video to MP4.
export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };

export default async function RenderHowToPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = howToById(id);
  const script = HOWTO_SCRIPTS[id];
  if (!g || !script) notFound();
  return <HowToRenderStage script={script} kicker={SERIES.find((s) => s.id === g.series)!.title} summary={g.summary} />;
}
