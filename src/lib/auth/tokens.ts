import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/db";

export type AuthTokenKind = "verify_email" | "reset_password";

// Durée de vie par type de token.
const TTL_MS: Record<AuthTokenKind, number> = {
  verify_email: 24 * 60 * 60 * 1000, // 24 h
  reset_password: 60 * 60 * 1000, //  1 h
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Crée un token à usage unique et renvoie sa valeur EN CLAIR (à mettre dans le
 * lien email). Seul le hash est persisté. On invalide les anciens tokens du
 * même (user, kind) pour qu'un seul lien soit actif à la fois.
 */
export async function createAuthToken(userId: string, kind: AuthTokenKind): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  const db = getDb();
  await db
    .delete(schema.authTokens)
    .where(and(eq(schema.authTokens.userId, userId), eq(schema.authTokens.kind, kind)));
  await db.insert(schema.authTokens).values({
    userId,
    kind,
    tokenHash: hashToken(raw),
    expires: new Date(Date.now() + TTL_MS[kind]),
  });
  return raw;
}

/**
 * Valide et CONSOMME un token (usage unique) : renvoie le userId si valide et
 * non expiré, sinon null. Le token est supprimé qu'il soit valide ou non
 * réutilisable ensuite.
 */
export async function consumeAuthToken(raw: string, kind: AuthTokenKind): Promise<string | null> {
  if (!raw) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.authTokens)
    .where(
      and(
        eq(schema.authTokens.tokenHash, hashToken(raw)),
        eq(schema.authTokens.kind, kind),
        gt(schema.authTokens.expires, new Date()),
      ),
    )
    .limit(1);
  if (!row) return null;
  await db.delete(schema.authTokens).where(eq(schema.authTokens.id, row.id));
  return row.userId;
}
