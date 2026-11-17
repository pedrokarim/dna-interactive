import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { markNotificationsRead } from "@/lib/notifications/feed";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string().trim().min(1).max(200)).min(1).max(100),
});

/**
 * Marque des notifications comme lues.
 *
 * Comptes connectés seulement : pour un anonyme, l'état « lu » vit dans le
 * navigateur. On lui répond 204 et pas 401, il n'a pas d'erreur à gérer.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 204 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const count = await markNotificationsRead(user.id, parsed.data.ids);
  return NextResponse.json({ ok: true, count });
}
