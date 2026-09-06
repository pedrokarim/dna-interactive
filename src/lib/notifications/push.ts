import "server-only";
import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import type { AnnouncementRecord } from "./announcements";

/**
 * Web Push (Push API + VAPID).
 *
 * Trois variables d'environnement :
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY – clé publique, exposée au navigateur
 *   VAPID_PRIVATE_KEY            – clé privée, jamais exposée
 *   VAPID_SUBJECT                – mailto: ou URL de contact (exigé par la norme)
 *
 * Générer la paire une seule fois : `bunx web-push generate-vapid-keys`.
 * Sans clés, tout le module se met en retrait : `isPushConfigured()` renvoie
 * faux, l'interface masque l'option et rien n'échoue.
 */

let configured: boolean | null = null;

export function isPushConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contact@ascencia.re", publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  image?: string;
  /** Regroupe les notifications d'une même annonce : la nouvelle remplace l'ancienne. */
  tag?: string;
};

/**
 * Diffuse une charge utile à tous les abonnements ciblés.
 *
 * Les endpoints révoqués (404/410) sont supprimés au passage : c'est le seul
 * signal fiable qu'un navigateur a désinstallé l'abonnement, et laisser
 * traîner ces lignes dégrade tous les envois suivants.
 */
export async function broadcastPush(
  payload: PushPayload,
  target: { audience: "everyone" | "authenticated" | "admins" },
): Promise<{ sent: number; failed: number; pruned: number; skipped: boolean }> {
  if (!isPushConfigured()) return { sent: 0, failed: 0, pruned: 0, skipped: true };

  const db = getDb();
  let subscriptions: Array<typeof schema.pushSubscriptions.$inferSelect>;
  try {
    const query = db.select().from(schema.pushSubscriptions);
    subscriptions =
      target.audience === "everyone"
        ? await query
        : await query.where(
            // Une audience restreinte n'atteint que les abonnements rattachés à
            // un compte : un abonnement anonyme ne peut pas être qualifié.
            inArray(
              schema.pushSubscriptions.userId,
              db
                .select({ id: schema.users.id })
                .from(schema.users)
                .where(target.audience === "admins" ? eq(schema.users.role, "admin") : eq(schema.users.banned, false)),
            ),
          );
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return { sent: 0, failed: 0, pruned: 0, skipped: true };
  }

  const body = JSON.stringify(payload);
  const stale: string[] = [];
  let sent = 0;
  let failed = 0;

  // Envois en petits lots : un broadcast de plusieurs milliers d'abonnés ne
  // doit pas ouvrir autant de requêtes HTTP simultanées.
  const BATCH = 50;
  for (let i = 0; i < subscriptions.length; i += BATCH) {
    const batch = subscriptions.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
            { TTL: 60 * 60 * 24 },
          );
          sent += 1;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) stale.push(sub.endpoint);
          else failed += 1;
        }
      }),
    );
  }

  if (stale.length > 0) {
    await db.delete(schema.pushSubscriptions).where(inArray(schema.pushSubscriptions.endpoint, stale));
  }

  return { sent, failed, pruned: stale.length, skipped: false };
}

/** Charge utile d'une annonce, prête pour le service worker. */
export function announcementToPushPayload(row: AnnouncementRecord, siteUrl: string): PushPayload {
  return {
    title: row.title,
    body: row.body ?? undefined,
    url: row.href ? new URL(row.href, siteUrl).toString() : `${siteUrl}/notifications`,
    image: row.image ?? undefined,
    tag: `announcement-${row.id}`,
  };
}
