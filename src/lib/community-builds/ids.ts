/** Format des identifiants de build (colonne `uuid` en base). */
const BUILD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * À vérifier avant toute requête : Postgres refuse un texte qui n'a pas la
 * forme d'un uuid, et la route répondait 500 au lieu de « build introuvable »
 * (`/api/builds/986594468`, 16/11/2026).
 */
export function isBuildId(value: string): boolean {
  return BUILD_ID.test(value);
}
