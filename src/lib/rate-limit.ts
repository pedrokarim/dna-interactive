import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

/** Un appel sur N purge les lignes expirées (voir `checkRateLimit`). */
const PURGE_ONE_IN = 200;

/**
 * Rate-limit à fenêtre fixe, partagé entre tous les processus via Postgres
 * (table `rate_limits`).
 *
 * Une `Map` en mémoire ne suffit pas : chaque instance aurait son compteur,
 * remis à zéro au redémarrage, et la vraie limite deviendrait `limit × N`.
 *
 * Un seul upsert atomique incrémente le compteur et remet la fenêtre à zéro si
 * elle a expiré : le résultat vaut pour toutes les instances.
 *
 * Si la base ne répond pas, on laisse passer : les endpoints protégés en
 * dépendent de toute façon, pas la peine d'ajouter un point de panne.
 *
 * Pas de cron sur ce projet : un appel sur `PURGE_ONE_IN` supprime au passage
 * les lignes expirées (index sur `reset_at`), sinon elles restent en base.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  try {
    const res = await getDb().execute(sql`
      INSERT INTO rate_limits (bucket_key, count, reset_at)
      VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
      ON CONFLICT (bucket_key) DO UPDATE SET
        count = CASE WHEN rate_limits.reset_at <= now() THEN 1
                     ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at <= now()
                        THEN now() + make_interval(secs => ${windowSeconds})
                        ELSE rate_limits.reset_at END
      RETURNING count, extract(epoch from (reset_at - now())) AS retry_after
    `);

    if (Math.random() < 1 / PURGE_ONE_IN) {
      // Si ça échoue, un appel suivant refera la purge.
      await getDb()
        .execute(sql`DELETE FROM rate_limits WHERE reset_at < now()`)
        .catch((err) => console.error("[rate-limit] purge échouée:", err));
    }

    const row = (res as unknown as {
      rows: Array<{ count: number | string; retry_after: number | string }>;
    }).rows[0];
    if (!row) return { ok: true };

    if (Number(row.count) > limit) {
      return { ok: false, retryAfter: Math.max(1, Math.ceil(Number(row.retry_after))) };
    }
    return { ok: true };
  } catch (err) {
    // Base injoignable : on laisse passer plutôt que bloquer l'app.
    console.error("[rate-limit] échec DB, requête autorisée par défaut:", err);
    return { ok: true };
  }
}
