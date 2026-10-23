"use client";

import Link from "next/link";
import { useState } from "react";
import { IconClose, IconMenu } from "@/components/Icons";

export function MobileMenu({ links, labels, children }: { links: { href: string; label: string }[]; labels: { menu: string; close: string }; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" className="btn-ghost -mr-2" aria-expanded={open} aria-label={open ? labels.close : labels.menu} onClick={() => setOpen(!open)}>
        {open ? <IconClose /> : <IconMenu />}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-surface px-4 py-6">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-ink/5">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-wrap gap-3 px-3">{children}</div>
        </div>
      )}
    </div>
  );
}
