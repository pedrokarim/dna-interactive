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
  // Hash scrypt du mot de passe (comptes natifs email/mdp). Null = compte
  // OAuth-only tant que l'utilisateur n'a pas défini de mot de passe.
  passwordHash: text("password_hash"),
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

// Tokens à usage unique pour les flux email natifs : vérification d'adresse et
// réinitialisation de mot de passe. Seul le HASH du token est stocké (le token
// en clair ne vit que dans le lien envoyé par email). Expiration obligatoire.
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["verify_email", "reset_password"] }).notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_auth_tokens_user").on(t.userId)],
);

// Journal d'envoi/ouverture des emails (stats admin). `token` = identifiant
// opaque encodé dans l'URL de l'asset de suivi (cf. lib/email/tracking.ts).
// `userId` en set null pour conserver les stats même si le compte est supprimé.
export const emailEvents = pgTable(
  "email_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    token: text("token").notNull().unique(),
    kind: text("kind").notNull(), // verify_email | reset_password | set_password | welcome | contact
    recipient: text("recipient").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
    openCount: integer("open_count").notNull().default(0),
    userAgent: text("user_agent"),
  },
  (t) => [
    index("idx_email_events_kind").on(t.kind),
    index("idx_email_events_sent").on(t.sentAt),
  ],
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
    views: integer("views").notNull().default(0),
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

// Votes anonymes par IP (plus de lien au compte). `voterKey` = hash non
// réversible de (IP + fenêtre 24h + secret) : stable dans la fenêtre courante
// (toggle possible), change à la fenêtre suivante (la même IP peut re-voter —
// l'abus est accepté, cf. lib/community-builds/vote-identity.ts). `builds.voteCount`
// reste le compteur cumulatif et permanent, jamais reconstruit depuis cette table.
export const buildIpVotes = pgTable(
  "build_ip_votes",
  {
    buildId: uuid("build_id")
      .notNull()
      .references(() => builds.id, { onDelete: "cascade" }),
    voterKey: text("voter_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.buildId, t.voterKey] }),
    index("idx_build_ip_votes_build").on(t.buildId),
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

// Journal d'audit des actions admin (qui a masqué/supprimé/banni/promu quoi).
// adminId en set null pour conserver la trace même si le compte admin est supprimé.
export const adminActions = pgTable(
  "admin_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: text("admin_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_admin_actions_admin").on(t.adminId),
    index("idx_admin_actions_created").on(t.createdAt),
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

// ---------------------------------------------------------------------------
// Calendrier des événements — pilotable via l'admin.
// Dates en texte ISO "YYYY-MM-DD" (cohérent avec la logique déterministe du
// calendrier). `category` texte libre validé côté lecture.
// ---------------------------------------------------------------------------
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    image: text("image"),
    href: text("href"),
    description: text("description"),
    sourceUrl: text("source_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    hidden: boolean("hidden").notNull().default(false),
    createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_calendar_events_dates").on(t.startDate, t.endDate)],
);

// ---------------------------------------------------------------------------
// Réglages applicatifs pilotables via l'admin — 1 ligne (key = "config"),
// valeur = objet JSON des réglages (cf. src/lib/settings).
// ---------------------------------------------------------------------------
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CommissionSnapshotRow = typeof commissionSnapshots.$inferSelect;
export type CommissionEntryRow = typeof commissionEntries.$inferSelect;
export type CalendarEventRow = typeof calendarEvents.$inferSelect;
export type AppSettingsRow = typeof appSettings.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type AuthTokenRow = typeof authTokens.$inferSelect;
export type EmailEventRow = typeof emailEvents.$inferSelect;
export type BuildRow = typeof builds.$inferSelect;
export type BuildDraftRow = typeof buildDrafts.$inferSelect;
export type BuildIpVoteRow = typeof buildIpVotes.$inferSelect;
export type BuildReportRow = typeof buildReports.$inferSelect;
