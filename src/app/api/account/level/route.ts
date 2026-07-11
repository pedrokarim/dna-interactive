import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserProgress } from "@/lib/leveling/user";

export const dynamic = "force-dynamic";

/** Progression (XP / niveau / titre) de l'utilisateur connecté. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }
  const progress = await getUserProgress(user.id);
  return NextResponse.json({ progress });
}
