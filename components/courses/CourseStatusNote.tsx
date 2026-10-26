/**
 * Honest status line for the course. Shown under the course hub hero and at
 * the foot of every lesson. Neutral styling: it states a fact, not a risk.
 * Never use RYA logos or imply accreditation.
 */
import { Info } from "lucide-react";

export function CourseStatusNote() {
  return (
    <aside className="flex items-start gap-3.5 rounded-card border border-line bg-surface-2/70 p-5">
      <Info size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-sea" aria-hidden="true" />
      <p className="text-[15px] leading-[1.6] text-ink">
        Navigation for charter skippers is free training material from Nautical Nomads. It is not an RYA-accredited course and does not lead to a qualification. Charter companies set their own requirements for bareboat skippers; to get certified, book a course with a recognised training centre.
      </p>
    </aside>
  );
}
