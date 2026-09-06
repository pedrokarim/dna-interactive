import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isMissingTableError } from "@/lib/db-errors";
import { isPushConfigured } from "@/lib/notifications/push";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/community-builds/vote-identity";
import { locales } from "@/i18n/config";

export const dynamic = "force-dynamic";

/**
 * Abonnements Web Push.
 *
 * GET    — état du service et clé publique VAPID (nécessaire au navigateur).
 * POST   — enregistre ou rafraîchit un abonnement.
 * DELETE — le retire (l'utilisateur coupe les notifications).
 *
 * Les visiteurs anonymes peuvent s'abonner : `user_id` reste nul, et se
 * remplit tout seul au prochain POST si la personne s'est connectée entre-temps.
 */
export async function GET() {
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
  });
}

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
  locale: z.string().max(8).optional(),
});

export async function POST(request: NextRequest) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push non configuré." }, { status: 503 });
  }

  // Un abonnement est bon marché à créer mais coûte à l'envoi : on borne la
  // création pour qu'un script ne puisse pas gonfler la table.
  const ip = getClientIp(request.headers);
  if (!(await checkRateLimit(`push:subscribe:${ip}`, 20, 60 * 60 * 1000)).ok) {
    return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  }

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Abonnement invalide." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const locale = locales.includes(parsed.data.locale as (typeof locales)[number])
    ? parsed.data.locale!
    : "fr";

  const db = getDb();
  try {
    await db
      .insert(schema.pushSubscriptions)
      .values({
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        userId: user?.id ?? null,
        locale,
        userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      })
      .onConflictDoUpdate({
        target: schema.pushSubscriptions.endpoint,
        set: {
          p256dh: parsed.data.keys.p256dh,
          auth: parsed.data.keys.auth,
          userId: user?.id ?? null,
          locale,
          lastSeenAt: new Date(),
        },
      });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return NextResponse.json({ error: "Migration en attente." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(1000) });

export async function DELETE(request: NextRequest) {
  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const db = getDb();
  try {
    // L'endpoint est une valeur opaque et imprévisible fournie par le service
    // de push : seul le navigateur abonné la connaît, elle fait donc office de
    // secret. Pour un compte connecté on resserre quand même : il ne peut
    // retirer qu'un abonnement anonyme (le sien, pas encore rattaché) ou un
    // abonnement déjà rattaché à lui — jamais celui d'un autre compte.
    await db
      .delete(schema.pushSubscriptions)
      .where(
        user
          ? and(
              eq(schema.pushSubscriptions.endpoint, parsed.data.endpoint),
              or(
                isNull(schema.pushSubscriptions.userId),
                eq(schema.pushSubscriptions.userId, user.id),
              ),
            )
          : eq(schema.pushSubscriptions.endpoint, parsed.data.endpoint),
      );
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  return NextResponse.json({ ok: true });
}
