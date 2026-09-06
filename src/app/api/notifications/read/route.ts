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
 * Réservé aux comptes connectés : un visiteur anonyme n'a pas d'identité à
 * laquelle rattacher une lecture, son état vit dans le navigateur. On répond
 * `204` plutôt que `401` pour que le client anonyme n'ait pas à traiter une
 * erreur pour un comportement parfaitement normal.
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
