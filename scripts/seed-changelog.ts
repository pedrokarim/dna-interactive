/**
 * Transfert du changelog écrit en dur vers la base.
 *
 * Source : `src/lib/changelogData.ts` pour les métadonnées (version, date,
 * catégorie) et les sept fichiers de `src/messages/` pour les textes. Les
 * traductions déjà écrites sont donc conservées, aucune n'est perdue.
 *
 * Idempotent : clé naturelle sur le numéro de version. Relancer met à jour
 * l'existant plutôt que de créer un doublon, ce qui permet de rejouer le
 * transfert après avoir corrigé une traduction dans les fichiers de messages.
 *
 *   bun run scripts/seed-changelog.ts            (base de .env.development.local)
 *   DATABASE_URL=… bun run scripts/seed-changelog.ts
 */
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { changelogData } from "@/lib/changelogData";
import { locales } from "@/i18n/config";
import type { ChangelogTranslation } from "@/db/schema";

function readMessages(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(`src/messages/${locale}.json`, "utf8"));
}

async function main() {
  const db = getDb();

  // Un seul chargement par langue, réutilisé pour les 19 entrées.
  const messages = new Map<string, Record<string, ChangelogTranslation>>();
  for (const locale of locales) {
    const json = readMessages(locale) as { changelogEntries?: Record<string, ChangelogTranslation> };
    messages.set(locale, json.changelogEntries ?? {});
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of changelogData) {
    const translations: Record<string, ChangelogTranslation> = {};
    for (const locale of locales) {
      const text = messages.get(locale)?.[entry.key];
      // Une langue sans titre n'est pas une traduction : on ne la stocke pas,
      // la lecture retombera sur la langue par défaut.
      if (!text?.title) continue;
      translations[locale] = {
        title: text.title,
        description: text.description ?? "",
        items: Array.isArray(text.items) ? text.items : [],
      };
    }

    if (Object.keys(translations).length === 0) {
      console.warn(`  [ignorée] ${entry.version} — aucune traduction trouvée pour la clé « ${entry.key} »`);
      skipped += 1;
      continue;
    }

    const [existing] = await db
      .select({ id: schema.changelogEntries.id })
      .from(schema.changelogEntries)
      .where(eq(schema.changelogEntries.version, entry.version))
      .limit(1);

    const values = { date: entry.date, type: entry.type, translations, updatedAt: new Date() };

    if (existing) {
      await db.update(schema.changelogEntries).set(values).where(eq(schema.changelogEntries.id, existing.id));
      updated += 1;
    } else {
      await db.insert(schema.changelogEntries).values({ version: entry.version, ...values });
      inserted += 1;
    }

    console.log(`  ${entry.version.padEnd(7)} ${Object.keys(translations).length} langue(s)`);
  }

  console.log(`\n${inserted} insérée(s), ${updated} mise(s) à jour, ${skipped} ignorée(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
