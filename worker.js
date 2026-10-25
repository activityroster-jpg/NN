// Worker entry: OpenNext's fetch handler plus a scheduled handler. The cron
// replays an authenticated request to /api/cron/tick so the job runs inside the
// normal Next.js runtime (database, email, providers).
import openNextHandler from "./.open-next/worker.js";

export default {
  ...openNextHandler,
  async scheduled(event, env, ctx) {
    // Two schedules (wrangler.jsonc): the ten-minute one only posts due Instagram photos.
    const job = event.cron === "*/10 * * * *" ? "social" : "tick";
    const req = new Request(`https://cron.internal/api/cron/tick?job=${job}`, {
      method: "POST",
      headers: { "x-cron-secret": env.CRON_SECRET ?? "" },
    });
    ctx.waitUntil(openNextHandler.fetch(req, env, ctx));
  },
};
