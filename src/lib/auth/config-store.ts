import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { decryptSecret, encryptSecret } from "./secret-crypto";

const AUTH_KEY = "auth";
const CONFIG_KEY = "config";

type StoredAuth = {
  discordId?: string;
  discordSecretEnc?: string;
  googleId?: string;
  googleSecretEnc?: string;
};

/** Overrides déchiffrés + toggle Google, pour le runtime NextAuth. */
export type AuthOverrides = {
  discordId?: string;
  discordSecret?: string;
  googleId?: string;
  googleSecret?: string;
  googleEnabled: boolean;
};

async function readAuthRow(): Promise<StoredAuth> {
  const [row] = await getDb()
    .select({ value: schema.appSettings.value })
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, AUTH_KEY))
    .limit(1);
  return (row?.value as StoredAuth | undefined) ?? {};
}

/** Lu au démarrage d'auth.ts. Sûr si table/row absents → aucun override (fallback env). */
export async function loadAuthOverrides(): Promise<AuthOverrides> {
  try {
    const db = getDb();
    const [authRow, cfgRow] = await Promise.all([
      db.select({ value: schema.appSettings.value }).from(schema.appSettings).where(eq(schema.appSettings.key, AUTH_KEY)).limit(1),
      db.select({ value: schema.appSettings.value }).from(schema.appSettings).where(eq(schema.appSettings.key, CONFIG_KEY)).limit(1),
    ]);
    const stored = (authRow[0]?.value as StoredAuth | undefined) ?? {};
    const googleEnabled = (cfgRow[0]?.value as { googleAuthEnabled?: boolean } | undefined)?.googleAuthEnabled !== false;
    return {
      discordId: stored.discordId || undefined,
      discordSecret: decryptSecret(stored.discordSecretEnc) || undefined,
      googleId: stored.googleId || undefined,
      googleSecret: decryptSecret(stored.googleSecretEnc) || undefined,
      googleEnabled,
    };
  } catch (error) {
    if (!isMissingTableError(error)) {
      // Ne jamais casser l'init auth : on log et on retombe sur l'env.
      console.error("loadAuthOverrides:", error);
    }
    return { googleEnabled: true };
  }
}

/** Vue admin : jamais de secret en clair — seulement les Client ID + présence des secrets. */
export async function getAuthConfigForAdmin(): Promise<{
  discordId: string;
  googleId: string;
  hasDiscordSecret: boolean;
  hasGoogleSecret: boolean;
  envDiscord: boolean;
  envGoogle: boolean;
}> {
  try {
    const stored = await readAuthRow();
    return {
      discordId: stored.discordId ?? "",
      googleId: stored.googleId ?? "",
      hasDiscordSecret: Boolean(stored.discordSecretEnc),
      hasGoogleSecret: Boolean(stored.googleSecretEnc),
      envDiscord: Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET),
      envGoogle: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    };
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return {
      discordId: "",
      googleId: "",
      hasDiscordSecret: false,
      hasGoogleSecret: false,
      envDiscord: Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET),
      envGoogle: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    };
  }
}

/**
 * Écrit les credentials. Client ID : `undefined` = inchangé, "" = effacé.
 * Secret : valeur non vide = (ré)écrit chiffré ; vide/undefined = inchangé.
 */
export async function setAuthConfig(input: {
  discordId?: string;
  discordSecret?: string;
  googleId?: string;
  googleSecret?: string;
}): Promise<void> {
  const db = getDb();
  const current = await readAuthRow();
  const next: StoredAuth = { ...current };

  if (input.discordId !== undefined) next.discordId = input.discordId.trim() || undefined;
  if (input.googleId !== undefined) next.googleId = input.googleId.trim() || undefined;
  if (input.discordSecret && input.discordSecret.trim()) next.discordSecretEnc = encryptSecret(input.discordSecret.trim());
  if (input.googleSecret && input.googleSecret.trim()) next.googleSecretEnc = encryptSecret(input.googleSecret.trim());

  await db
    .insert(schema.appSettings)
    .values({ key: AUTH_KEY, value: next, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value: next, updatedAt: new Date() } });
}
