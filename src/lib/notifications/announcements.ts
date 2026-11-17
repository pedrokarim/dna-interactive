import "server-only";
import { and, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import type { AnnouncementAudience, AppNotification } from "./types";

export type AnnouncementRecord = typeof schema.announcements.$inferSelect;

/**
 * Annonces visibles par un lecteur donné, à l'instant `now`.
 *
 * Visible = publiée, date de publication passée (une date future veut dire
 * programmée) et pas expirée. L'audience se filtre ici et pas côté client : une
 * annonce réservée aux admins ne doit pas passer sur le réseau.
 *
 * Si la table n'existe pas encore (migration pas appliquée), liste vide.
 */
export async function getVisibleAnnouncements(
  viewer: { authenticated: boolean; isAdmin: boolean },
  now: Date = new Date(),
): Promise<AnnouncementRecord[]> {
  const audiences: AnnouncementAudience[] = ["everyone"];
  if (viewer.authenticated) audiences.push("authenticated");
  if (viewer.isAdmin) audiences.push("admins");

  const db = getDb();
  try {
    return await db
      .select()
      .from(schema.announcements)
      .where(
        and(
          eq(schema.announcements.status, "published"),
          lte(schema.announcements.publishedAt, now),
          or(isNull(schema.announcements.expiresAt), gt(schema.announcements.expiresAt, now)),
          inArray(schema.announcements.audience, audiences),
        ),
      )
      .orderBy(desc(schema.announcements.pinned), desc(schema.announcements.publishedAt))
      .limit(50);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

/** Ligne d'annonce convertie au format commun du fil. */
export function toNotification(row: AnnouncementRecord): AppNotification {
  return {
    id: row.id,
    source: "announcement",
    kind: row.kind,
    title: row.title,
    body: row.body ?? undefined,
    href: row.href ?? undefined,
    image: row.image ?? undefined,
    pinned: row.pinned,
    createdAt: (row.publishedAt ?? row.createdAt).toISOString(),
  };
}

/** Toutes les annonces, brouillons compris. Pour l'admin seulement. */
export async function listAllAnnouncements(): Promise<AnnouncementRecord[]> {
  const db = getDb();
  try {
    return await db
      .select()
      .from(schema.announcements)
      .orderBy(desc(schema.announcements.createdAt))
      .limit(200);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}
