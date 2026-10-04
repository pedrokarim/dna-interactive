/**
 * Prépare l'annonce du suivi du Théâtre immersif.
 *
 * L'annonce est **publiée mais programmée** : la cloche ne montre une annonce
 * qu'à partir de sa date de publication, elle apparaîtra donc toute seule à
 * l'heure dite. Rien n'est diffusé : le push et l'email restent des gestes
 * explicites depuis l'admin – un script qui envoie un email à toute la base au
 * moment où on le lance est un accident qui attend son heure.
 *
 * Idempotent : clé naturelle sur le titre.
 *
 *   bun run scripts/seed-announcement-theatre.ts          (base visée par l'environnement)
 *   bun run scripts/seed-announcement-theatre.ts --sql    (écrit le SQL sur la sortie, sans toucher à rien)
 *
 * Le mode `--sql` sert quand la base n'est joignable que par le serveur : on y
 * rejoue le même contenu, sans le retaper.
 */
const TITLE = "Le Théâtre immersif a sa page de suivi";

const BODY = [
  "Une nouvelle page suit les rotations du Théâtre immersif : ce qui est à l’affiche, le temps restant avant la bascule, et toutes les rotations passées depuis la sortie du jeu.",
  "En ce moment : Plume sanguine, la quatrième arme de calamité. Sa fiche a été mise à jour avec ses builds de Demon Wedges, et elle devient le premier choix à distance de Falsi.",
].join("\n\n");

const VALUES = {
  title: TITLE,
  body: BODY,
  href: "/theatre",
  kind: "info" as const,
  audience: "everyone" as const,
  status: "published" as const,
  pinned: false,
  // Lundi 5 octobre 2026, 9 h à Paris.
  publishedAt: new Date("2026-10-05T09:00:00+02:00"),
  // Fin de la rotation en cours : au-delà, « en ce moment » ne serait plus vrai.
  expiresAt: new Date("2026-10-19T09:00:00Z"),
};

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

function toSql(): string {
  const v = VALUES;
  return [
    "BEGIN;",
    `UPDATE announcements SET body = ${quote(v.body)}, href = ${quote(v.href)}, kind = ${quote(v.kind)}, audience = ${quote(v.audience)},`,
    `  status = ${quote(v.status)}, pinned = ${v.pinned}, published_at = ${quote(v.publishedAt.toISOString())}, expires_at = ${quote(v.expiresAt.toISOString())}, updated_at = now()`,
    `  WHERE title = ${quote(v.title)};`,
    "INSERT INTO announcements (title, body, href, kind, audience, status, pinned, published_at, expires_at)",
    `  SELECT ${quote(v.title)}, ${quote(v.body)}, ${quote(v.href)}, ${quote(v.kind)}, ${quote(v.audience)}, ${quote(v.status)}, ${v.pinned}, ${quote(v.publishedAt.toISOString())}, ${quote(v.expiresAt.toISOString())}`,
    `  WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = ${quote(v.title)});`,
    "COMMIT;",
    `SELECT id, status, published_at, expires_at, push_sent_at, email_sent_at FROM announcements WHERE title = ${quote(v.title)};`,
    "",
  ].join("\n");
}

async function main() {
  if (process.argv.includes("--sql")) {
    process.stdout.write(toSql());
    return;
  }

  const { eq } = await import("drizzle-orm");
  const { getDb, schema } = await import("@/db");
  const db = getDb();
  const [existing] = await db
    .select({ id: schema.announcements.id })
    .from(schema.announcements)
    .where(eq(schema.announcements.title, TITLE))
    .limit(1);

  const values = { ...VALUES, updatedAt: new Date() };
  if (existing) {
    await db.update(schema.announcements).set(values).where(eq(schema.announcements.id, existing.id));
    console.log(`Annonce mise à jour (${existing.id}).`);
  } else {
    const [row] = await db.insert(schema.announcements).values(values).returning({ id: schema.announcements.id });
    console.log(`Annonce créée (${row?.id}).`);
  }

  console.log(`Statut : publiée, visible dans la cloche à partir du ${VALUES.publishedAt.toISOString()}.`);
  console.log("Push et email : à diffuser depuis /admin?vue=announcements.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
