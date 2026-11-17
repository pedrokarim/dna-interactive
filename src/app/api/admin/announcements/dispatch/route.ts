import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAdminAction } from "@/lib/admin/audit";
import { announcementToPushPayload, broadcastPush } from "@/lib/notifications/push";
import { sendAnnouncementEmails } from "@/lib/notifications/announcement-email";
import { getSiteUrl } from "@/lib/auth/site";

export const dynamic = "force-dynamic";
// Un broadcast email/push peut dépasser la seconde : la limite réelle est le
// `proxy_read_timeout` de nginx (90 s) devant le conteneur.

const schemaInput = z.object({
  id: z.string().uuid(),
  channels: z.array(z.enum(["push", "email"])).min(1),
  /** Obligatoire pour renvoyer sur un canal déjà utilisé. */
  force: z.boolean().optional(),
});

/**
 * Diffuse une annonce déjà publiée en push navigateur et par email.
 *
 * La cloche du site lit directement la table, elle n'a besoin d'aucun envoi.
 * Push et email ne se rattrapent pas une fois partis : on refuse un brouillon,
 * et un second envoi sur le même canal sans `force`.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin requis." }, { status: 403 });

  const parsed = schemaInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { id, channels, force } = parsed.data;

  const db = getDb();
  const [row] = await db.select().from(schema.announcements).where(eq(schema.announcements.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  if (row.status !== "published") {
    return NextResponse.json({ error: "Publie l'annonce avant de la diffuser." }, { status: 400 });
  }

  const already = channels.filter((c) => (c === "push" ? row.pushSentAt : row.emailSentAt));
  if (already.length > 0 && !force) {
    return NextResponse.json(
      { error: `Déjà diffusée sur : ${already.join(", ")}. Coche « renvoyer » pour forcer.` },
      { status: 409 },
    );
  }

  const report: Record<string, unknown> = {};
  const updates: Partial<typeof schema.announcements.$inferInsert> = {};

  if (channels.includes("push")) {
    const result = await broadcastPush(announcementToPushPayload(row, getSiteUrl()), { audience: row.audience });
    report.push = result;
    if (!result.skipped) {
      updates.pushSentAt = new Date();
      updates.pushDeliveredCount = row.pushDeliveredCount + result.sent;
    }
  }

  if (channels.includes("email")) {
    const result = await sendAnnouncementEmails(row);
    report.email = result;
    if (!result.skipped) {
      updates.emailSentAt = new Date();
      updates.emailDeliveredCount = row.emailDeliveredCount + result.sent;
    }
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(schema.announcements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.announcements.id, id));
  }

  await recordAdminAction({
    adminId: user.id,
    action: "dispatch_announcement",
    targetType: "announcement",
    targetId: id,
    meta: { channels, report },
  });

  return NextResponse.json({ ok: true, report });
}
