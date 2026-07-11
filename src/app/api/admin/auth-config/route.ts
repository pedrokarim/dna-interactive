import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getAuthConfigForAdmin, setAuthConfig } from "@/lib/auth/config-store";
import { recordAdminAction } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  discordId: z.string().max(200).optional(),
  discordSecret: z.string().max(400).optional(),
  googleId: z.string().max(200).optional(),
  googleSecret: z.string().max(400).optional(),
});

async function requireAdminResponse() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ error: "Admin requis." }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  // Ne renvoie JAMAIS les secrets en clair — seulement Client ID + présence.
  return NextResponse.json({ config: await getAuthConfigForAdmin() });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  await setAuthConfig(parsed.data);
  await recordAdminAction({ adminId: guard.user.id, action: "update_auth_config", targetType: "settings" });
  // On renvoie la vue masquée à jour (jamais les secrets).
  return NextResponse.json({ ok: true, config: await getAuthConfigForAdmin() });
}
