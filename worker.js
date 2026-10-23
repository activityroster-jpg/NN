// Worker entry: OpenNext's fetch handler plus a scheduled handler. The cron
// replays an authenticated request to /api/cron/tick so the job runs inside the
// normal Next.js runtime (database, email, providers).
import openNextHandler from "./.open-next/worker.js";

export default {
  ...openNextHandler,
  async scheduled(_event, env, ctx) {
    const req = new Request("https://cron.internal/api/cron/tick", {
      method: "POST",
      headers: { "x-cron-secret": env.CRON_SECRET ?? "" },
    });
    ctx.waitUntil(openNextHandler.fetch(req, env, ctx));
  },
};
