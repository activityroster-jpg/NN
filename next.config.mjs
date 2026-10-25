/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.stripe.com\")" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Yacht photos come from the booking managers' CDNs; no optimiser route.
  images: { unoptimized: true },
  // Admin photo uploads go through a server action.
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

// Gives `next dev` the Cloudflare bindings (local D1). Never runs in the Worker.
if (process.env.NODE_ENV === "development") {
  const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
  // Workers AI has no local simulation and needs a Cloudflare login just to
  // start, so dev runs from a copy of the config without it (captions then
  // fall back to a plain template locally).
  const { readFileSync, writeFileSync } = await import("node:fs");
  const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8").replace(/^\s*\/\/.*$/gm, ""));
  delete config.ai;
  writeFileSync("wrangler.dev.jsonc", JSON.stringify(config, null, 2));
  await initOpenNextCloudflareForDev({ configPath: "wrangler.dev.jsonc" });
}
