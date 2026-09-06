import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { getVisibleAnnouncements, toNotification } from "./announcements";
import { getDerivedNotifications } from "./derive";
import type { AppNotification, NotificationFeed } from "./types";

/** Plafond du fil : au-delà, plus personne ne fait défiler. */
const FEED_LIMIT = 40;

type Viewer = { id: string; role: "user" | "admin" } | null;

/**
 * Fil complet d'un lecteur : annonces publiées + notifications dérivées de son
 * compte, triées épinglées d'abord puis du plus récent au plus ancien.
 *
 * Fonctionne pour un visiteur anonyme (`viewer` à `null`) : il reçoit les
 * annonces d'audience « everyone » et son état de lecture reste côté navigateur.
 */
export async function getNotificationFeed(viewer: Viewer): Promise<NotificationFeed> {
  const announcements = await getVisibleAnnouncements({
    authenticated: Boolean(viewer),
    isAdmin: viewer?.role === "admin",
  });

  const derived = viewer ? await getDerivedNotifications(viewer) : [];
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

/** Identifiants déjà lus parmi ceux fournis. Sûr si la table est absente. */
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
 * `onConflictDoNothing` : relire une notification déjà lue ne doit ni échouer
 * ni déplacer la date de première lecture.
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
