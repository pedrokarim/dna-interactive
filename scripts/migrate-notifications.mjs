/**
 * Création des tables applicatives (notifications, changelog), en SQL ciblé.
 *
 * `drizzle-kit push` est inutilisable sur cette base : il détecte un écart sur
 * `email_events` et propose une troncature destructive. On crée donc les
 * nouvelles tables à la main, en `IF NOT EXISTS`, ce qui rend le script
 * rejouable sans risque sur une base déjà migrée.
 *
 *   node scripts/migrate-notifications.mjs                             (.env.local)
 *   node scripts/migrate-notifications.mjs --env .env.development.local
 */
import { readFileSync } from "node:fs";
import pg from "pg";

/**
 * Charge DATABASE_URL depuis un fichier d'environnement, sans dépendance.
 *
 * Le fichier est EXPLICITE, jamais deviné : ce dépôt en a deux – `.env.local`
 * pointe sur la base partagée, `.env.development.local` sur la base Docker
 * locale – et se tromper de cible pour une migration ne se rattrape pas.
 */
function loadEnvFile(file) {
  if (process.env.DATABASE_URL) return;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    throw new Error(`Fichier d'environnement introuvable : ${file}`);
  }
  for (const line of content.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS announcements (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     title text NOT NULL,
     body text,
     href text,
     image text,
     kind text NOT NULL DEFAULT 'info',
     audience text NOT NULL DEFAULT 'everyone',
     status text NOT NULL DEFAULT 'draft',
     pinned boolean NOT NULL DEFAULT false,
     published_at timestamptz,
     expires_at timestamptz,
     push_sent_at timestamptz,
     email_sent_at timestamptz,
     push_delivered_count integer NOT NULL DEFAULT 0,
     email_delivered_count integer NOT NULL DEFAULT 0,
     created_by_id text REFERENCES users(id) ON DELETE SET NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements (status, published_at)`,
  `CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements (expires_at)`,

  `CREATE TABLE IF NOT EXISTS notification_reads (
     user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     notification_id text NOT NULL,
     read_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (user_id, notification_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads (user_id)`,

  `CREATE TABLE IF NOT EXISTS push_subscriptions (
     endpoint text PRIMARY KEY,
     p256dh text NOT NULL,
     auth text NOT NULL,
     user_id text REFERENCES users(id) ON DELETE SET NULL,
     locale text NOT NULL DEFAULT 'fr',
     user_agent text,
     created_at timestamptz NOT NULL DEFAULT now(),
     last_seen_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions (user_id)`,

  // Colonne additive sur une table existante : jamais de DROP, jamais de
  // reecriture. `IF NOT EXISTS` rend l'instruction rejouable.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS announcement_emails boolean NOT NULL DEFAULT true`,

  // Changelog editorial : les entrees vivaient en dur dans le code.
  `CREATE TABLE IF NOT EXISTS changelog_entries (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     version text NOT NULL UNIQUE,
     date text NOT NULL,
     type text NOT NULL DEFAULT 'feature',
     translations jsonb NOT NULL,
     hidden boolean NOT NULL DEFAULT false,
     created_by_id text REFERENCES users(id) ON DELETE SET NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_changelog_order ON changelog_entries (date, version)`,
  `CREATE INDEX IF NOT EXISTS idx_changelog_hidden ON changelog_entries (hidden)`,
];

async function main() {
  const flagIndex = process.argv.indexOf("--env");
  loadEnvFile(flagIndex >= 0 ? process.argv[flagIndex + 1] : ".env.local");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant.");

  // On annonce la cible : une migration lancée sur la mauvaise base se voit ici.
  console.log(`Cible : ${url.replace(/:\/\/([^:]+):[^@]*@/, "://$1:***@")}\n`);

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    for (const sql of STATEMENTS) {
      await client.query(sql);
      console.log("  ok —", sql.split("\n")[0].trim());
    }
    console.log("\nTables de notifications à jour.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
