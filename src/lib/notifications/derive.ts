import "server-only";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";

export type NotificationType = "build_vote" | "build_moderated" | "report_new";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  createdAt: string; // ISO
};

/**
 * Notifications DÉRIVÉES des tables existantes (aucune table dédiée) :
 * - likes reçus sur mes builds
 * - modération de mes builds (adminActions)
 * - signalements ouverts (admins)
 * Sûr si une table est absente. L'état lu/non-lu est géré côté client (localStorage).
 */
export async function getNotifications(user: { id: string; role: "user" | "admin" }): Promise<AppNotification[]> {
  const db = getDb();
  const out: AppNotification[] = [];

  // Likes reçus sur mes builds (hors auto-vote)
  try {
    const rows = await db
      .select({
        createdAt: schema.buildVotes.createdAt,
        buildId: schema.builds.id,
        title: schema.builds.title,
        voter: schema.users.name,
      })
      .from(schema.buildVotes)
      .innerJoin(schema.builds, eq(schema.builds.id, schema.buildVotes.buildId))
      .innerJoin(schema.users, eq(schema.users.id, schema.buildVotes.userId))
      .where(and(eq(schema.builds.userId, user.id), ne(schema.buildVotes.userId, user.id)))
      .orderBy(desc(schema.buildVotes.createdAt))
      .limit(15);
    for (const r of rows) {
      const iso = new Date(r.createdAt).toISOString();
      out.push({
        id: `vote-${r.buildId}-${Date.parse(iso)}`,
        type: "build_vote",
        title: `${r.voter ?? "Un joueur"} a aimé ton build`,
        body: r.title,
        href: `/builds/${r.buildId}`,
        createdAt: iso,
      });
    }
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  // Modération de mes builds
  try {
    const myBuilds = await db
      .select({ id: schema.builds.id, title: schema.builds.title })
      .from(schema.builds)
      .where(eq(schema.builds.userId, user.id));
    if (myBuilds.length > 0) {
      const titleById = new Map(myBuilds.map((b) => [b.id, b.title] as const));
      const acts = await db
        .select({
          createdAt: schema.adminActions.createdAt,
          action: schema.adminActions.action,
          targetId: schema.adminActions.targetId,
        })
        .from(schema.adminActions)
        .where(and(eq(schema.adminActions.targetType, "build"), inArray(schema.adminActions.targetId, [...titleById.keys()])))
        .orderBy(desc(schema.adminActions.createdAt))
        .limit(10);
      for (const a of acts) {
        const verb = /hide|masqu/i.test(a.action)
          ? "masqué"
          : /remove|delete|retir/i.test(a.action)
            ? "retiré"
            : /unhide|restore|rétabl/i.test(a.action)
              ? "rétabli"
              : "modéré";
        const iso = new Date(a.createdAt).toISOString();
        out.push({
          id: `mod-${a.targetId}-${Date.parse(iso)}`,
          type: "build_moderated",
          title: `Ton build a été ${verb}`,
          body: a.targetId ? titleById.get(a.targetId) : undefined,
          href: "/profile",
          createdAt: iso,
        });
      }
    }
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  // Signalements ouverts (admins)
  if (user.role === "admin") {
    try {
      const reports = await db
        .select({ createdAt: schema.buildReports.createdAt })
        .from(schema.buildReports)
        .where(eq(schema.buildReports.status, "open"))
        .orderBy(desc(schema.buildReports.createdAt));
      if (reports.length > 0) {
        out.push({
          id: "reports-open",
          type: "report_new",
          title: `${reports.length} signalement${reports.length > 1 ? "s" : ""} à traiter`,
          href: "/admin",
          createdAt: new Date(reports[0].createdAt).toISOString(),
        });
      }
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return out.slice(0, 20);
}
