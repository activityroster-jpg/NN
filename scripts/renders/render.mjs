// Renders photo-style placeholder images of every yacht model into
// public/art/yachts/<id>-<view>.webp. Run: node scripts/renders/render.mjs [modelId ...]
// Needs Playwright's Chromium (WebGL via SwiftShader is fine; it is slow but steady).
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";
// The pre-installed Playwright (global require path) or a local one.
const { chromium } = await import("playwright").catch(() => createRequire(import.meta.url)("playwright"));

const ROOT = resolve(import.meta.dirname, "../..");
const OUT = join(ROOT, "public/art/yachts");
const VIEWS = (process.env.VIEWS ?? "sailing,profile,anchored,aerial").split(",");
const specs = JSON.parse(await readFile(join(ROOT, "lib/fleet/specs.json"), "utf8")).models;

// Per-builder finishing touches (stripe, canvas colour, flybridge).
const STYLE = {
  Lagoon: { stripe: 0x8a929b, canvas: 0x3b4652, fly: true },
  "Fountaine Pajot": { stripe: 0x24384f, canvas: 0x2c3a4a, fly: true },
  "Bali Catamarans (Catana Group)": { stripe: 0x30353b, canvas: 0x41474e, fly: false },
  Jeanneau: { stripe: 0x1d2b44, canvas: 0x1f2c3f },
  Beneteau: { stripe: 0x2b3138, canvas: 0x2f353c },
  Bavaria: { stripe: 0x1c2a4a, canvas: 0x223150 },
  Dufour: { stripe: 0x3a4048, canvas: 0x3a4048 },
  Hanse: { stripe: 0x24272b, canvas: 0x2a2d31 },
  Elan: { stripe: 0x1d3050, canvas: 0x24344d },
};

const only = process.argv.slice(2);
const models = specs.filter((m) => !only.length || only.includes(m.id));

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.startsWith("/node_modules/") ? join(ROOT, path) : join(import.meta.dirname, path);
  try {
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const port = server.address().port;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
for (const m of models) {
  const st = STYLE[m.builder] ?? {};
  const params = { id: m.id, kind: m.kind, L: m.lengthOverallM, B: m.beamM, draft: m.draftM ?? 2, stripe: st.stripe, canvas: st.canvas, fly: !!st.fly };
  for (const view of VIEWS) {
    const t = Date.now();
    await page.goto(`http://127.0.0.1:${port}/render.html?view=${view}&ss=${process.env.SS ?? 2}&m=${encodeURIComponent(JSON.stringify(params))}`);
    await page.waitForFunction(() => window.done === true, null, { timeout: 600_000 });
    const data = await page.evaluate(() => window.result);
    const file = join(OUT, `${m.id}-${view}.webp`);
    await writeFile(file, Buffer.from(data.split(",")[1], "base64"));
    console.log(`${m.id} ${view} ${Math.round((Date.now() - t) / 1000)}s`);
  }
}
await browser.close();
server.close();
