import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Client Drizzle sur Postgres via le driver node-postgres (`pg`).
 *
 * La base est le serveur Postgres partagé (Kagura, `db.ascencia.re`) exposé
 * derrière pgbouncer en transaction pooling. On garde un seul `Pool` par
 * instance de fonction serverless (réutilisé entre les invocations chaudes) ;
 * pgbouncer assure le vrai pooling côté serveur, donc le pool applicatif
 * reste volontairement petit.
 *
 * Lazy : on ne lit `DATABASE_URL` qu'au premier appel, pour ne pas faire
 * planter le build des pages qui n'utilisent pas la base.
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL manquant — base Postgres non configurée.");
  }
  const pool = new Pool({
    connectionString: url,
    // pgbouncer gère le pooling réel ; côté lambda on reste minimal.
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  _db = drizzle(pool, { schema });
  return _db;
}

export { schema };
