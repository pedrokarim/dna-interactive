/**
 * Table des rotations du théâtre immersif, en SQL ciblé et rejouable
 * (`IF NOT EXISTS`).
 *
 * Même raison que `migrate-map.mjs` : `drizzle-kit push` est inutilisable sur
 * ces bases. Le fichier d'environnement est OBLIGATOIRE : pas de cible par
 * défaut, pour ne jamais migrer la base partagée par mégarde.
 *
 *   node scripts/migrate-theatre.mjs --env .env.development.local   (base Docker locale)
 *   node scripts/migrate-theatre.mjs --env .env.local               (base partagée)
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
  `CREATE TABLE IF NOT EXISTS theatre_rotations (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     season_id integer,
     starts_at timestamptz NOT NULL,
     ends_at timestamptz NOT NULL,
     featured_kind text NOT NULL,
     featured_id text NOT NULL,
     note text,
     source_url text,
     hidden boolean NOT NULL DEFAULT false,
     created_by_id text REFERENCES users(id) ON DELETE SET NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uidx_theatre_rotations_season ON theatre_rotations (season_id)`,
  `CREATE INDEX IF NOT EXISTS idx_theatre_rotations_dates ON theatre_rotations (starts_at, ends_at)`,
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
    console.log("\nTable du théâtre à jour.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
