/**
 * Table du planificateur de farm (un plan par compte), en SQL ciblé et
 * rejouable (`IF NOT EXISTS`).
 *
 * Même raison que `migrate-notifications.mjs` : `drizzle-kit push` est
 * inutilisable sur ces bases. Le fichier d'environnement est OBLIGATOIRE : pas
 * de cible par défaut, pour ne jamais migrer la base partagée par mégarde.
 *
 *   node scripts/migrate-planner.mjs --env .env.development.local   (base Docker locale)
 *   node scripts/migrate-planner.mjs --env .env.local               (base partagée)
 */
import { readFileSync } from "node:fs";
import pg from "pg";

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
  `CREATE TABLE IF NOT EXISTS farm_plans (
     user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     goals jsonb NOT NULL DEFAULT '[]'::jsonb,
     inventory jsonb NOT NULL DEFAULT '{}'::jsonb,
     craft_choices jsonb NOT NULL DEFAULT '{}'::jsonb,
     schema_version integer NOT NULL DEFAULT 1,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
];

async function main() {
  const flagIndex = process.argv.indexOf("--env");
  if (flagIndex < 0 || !process.argv[flagIndex + 1]) {
    throw new Error("Préciser la base : --env .env.development.local (locale) ou --env .env.local (partagée).");
  }
  loadEnvFile(process.argv[flagIndex + 1]);
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant.");

  console.log(`Cible : ${url.replace(/:\/\/([^:]+):[^@]*@/, "://$1:***@")}\n`);

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    for (const sql of STATEMENTS) {
      await client.query(sql);
      console.log("  ok —", sql.split("\n")[0].trim());
    }
    console.log("\nTable du planificateur à jour.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
