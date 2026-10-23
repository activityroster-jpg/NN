import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ACTIVE_THEME } from "@/lib/brand";
import { fontVariables } from "@/lib/fonts";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://nauticalnomads.com"),
  title: { default: "Nautical Nomads", template: "%s · Nautical Nomads" },
};

export const viewport: Viewport = { themeColor: "#faf6ec", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const l = h.get("x-nn-locale");
  const lang = isLocale(l) ? l : DEFAULT_LOCALE;
  return (
    <html lang={lang} data-theme={ACTIVE_THEME} className={fontVariables}>
      <body className="min-h-dvh bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
