import { recordOpen, TRACKING_PNG } from "@/lib/email/tracking";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ token: string }> };

// Sert une image transparente et enregistre l'ouverture. L'URL a la forme
// `/biribiri/<hash>.png` — indistinguable d'un chargement d'asset ordinaire.
export async function GET(request: Request, { params }: RouteContext) {
  const { token } = await params;
  const clean = token.replace(/\.(png|gif|jpg)$/i, "");
  await recordOpen(clean, request.headers.get("user-agent"));

  return new Response(new Uint8Array(TRACKING_PNG), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": `${TRACKING_PNG.length}`,
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  });
}
