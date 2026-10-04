/**
 * Seed / upsert des rotations du théâtre immersif dans la BDD (`theatre_rotations`).
 *
 * Source = `src/data/theatre/rotations.json`, la liste livrée avec le site.
 * Idempotent : la clé est le numéro de saison du jeu → met à jour l'existant,
 * insère le nouveau, ne touche pas aux rotations saisies à la main via l'admin
 * (elles n'ont pas de numéro de saison).
 *
 * La note, le lien d'annonce et le masquage appartiennent à l'admin : le seed
 * ne les écrase jamais.
 *
 *   bun run scripts/seed-theatre-rotations.ts      (ou : bun run seed:theatre)
 */
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { STATIC_THEATRE_ROTATIONS } from "@/lib/theatre/rotations";

async function main() {
  const db = getDb();

  const existing = await db
    .select({ id: schema.theatreRotations.id, seasonId: schema.theatreRotations.seasonId })
    .from(schema.theatreRotations);
  const idBySeason = new Map(existing.filter((e) => e.seasonId != null).map((e) => [e.seasonId as number, e.id] as const));

  let inserted = 0;
  let updated = 0;

  for (const rotation of STATIC_THEATRE_ROTATIONS) {
    if (rotation.seasonId == null) continue;
    const values = {
      seasonId: rotation.seasonId,
      startsAt: new Date(rotation.startsAt),
      endsAt: new Date(rotation.endsAt),
      featuredKind: rotation.featured.kind,
      featuredId: rotation.featured.id,
      updatedAt: new Date(),
    };
    const id = idBySeason.get(rotation.seasonId);
    if (id) {
      await db.update(schema.theatreRotations).set(values).where(eq(schema.theatreRotations.id, id));
      updated += 1;
    } else {
      await db.insert(schema.theatreRotations).values(values);
      inserted += 1;
    }
  }

  console.log(`Théâtre: ${inserted} ajoutée(s), ${updated} mise(s) à jour, ${STATIC_THEATRE_ROTATIONS.length} au total.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed théâtre échoué:", error);
    process.exit(1);
  });
