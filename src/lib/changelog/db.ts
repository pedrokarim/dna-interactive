import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { defaultLocale } from "@/i18n/config";
import {
  CHANGELOG_PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  type ChangelogPage,
  type ChangelogPublicEntry,
  type ChangelogType,
  type ChangelogVersionRef,
} from "./types";
import type { ChangelogEntryRow, ChangelogTranslation } from "@/db/schema";

/**
 * Ordre du journal : du plus récent au plus ancien.
 *
 * La version est comparée **numériquement**, pas alphabétiquement : en texte,
 * « 1.9.0 » passerait après « 1.10.0 ». Le format est verrouillé à l'écriture
 * (cf. `isValidVersion`) pour que la conversion ne puisse pas échouer.
 */
const VERSION_KEY = sql`string_to_array(${schema.changelogEntries.version}, '.')::int[]`;

/**
 * Résout une entrée dans la langue demandée.
 *
 * Repli en cascade : la langue voulue, puis la langue par défaut du site, puis
 * la première disponible. Une entrée n'est jamais masquée parce qu'elle n'a pas
 * été traduite — elle s'affiche dans la langue où elle a été écrite.
 */
function resolve(row: ChangelogEntryRow, locale: string): ChangelogPublicEntry | null {
  const translations = row.translations as Record<string, ChangelogTranslation>;
  const available = Object.keys(translations);
  const picked = translations[locale]
    ? locale
    : translations[defaultLocale]
      ? defaultLocale
      : available[0];
  const text = picked ? translations[picked] : undefined;
  if (!text?.title) return null;

  return {
    version: row.version,
    date: row.date,
    type: row.type as ChangelogType,
    title: text.title,
    description: text.description ?? "",
    items: Array.isArray(text.items) ? text.items : [],
    locale: picked,
  };
}

/**
 * Une page du journal, du plus récent au plus ancien.
 *
 * `cursor` reprend la dernière entrée reçue ; `startAt` saute directement à une
 * version donnée (saut rapide depuis le sélecteur). Les deux se traduisent par
 * la même comparaison de couple `(date, version)`.
 */
export async function getChangelogPage({
  locale,
  cursor,
  startAt,
  limit = CHANGELOG_PAGE_SIZE,
}: {
  locale: string;
  cursor?: string | null;
  startAt?: string | null;
  limit?: number;
}): Promise<ChangelogPage> {
  const db = getDb();

  try {
    // Un saut rapide se ramène à un curseur : on lit la date de la version
    // visée, puis on repart de ce couple — bornes incluses cette fois.
    let after = decodeCursor(cursor);
    let inclusive = false;
    if (!after && startAt) {
      const [target] = await db
        .select({ date: schema.changelogEntries.date, version: schema.changelogEntries.version })
        .from(schema.changelogEntries)
        .where(eq(schema.changelogEntries.version, startAt))
        .limit(1);
      if (target) {
        after = target;
        inclusive = true;
      }
    }

    const where = after
      ? and(
          eq(schema.changelogEntries.hidden, false),
          inclusive
            ? sql`(${schema.changelogEntries.date}, ${VERSION_KEY}) <= (${after.date}, string_to_array(${after.version}, '.')::int[])`
            : sql`(${schema.changelogEntries.date}, ${VERSION_KEY}) < (${after.date}, string_to_array(${after.version}, '.')::int[])`,
        )
      : eq(schema.changelogEntries.hidden, false);

    // On demande un élément de plus que la page : sa présence dit s'il reste
    // quelque chose à charger, sans second appel de comptage.
    const rows = await db
      .select()
      .from(schema.changelogEntries)
      .where(where)
      .orderBy(sql`${schema.changelogEntries.date} DESC, ${VERSION_KEY} DESC`)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const entries = page.map((row) => resolve(row, locale)).filter((e): e is ChangelogPublicEntry => e !== null);

    return {
      entries,
      nextCursor: hasMore && page.length > 0 ? encodeCursor(page[page.length - 1]) : null,
      migrationPending: false,
    };
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    // Table absente : la page publique repart de la liste écrite en dur.
    return { entries: [], nextCursor: null, migrationPending: true };
  }
}

/**
 * Index léger de toutes les versions, pour le sélecteur de saut rapide.
 * Trois colonnes seulement : l'index doit rester chargeable d'un coup.
 */
export async function getChangelogVersionIndex(): Promise<ChangelogVersionRef[]> {
  const db = getDb();
  try {
    const rows = await db
      .select({
        version: schema.changelogEntries.version,
        date: schema.changelogEntries.date,
        type: schema.changelogEntries.type,
      })
      .from(schema.changelogEntries)
      .where(eq(schema.changelogEntries.hidden, false))
      .orderBy(sql`${schema.changelogEntries.date} DESC, ${VERSION_KEY} DESC`);
    return rows as ChangelogVersionRef[];
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

/** Toutes les entrées, brouillons masqués compris — usage administration. */
export async function listAllChangelogEntries(): Promise<ChangelogEntryRow[]> {
  const db = getDb();
  try {
    return await db
      .select()
      .from(schema.changelogEntries)
      .orderBy(sql`${schema.changelogEntries.date} DESC, ${VERSION_KEY} DESC`);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}
