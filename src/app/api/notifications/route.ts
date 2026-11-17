import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getNotificationFeed } from "@/lib/notifications/feed";
import { getApiLocale } from "@/lib/api-locale";

export const dynamic = "force-dynamic";

/**
 * Fil de notifications du visiteur.
 *
 * Les anonymes ont aussi les annonces publiques, avec l'état de lecture gardé
 * dans le navigateur. Avant, hors connexion la liste était vide, donc presque
 * personne ne voyait les notifications.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  const feed = await getNotificationFeed(user ? { id: user.id, role: user.role } : null, getApiLocale(request));
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
