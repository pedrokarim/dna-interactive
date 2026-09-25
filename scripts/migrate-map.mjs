/**
 * Tables de la carte interactive (progression par compte, itinéraires de farm
 * et leurs votes), en SQL ciblé et rejouable (`IF NOT EXISTS`).
 *
 * Même raison que `migrate-notifications.mjs` : `drizzle-kit push` est
 * inutilisable sur ces bases. Le fichier d'environnement est OBLIGATOIRE : pas
 * de cible par défaut, pour ne jamais migrer la base partagée par mégarde.
 *
 *   node scripts/migrate-map.mjs --env .env.development.local   (base Docker locale)
 *   node scripts/migrate-map.mjs --env .env.local               (base partagée)
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
  `CREATE TABLE IF NOT EXISTS map_progress (
     user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     found_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
     personal_markers jsonb NOT NULL DEFAULT '[]'::jsonb,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS farm_routes (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     map_id text NOT NULL,
     title text NOT NULL,
     description text,
     points jsonb NOT NULL,
     type_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
     visibility text NOT NULL DEFAULT 'public',
     vote_count integer NOT NULL DEFAULT 0,
     hidden boolean NOT NULL DEFAULT false,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_farm_routes_map ON farm_routes (map_id, visibility, hidden)`,
  `CREATE INDEX IF NOT EXISTS idx_farm_routes_user ON farm_routes (user_id)`,
  `CREATE TABLE IF NOT EXISTS farm_route_ip_votes (
     route_id uuid NOT NULL REFERENCES farm_routes(id) ON DELETE CASCADE,
     voter_key text NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (route_id, voter_key)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_farm_route_votes_route ON farm_route_ip_votes (route_id)`,
  `CREATE TABLE IF NOT EXISTS farm_route_reports (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     route_id uuid NOT NULL REFERENCES farm_routes(id) ON DELETE CASCADE,
     reporter_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     reason text NOT NULL,
     status text NOT NULL DEFAULT 'open',
     created_at timestamptz NOT NULL DEFAULT now(),
     resolved_at timestamptz,
     resolved_by_id text REFERENCES users(id) ON DELETE SET NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_farm_route_reports_route ON farm_route_reports (route_id)`,
  `CREATE INDEX IF NOT EXISTS idx_farm_route_reports_status ON farm_route_reports (status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uidx_farm_route_reports_reporter ON farm_route_reports (route_id, reporter_id)`,
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
    console.log("\nTables de la carte à jour.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
