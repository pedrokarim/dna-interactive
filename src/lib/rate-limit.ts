import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

/** Un appel sur N purge les lignes expirées (voir `checkRateLimit`). */
const PURGE_ONE_IN = 200;

/**
 * Rate-limit à fenêtre fixe, **partagé entre toutes les instances serverless**
 * via Postgres (table `rate_limits`).
 *
 * L'ancienne implémentation stockait les compteurs dans une `Map` en mémoire de
 * process : sur Vercel, chaque lambda avait son propre état (réparti sur N
 * instances, remis à zéro au cold-start) → la limite réelle était `limit × N`
 * et se réinitialisait seule. Toutes les protections anti-abus étaient donc
 * contournables.
 *
 * Ici, un **upsert atomique** (un seul aller-retour SQL) incrémente le compteur
 * et réinitialise la fenêtre si elle est expirée. Le résultat est autoritaire
 * quelle que soit l'instance qui traite la requête.
 *
 * Fail-open : si la base est indisponible, on autorise (les endpoints protégés
 * dépendent de toute façon de la base — inutile d'ajouter un point de panne).
 *
 * Purge : les lignes expirées ne servent plus à rien mais restaient en base
 * pour toujours. Aucun cron n'existe sur ce projet, donc un appel sur
 * `PURGE_ONE_IN` les supprime au passage (index sur `reset_at`).
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
      // Échec sans conséquence : la purge sera retentée par un appel suivant.
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
    // Fail-open : ne pas bloquer l'app si le rate-limiter n'est pas joignable.
    console.error("[rate-limit] échec DB, requête autorisée par défaut:", err);
    return { ok: true };
  }
}
