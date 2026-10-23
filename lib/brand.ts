// Brand. The logo is the original Nautical Nomads wordmark. Three colour
// directions are offered on /brand-options; the active one is set here.

export const THEMES = ["horizon", "aegean", "riviera"] as const;
export type Theme = (typeof THEMES)[number];

export const ACTIVE_THEME: Theme = "horizon";

export const THEME_INFO: Record<Theme, { name: string; description: string }> = {
  horizon: { name: "Horizon", description: "The existing Nautical Nomads palette: hull white, deep ink, terracotta and faded denim. Warm and Mediterranean." },
  aegean: { name: "Aegean", description: "Crisp white and deep navy with a sunshine accent. Classic yachting, closest to the big booking sites but calmer." },
  riviera: { name: "Riviera", description: "Sand, deep teal and coral. Relaxed, holiday-first, stands out from the blue competitors." },
};

export const SOCIAL_LINKS: { label: string; href: string | null; icon: "instagram" | "youtube" | "tiktok" | "facebook" }[] = [
  { label: "Instagram", href: "https://www.instagram.com/thenauticalnomads/", icon: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com/@nauticalnomads1", icon: "youtube" },
  // TikTok handle not yet supplied; the link is hidden until it is set.
  { label: "TikTok", href: null, icon: "tiktok" },
  { label: "Facebook", href: "https://www.facebook.com/thenauticalnomad", icon: "facebook" },
];

export const COMPANY = {
  legalName: "ActiveRoster Ltd",
  tradingName: "Nautical Nomads",
  number: "17505500",
  jurisdiction: "England & Wales",
  address: "71-75 Shelton Street, London WC2H 9JQ, United Kingdom",
  email: "info@nauticalnomads.com",
};
