import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";

export type TopBuild = {
  id: string;
  characterId: string;
  element: string | null;
  title: string;
  tags: string[];
  voteCount: number;
  views: number;
  authorName: string | null;
};

/** Meilleurs builds publiés (par votes) — pour la vitrine de la home. Sûr si table absente. */
export async function getTopBuilds(limit = 8): Promise<TopBuild[]> {
  const db = getDb();
  try {
    const rows = await db
      .select({
        id: schema.builds.id,
        characterId: schema.builds.characterId,
        element: schema.builds.element,
        title: schema.builds.title,
        payload: schema.builds.payload,
        voteCount: schema.builds.voteCount,
        views: schema.builds.views,
        authorName: schema.users.name,
      })
      .from(schema.builds)
      .innerJoin(schema.users, eq(schema.users.id, schema.builds.userId))
      .where(eq(schema.builds.hidden, false))
      .orderBy(desc(schema.builds.voteCount), desc(schema.builds.updatedAt))
      .limit(limit);

    return rows.map((row) => {
      const tags = (row.payload as { tags?: unknown } | null)?.tags;
      return {
        id: row.id,
        characterId: row.characterId,
        element: row.element,
        title: row.title,
        tags: Array.isArray(tags) ? (tags as string[]).slice(0, 3) : [],
        voteCount: row.voteCount ?? 0,
        views: row.views ?? 0,
        authorName: row.authorName,
      };
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

/** Nombre total de builds publics. Sûr si table absente. */
export async function getBuildsTotal(): Promise<number> {
  const db = getDb();
  try {
    const [{ value = 0 } = { value: 0 }] = await db
      .select({ value: count() })
      .from(schema.builds)
      .where(eq(schema.builds.hidden, false));
    return value;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return 0;
  }
}
