import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getNotificationFeed } from "@/lib/notifications/feed";

export const dynamic = "force-dynamic";

/**
 * Fil de notifications du visiteur.
 *
 * Répond aussi aux visiteurs **anonymes** : ils reçoivent les annonces
 * publiques, et gardent leur état de lecture dans le navigateur. C'est la
 * différence majeure avec l'ancienne version, qui renvoyait une liste vide
 * hors connexion et rendait le système invisible pour la quasi-totalité du
 * trafic.
 */
export async function GET() {
  const user = await getCurrentUser();
  const feed = await getNotificationFeed(user ? { id: user.id, role: user.role } : null);
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
