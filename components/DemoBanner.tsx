import { IconInfo } from "@/components/Icons";

export function DemoBanner({ text }: { text: string }) {
  return (
    <div role="note" className="flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-ink">
      <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
      <p>{text}</p>
    </div>
  );
}
