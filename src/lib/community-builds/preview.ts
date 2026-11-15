import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";

/** Ce qu'un aperçu de build affiche (image OG, aperçu Discord) : rien de plus que la page. */
export type BuildPreview = {
  title: string;
  note: string | null;
  characterId: string;
  element: string | null;
  voteCount: number;
  views: number;
  authorName: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Chargement minimal en lecture seule, sans compteur de vues : un robot
 * d'aperçu ne doit pas faire monter les statistiques. Un build masqué par la
 * modération n'a pas d'aperçu.
 */
export async function loadBuildPreview(id: string): Promise<BuildPreview | null> {
  if (!UUID.test(id)) return null;
  try {
    const [row] = await getDb()
      .select({
        title: schema.builds.title,
        note: schema.builds.note,
        characterId: schema.builds.characterId,
        element: schema.builds.element,
        voteCount: schema.builds.voteCount,
        views: schema.builds.views,
        hidden: schema.builds.hidden,
        authorName: schema.users.name,
      })
      .from(schema.builds)
      .innerJoin(schema.users, eq(schema.users.id, schema.builds.userId))
      .where(eq(schema.builds.id, id))
      .limit(1);
    if (!row || row.hidden) return null;
    return {
      title: row.title,
      note: row.note,
      characterId: row.characterId,
      element: row.element,
      voteCount: row.voteCount,
      views: row.views,
      authorName: row.authorName,
    };
  } catch (error) {
    if (!isMissingTableError(error)) console.error("[builds] aperçu impossible :", error);
    return null;
  }
}
