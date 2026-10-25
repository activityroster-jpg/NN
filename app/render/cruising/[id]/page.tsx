import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RenderStage from "@/components/cruising/RenderStage";
import { guideById } from "@/lib/cruising";

// Bare 1920×1080 stage used by the "Make guide videos" workflow to render MP4s.
export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };

export default async function RenderPage({ params }: { params: Promise<{ id: string }> }) {
  const g = guideById((await params).id);
  if (!g) notFound();
  return <RenderStage guide={g} />;
}
