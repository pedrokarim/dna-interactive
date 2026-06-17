import {
  boolean,
  jsonb,
  pgTable,
  uuid,
  serial,
  integer,
  smallint,
  text,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------------------------------------------------------------------------
// Auth.js (Discord)
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  discordId: text("discord_id").unique(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("idx_accounts_user").on(t.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [index("idx_sessions_user").on(t.userId)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const authenticators = pgTable(
  "authenticators",
  {
    credentialID: text("credential_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.credentialID] })],
);

// ---------------------------------------------------------------------------
// Community build builder
// ---------------------------------------------------------------------------

type BuildPayloadJson = Record<string, unknown>;

export const builds = pgTable(
  "builds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: text("character_id").notNull(),
    element: text("element"),
    title: text("title").notNull(),
    note: text("note"),
    payload: jsonb("payload").$type<BuildPayloadJson>().notNull(),
    voteCount: integer("vote_count").notNull().default(0),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_builds_character").on(t.characterId, t.element),
    index("idx_builds_user_character").on(t.userId, t.characterId),
    index("idx_builds_vote_count").on(t.voteCount),
  ],
);

export const buildDrafts = pgTable(
  "build_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: text("character_id").notNull(),
    // "default" représente les personnages mono-élément / élément absent.
    element: text("element").notNull().default("default"),
    title: text("title"),
    note: text("note"),
    payload: jsonb("payload").$type<BuildPayloadJson>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uidx_build_drafts_target").on(t.userId, t.characterId, t.element),
    index("idx_build_drafts_user").on(t.userId),
  ],
);

export const buildVotes = pgTable(
  "build_votes",
  {
    buildId: uuid("build_id")
      .notNull()
      .references(() => builds.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.buildId, t.userId] }),
    index("idx_build_votes_user").on(t.userId),
  ],
);

export const buildReports = pgTable(
  "build_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buildId: uuid("build_id")
      .notNull()
      .references(() => builds.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["open", "resolved", "dismissed"] }).notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedById: text("resolved_by_id").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [
    index("idx_build_reports_build").on(t.buildId),
    index("idx_build_reports_status").on(t.status),
  ],
);

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
export type UserRow = typeof users.$inferSelect;
export type BuildRow = typeof builds.$inferSelect;
export type BuildDraftRow = typeof buildDrafts.$inferSelect;
export type BuildVoteRow = typeof buildVotes.$inferSelect;
export type BuildReportRow = typeof buildReports.$inferSelect;
