import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getNotifications } from "@/lib/notifications/derive";

export const dynamic = "force-dynamic";

/** Notifications de l'utilisateur connecté (liste vide si déconnecté). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: [] });
  const notifications = await getNotifications({ id: user.id, role: user.role });
  return NextResponse.json({ notifications });
}
