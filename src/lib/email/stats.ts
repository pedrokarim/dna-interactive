import "server-only";
import { desc, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";

export type EmailStats = {
  total: number;
  opened: number;
  openRate: number; // %
  byKind: Array<{ kind: string; sent: number; opened: number }>;
  recent: Array<{
    recipient: string;
    kind: string;
    sentAt: string;
    openedAt: string | null;
    openCount: number;
  }>;
};

const EMPTY: EmailStats = { total: 0, opened: 0, openRate: 0, byKind: [], recent: [] };

/** Stats d'envoi/ouverture des emails. Sûr si la table est absente. */
export async function getEmailStats(): Promise<EmailStats> {
  const db = getDb();
  try {
    const [totals] = await db
      .select({
        total: sql<number>`count(*)::int`,
        opened: sql<number>`count(${schema.emailEvents.openedAt})::int`,
      })
      .from(schema.emailEvents);

    const byKind = await db
      .select({
        kind: schema.emailEvents.kind,
        sent: sql<number>`count(*)::int`,
        opened: sql<number>`count(${schema.emailEvents.openedAt})::int`,
      })
      .from(schema.emailEvents)
      .groupBy(schema.emailEvents.kind)
      .orderBy(sql`count(*) desc`);

    const recent = await db
      .select({
        recipient: schema.emailEvents.recipient,
        kind: schema.emailEvents.kind,
        sentAt: schema.emailEvents.sentAt,
        openedAt: schema.emailEvents.openedAt,
        openCount: schema.emailEvents.openCount,
      })
      .from(schema.emailEvents)
      .orderBy(desc(schema.emailEvents.sentAt))
      .limit(25);

    const total = totals?.total ?? 0;
    const opened = totals?.opened ?? 0;
    return {
      total,
      opened,
      openRate: total > 0 ? Math.round((opened / total) * 100) : 0,
      byKind: byKind.map((r) => ({ kind: r.kind, sent: r.sent, opened: r.opened })),
      recent: recent.map((r) => ({
        recipient: r.recipient,
        kind: r.kind,
        sentAt: String(r.sentAt),
        openedAt: r.openedAt ? String(r.openedAt) : null,
        openCount: r.openCount,
      })),
    };
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return EMPTY;
  }
}
