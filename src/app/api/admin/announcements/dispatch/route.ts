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
// Un broadcast email/push peut dépasser la seconde : on demande la durée max
// autorisée sur le plan Vercel plutôt que de laisser la fonction être coupée.
export const maxDuration = 60;

const schemaInput = z.object({
  id: z.string().uuid(),
  channels: z.array(z.enum(["push", "email"])).min(1),
  /** Garde-fou explicite : renvoyer sur un canal déjà utilisé doit être voulu. */
  force: z.boolean().optional(),
});

/**
 * Diffuse une annonce déjà publiée sur les canaux sortants.
 *
 * La cloche du site n'est pas un canal : elle lit directement la table, une
 * annonce publiée y est visible sans rien envoyer. Cette route ne concerne que
 * le push navigateur et l'email, qui sont irréversibles — d'où le refus de
 * renvoyer deux fois sans `force`, et le refus de diffuser un brouillon.
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
