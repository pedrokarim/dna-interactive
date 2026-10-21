import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Client Drizzle sur Postgres via le driver node-postgres (`pg`).
 *
 * La base est un serveur Postgres partagé (hôte défini par `DATABASE_URL`)
 * exposé derrière pgbouncer en transaction pooling. Un seul `Pool` par
 * processus Node, qui sert toutes les requêtes ; pgbouncer assure le vrai
 * pooling côté serveur (12 connexions par pool, 18 au plus vers Postgres).
 * Taille réglable par `DB_POOL_MAX` (10 en production sur ascencia-prod).
 *
 * Lazy : on ne lit `DATABASE_URL` qu'au premier appel, pour ne pas faire
 * planter le build des pages qui n'utilisent pas la base.
 *
 * Connexions inactives : le pgbouncer de DNA coupe un client resté inactif
 * plus de 120 s (`client_idle_timeout`) ; le pool ferme les siennes avant, à
 * 10 s. Si une connexion meurt quand même côté serveur, le pool émet une
 * erreur : sans écouteur, elle arrêterait tout le processus (exit 129). Le
 * pool écarte déjà le client mort, il suffit de ne pas laisser l'erreur sans
 * réponse.
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
    // pgbouncer gère le pooling réel ; le pool applicatif reste petit.
    max: Number(process.env.DB_POOL_MAX) || 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", (error) => {
    console.warn("[db] connexion inactive fermée côté serveur, écartée du pool :", error.message);
  });
  _db = drizzle(pool, { schema });
  return _db;
}

export { schema };
