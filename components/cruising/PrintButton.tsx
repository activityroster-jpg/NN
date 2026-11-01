"use client";

/** Prints the page (checklists are made for taking to the boat). */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:border-ink/30 print:hidden">
      Print this guide
    </button>
  );
}
