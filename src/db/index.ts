import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Client Drizzle sur Postgres avec node-postgres (`pg`).
 *
 * Serveur Postgres partagé (hôte dans `DATABASE_URL`) derrière pgbouncer en
 * transaction pooling. Un seul `Pool` par processus Node ; le vrai pooling se
 * fait dans pgbouncer (12 connexions par pool, 18 au plus vers Postgres).
 * Taille réglable par `DB_POOL_MAX` (10 en prod sur ascencia-prod).
 *
 * `DATABASE_URL` n'est lue qu'au premier appel, pour ne pas casser le build
 * des pages qui n'utilisent pas la base.
 *
 * pgbouncer coupe un client inactif depuis plus de 120 s
 * (`client_idle_timeout`) ; le pool ferme les siennes avant, à 10 s. Si une
 * connexion meurt quand même côté serveur, le pool émet une erreur qui, sans
 * écouteur, tue le processus (exit 129). Le pool écarte déjà le client mort,
 * il suffit d'écouter l'erreur.
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
    // pgbouncer fait le vrai pooling, le pool côté appli reste petit.
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
