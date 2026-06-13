import {
  pgTable,
  serial,
  integer,
  smallint,
  text,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

/**
 * Une rotation des Covert Commissions, identifiée par le hash de son contenu.
 * On détecte un changement via `contentHash` et on borne dans le temps avec
 * `startedAt` (1ère observation) / `lastSeenAt` (dernière observation).
 *
 * NB : la table peut comporter des colonnes annexes alimentées par le pipeline
 * d'ingestion ; le site ne lit que les colonnes définies ici.
 */
export const commissionSnapshots = pgTable("commission_snapshots", {
  id: serial("id").primaryKey(),
  contentHash: text("content_hash").notNull().unique(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Détail d'une rotation : 1 ligne par (région × catégorie × slot).
 * `objective` stocke la clé EN canonique de l'objectif ; la localisation FR/EN
 * est faite à l'affichage.
 */
export const commissionEntries = pgTable(
  "commission_entries",
  {
    snapshotId: integer("snapshot_id")
      .notNull()
      .references(() => commissionSnapshots.id, { onDelete: "cascade" }),
    region: text("region").notNull(), // ASIA | AMERICA | HMT | EUROPE | SEA
    category: text("category").notNull(), // character | weapon | demon_wedge
    slot: smallint("slot").notNull(), // 1..3
    objective: text("objective").notNull(), // Expulsion | Termination | ...
  },
  (t) => [
    primaryKey({ columns: [t.snapshotId, t.region, t.category, t.slot] }),
    // Pour la future page stats : fréquence d'un objectif par région/catégorie.
    index("idx_entries_stats").on(t.region, t.category, t.objective),
  ],
);

export type CommissionSnapshotRow = typeof commissionSnapshots.$inferSelect;
export type CommissionEntryRow = typeof commissionEntries.$inferSelect;
