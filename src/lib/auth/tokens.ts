import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/db";

export type AuthTokenKind = "verify_email" | "reset_password";

const TTL_MS: Record<AuthTokenKind, number> = {
  verify_email: 24 * 60 * 60 * 1000, // 24 h
  reset_password: 60 * 60 * 1000, //  1 h
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Crée un token à usage unique et renvoie sa valeur en clair, pour le lien de
 * l'email. On ne stocke que le hash. Les anciens tokens du même (user, kind)
 * sont supprimés : un seul lien actif à la fois.
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
 * Valide et consomme un token : renvoie le userId s'il existe et n'a pas
 * expiré, sinon null. Un token valide est supprimé tout de suite, il ne sert
 * qu'une fois. Un token expiré reste en base.
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
