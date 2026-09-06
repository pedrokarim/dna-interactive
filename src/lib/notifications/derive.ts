import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import type { AppNotification } from "./types";

/**
 * Notifications DÉRIVÉES des tables existantes (aucune table dédiée) :
 * - modération de mes builds (adminActions)
 * - signalements ouverts (admins)
 *
 * Elles complètent les annonces poussées par l'administration : ce sont les
 * seules notifications qui dépendent du compte qui regarde. Sûr si une table
 * est absente.
 *
 * NB : les votes étant anonymes (par IP), on ne peut plus notifier « X a aimé
 * ton build » – cette source a été retirée.
 */
export async function getDerivedNotifications(user: {
  id: string;
  role: "user" | "admin";
}): Promise<AppNotification[]> {
  const db = getDb();
  const out: AppNotification[] = [];

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
        .where(
          and(
            eq(schema.adminActions.targetType, "build"),
            inArray(schema.adminActions.targetId, [...titleById.keys()]),
          ),
        )
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
          source: "derived",
          kind: "moderation",
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
          // L'identifiant intègre le nombre de signalements : traiter la pile
          // puis en recevoir un nouveau redonne bien une notification non lue.
          id: `reports-open-${reports.length}`,
          source: "derived",
          kind: "report",
          title: `${reports.length} signalement${reports.length > 1 ? "s" : ""} à traiter`,
          href: "/admin?vue=reports",
          createdAt: new Date(reports[0].createdAt).toISOString(),
        });
      }
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
  }

  return out;
}
