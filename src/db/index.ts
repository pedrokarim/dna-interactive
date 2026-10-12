import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Client Drizzle sur Postgres via le driver node-postgres (`pg`).
 *
 * La base est un serveur Postgres partagé (hôte défini par `DATABASE_URL`)
 * exposé derrière pgbouncer en transaction pooling. On garde un seul `Pool` par
 * instance de fonction serverless (réutilisé entre les invocations chaudes) ;
 * pgbouncer assure le vrai pooling côté serveur, donc le pool applicatif
 * reste volontairement petit.
 *
 * Lazy : on ne lit `DATABASE_URL` qu'au premier appel, pour ne pas faire
 * planter le build des pages qui n'utilisent pas la base.
 *
 * Connexions inactives : le pgbouncer de DNA coupe un client resté inactif
 * plus de 120 s (`client_idle_timeout`). Entre deux requêtes, Vercel met
 * l'instance en pause, et le minuteur `idleTimeoutMillis` ne tourne pas : au
 * réveil, la connexion est déjà morte et le pool émet une erreur. Sans
 * écouteur, cette erreur arrêtait tout le processus (exit 129).
 *  - `attachDatabasePool` garde l'instance éveillée le temps que le pool ferme
 *    lui-même ses connexions inactives, avant la pause ;
 *  - l'écouteur `error` reste le filet de sécurité : le pool écarte déjà le
 *    client mort, il suffit de ne pas laisser l'erreur sans réponse.
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
  pool.on("error", (error) => {
    console.warn("[db] connexion inactive fermée côté serveur, écartée du pool :", error.message);
  });
  attachDatabasePool(pool);
  _db = drizzle(pool, { schema });
  return _db;
}

export { schema };
