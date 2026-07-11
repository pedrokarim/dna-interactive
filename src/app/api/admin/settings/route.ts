import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getAppSettings, setAppSettings } from "@/lib/settings/db";
import { mergeSettings } from "@/lib/settings";
import { recordAdminAction } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  announcementEnabled: z.boolean().optional(),
  announcementText: z.string().max(600).optional(),
  announcementLink: z.string().max(2000).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().max(600).optional(),
  signupEnabled: z.boolean().optional(),
  buildCreationEnabled: z.boolean().optional(),
  commissionsVisible: z.boolean().optional(),
  googleAuthEnabled: z.boolean().optional(),
  calendarToday: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Date AAAA-MM-JJ ou vide.").optional(),
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
  return NextResponse.json({ settings: await getAppSettings() });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  const current = await getAppSettings();
  const next = mergeSettings({ ...current, ...parsed.data });
  await setAppSettings(next);
  await recordAdminAction({ adminId: guard.user.id, action: "update_settings", targetType: "settings" });
  return NextResponse.json({ ok: true, settings: next });
}
