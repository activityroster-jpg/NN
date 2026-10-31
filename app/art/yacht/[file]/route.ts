import { modelById } from "@/lib/fleet";
import { ILLUSTRATIONS, illustrationSvg, type IllustrationKind } from "@/lib/fleet/illustration";

// Placeholder illustrations of each model until the builders' photos are
// uploaded: /art/yacht/<model>-<profile|anchored|aerial|plan|dimensions>.svg
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const m = new RegExp(`^([a-z0-9-]+)-(${ILLUSTRATIONS.join("|")})\\.svg$`).exec(file);
  const model = m ? modelById(m[1]!) : undefined;
  if (!m || !model) return new Response("not found", { status: 404 });
  return new Response(illustrationSvg(model, m[2] as IllustrationKind), { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
