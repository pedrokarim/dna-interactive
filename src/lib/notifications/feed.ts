import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { getVisibleAnnouncements, toNotification } from "./announcements";
import { getDerivedNotifications } from "./derive";
import type { AppNotification, NotificationFeed } from "./types";

/** Taille max du fil, personne ne fait défiler plus loin. */
const FEED_LIMIT = 40;

type Viewer = { id: string; role: "user" | "admin" } | null;

/**
 * Fil d'un lecteur : annonces publiées + notifications dérivées de son compte,
 * épinglées d'abord, puis de la plus récente à la plus ancienne.
 *
 * Marche aussi pour un anonyme (`viewer` à `null`) : il reçoit les annonces
 * « everyone » et son état de lecture reste dans le navigateur.
 *
 * @param locale langue des notifications dérivées, dont le texte est écrit ici.
 */
export async function getNotificationFeed(viewer: Viewer, locale: string): Promise<NotificationFeed> {
  const announcements = await getVisibleAnnouncements({
    authenticated: Boolean(viewer),
    isAdmin: viewer?.role === "admin",
  });

  const derived = viewer ? await getDerivedNotifications(viewer, locale) : [];
  const items: AppNotification[] = [...announcements.map(toNotification), ...derived];

  items.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
  const sliced = items.slice(0, FEED_LIMIT);

  if (!viewer) {
    return { notifications: sliced, unread: 0, persisted: false };
  }

  const readIds = await getReadIds(viewer.id, sliced.map((n) => n.id));
  let unread = 0;
  for (const item of sliced) {
    item.read = readIds.has(item.id);
    if (!item.read) unread += 1;
  }
  return { notifications: sliced, unread, persisted: true };
}

/** Ceux des ids fournis qui sont déjà lus. Ensemble vide si la table manque. */
async function getReadIds(userId: string, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const db = getDb();
  try {
    const rows = await db
      .select({ notificationId: schema.notificationReads.notificationId })
      .from(schema.notificationReads)
      .where(
        and(
          eq(schema.notificationReads.userId, userId),
          inArray(schema.notificationReads.notificationId, ids),
        ),
      );
    return new Set(rows.map((r) => r.notificationId));
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return new Set();
  }
}

/**
 * Marque des notifications comme lues pour un compte.
 *
 * `onConflictDoNothing` : relire une notification déjà lue ne doit pas échouer
 * ni changer la date de première lecture.
 */
export async function markNotificationsRead(userId: string, ids: string[]): Promise<number> {
  const unique = [...new Set(ids)].filter((id) => id.length > 0 && id.length <= 200);
  if (unique.length === 0) return 0;
  const db = getDb();
  try {
    await db
      .insert(schema.notificationReads)
      .values(unique.map((notificationId) => ({ userId, notificationId })))
      .onConflictDoNothing();
    return unique.length;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return 0;
  }
}
