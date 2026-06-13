import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Client Drizzle sur Neon (driver HTTP — idéal pour les route handlers
 * serverless de Vercel : une requête HTTP par query, pas de pool à gérer).
 *
 * Lazy : on ne lit `DATABASE_URL` qu'au premier appel, pour ne pas faire
 * planter le build des pages qui n'utilisent pas la base.
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL manquant — base Neon non configurée.");
  }
  _db = drizzle(neon(url), { schema });
  return _db;
}

export { schema };
