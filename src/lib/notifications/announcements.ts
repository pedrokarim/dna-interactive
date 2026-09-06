import "server-only";
import { and, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import type { AnnouncementAudience, AppNotification } from "./types";

export type AnnouncementRecord = typeof schema.announcements.$inferSelect;

/**
 * Annonces visibles par un lecteur donné, à l'instant `now`.
 *
 * Une annonce est visible si elle est publiée, que sa date de publication est
 * passée (une date future = annonce programmée, invisible jusque-là) et qu'elle
 * n'a pas expiré. Le filtrage d'audience se fait ici, jamais côté client : une
 * annonce réservée aux admins ne doit pas transiter par le réseau.
 *
 * Sûr si la table n'existe pas encore (migration non appliquée) → liste vide.
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

/** Projette une ligne d'annonce sur le modèle commun du fil. */
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

/** Toutes les annonces, brouillons compris – usage administration seulement. */
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
