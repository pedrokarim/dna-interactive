/**
 * Prépare l'annonce de sortie de Falsi, **en brouillon**.
 *
 * Le script n'envoie rien : il crée (ou met à jour) une ligne `announcements`
 * en statut `draft`. La publication et la diffusion push/email restent des
 * gestes explicites depuis l'admin – un script qui envoie un email à toute la
 * base au moment où on le lance est un accident qui attend son heure.
 *
 * Idempotent : clé naturelle sur le titre.
 *
 *   bun run scripts/seed-announcement-falsi.ts
 */
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getUpcomingCharacter } from "@/lib/characters/upcoming";

const TITLE = "Falsi arrive avec la version 1.6";

async function main() {
  const falsi = getUpcomingCharacter("falsi");
  if (!falsi) {
    throw new Error("Falsi n'est plus dans la liste des personnages à venir – annonce à revoir à la main.");
  }

  const body = [
    `${falsi.name}, ${falsi.rarity} étoiles Pyro de l'${falsi.campLabel}, ouvre la version ${falsi.version} « ${falsi.versionName} » le ${new Date(`${falsi.releaseDate}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.`,
    "Sa fiche est déjà en ligne : élément, armes, statistiques de base projetées au niveau 80, kit connu et rôle dans l'histoire – avec, pour chaque information, son niveau de fiabilité.",
  ].join("\n\n");

  const db = getDb();
  const [existing] = await db
    .select({ id: schema.announcements.id })
    .from(schema.announcements)
    .where(eq(schema.announcements.title, TITLE))
    .limit(1);

  const values = {
    title: TITLE,
    body,
    href: `/characters/${falsi.slug}`,
    kind: "release" as const,
    audience: "everyone" as const,
    status: "draft" as const,
    pinned: true,
    // Programmée sur la date de sortie ; l'annonce restera invisible jusque-là
    // même si elle est publiée avant.
    publishedAt: falsi.releaseDate ? new Date(`${falsi.releaseDate}T03:00:00Z`) : null,
    expiresAt: new Date("2026-10-20T03:00:00Z"),
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(schema.announcements).set(values).where(eq(schema.announcements.id, existing.id));
    console.log(`Annonce mise à jour (${existing.id}).`);
  } else {
    const [row] = await db.insert(schema.announcements).values(values).returning({ id: schema.announcements.id });
    console.log(`Annonce créée (${row?.id}).`);
  }

  console.log("Statut : brouillon. Publier et diffuser depuis /admin?vue=announcements.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
