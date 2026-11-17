import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { toRotationView, type TheatreRotationView } from "./featured";
import { STATIC_THEATRE_ROTATIONS, toFeaturedKind, type TheatreRotation } from "./rotations";

type Row = typeof schema.theatreRotations.$inferSelect;

export function rowToRotation(r: Row): TheatreRotation {
  return {
    id: r.id,
    seasonId: r.seasonId ?? undefined,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    featured: { kind: toFeaturedKind(r.featuredKind), id: r.featuredId },
    note: r.note ?? undefined,
    sourceUrl: r.sourceUrl ?? undefined,
  };
}

/**
 * Rotations du théâtre depuis la BDD (`theatre_rotations`, non masquées), de la
 * plus ancienne à la plus récente.
 *
 * Si la table est vide ou absente (avant la migration), on prend la liste livrée
 * avec le site. Si elle n'a que des lignes masquées, on rend une liste vide.
 * L'historique tient en quelques dizaines de lignes : on charge tout d'un coup.
 */
export async function getTheatreRotations(): Promise<TheatreRotation[]> {
  try {
    const rows = await getDb()
      .select()
      .from(schema.theatreRotations)
      .where(eq(schema.theatreRotations.hidden, false))
      .orderBy(asc(schema.theatreRotations.startsAt));
    if (rows.length === 0) {
      const [any] = await getDb().select({ id: schema.theatreRotations.id }).from(schema.theatreRotations).limit(1);
      return any ? [] : STATIC_THEATRE_ROTATIONS;
    }
    return rows.map(rowToRotation);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return STATIC_THEATRE_ROTATIONS;
  }
}

/**
 * De quoi afficher le théâtre : les rotations avec noms et visuels dans la
 * langue demandée, et l'heure du serveur pour le premier rendu (le client
 * reprend ensuite son horloge).
 */
export async function getTheatreSnapshot(locale: string): Promise<{ rotations: TheatreRotationView[]; serverNow: number }> {
  const rotations = await getTheatreRotations();
  return { rotations: rotations.map((rotation) => toRotationView(rotation, locale)), serverNow: Date.now() };
}
