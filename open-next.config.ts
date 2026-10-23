import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

const config = defineCloudflareConfig({});

// `npm run build` runs OpenNext, whose Next.js phase would otherwise call
// `npm run build` again and recurse. Point it straight at `next build`.
config.buildCommand = "npx next build";

export default config;
