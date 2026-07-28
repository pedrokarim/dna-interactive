export interface ChangelogEntry {
  date: string;
  version: string;
  type: "feature" | "update" | "fix" | "enhancement" | "security";
  /**
   * Clé dans le namespace `changelogEntries` des messages : `<key>.title`,
   * `<key>.description` et `<key>.items` (tableau, lu via `t.raw`). Les points
   * de la version sont remplacés par `_` car next-intl les traite comme des
   * séparateurs de namespace.
   */
  key: string;
}

/**
 * Métadonnées des entrées du changelog. Les textes vivent dans les fichiers de
 * messages pour être traduits ; seules la date, la version et la catégorie sont
 * portées ici.
 */
export const changelogData: ChangelogEntry[] = [
  { date: "2026-07-11", version: "2.2.0", type: "enhancement", key: "v2_2_0" },
  { date: "2026-06-25", version: "2.1.0", type: "feature", key: "v2_1_0" },
  { date: "2026-06-03", version: "2.0.0", type: "feature", key: "v2_0_0" },
  { date: "2026-04-15", version: "1.9.0", type: "feature", key: "v1_9_0" },
  { date: "2026-04-08", version: "1.8.0", type: "feature", key: "v1_8_0" },
  { date: "2026-04-08", version: "1.7.0", type: "feature", key: "v1_7_0" },
  { date: "2026-04-07", version: "1.6.0", type: "feature", key: "v1_6_0" },
  { date: "2026-03-21", version: "1.5.0", type: "feature", key: "v1_5_0" },
  { date: "2026-02-23", version: "1.4.0", type: "feature", key: "v1_4_0" },
  { date: "2026-02-22", version: "1.3.0", type: "feature", key: "v1_3_0" },
  { date: "2026-01-10", version: "1.2.1", type: "feature", key: "v1_2_1" },
  { date: "2026-01-05", version: "1.2.0", type: "security", key: "v1_2_0" },
  { date: "2025-12-24", version: "1.1.1", type: "enhancement", key: "v1_1_1" },
  { date: "2025-12-24", version: "1.1.0", type: "feature", key: "v1_1_0" },
  { date: "2025-12-24", version: "1.0.1", type: "enhancement", key: "v1_0_1" },
  { date: "2025-12-10", version: "1.0.0", type: "update", key: "v1_0_0" },
  { date: "2025-12-01", version: "0.9.0", type: "feature", key: "v0_9_0" },
];
