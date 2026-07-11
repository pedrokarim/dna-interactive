import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { DEFAULT_SETTINGS, mergeSettings, type AppSettings } from "./index";

const KEY = "config";

/** Réglages courants (fusionnés sur les défauts). Sûr si table absente → défauts. */
export async function getAppSettings(): Promise<AppSettings> {
  const db = getDb();
  try {
    const [row] = await db
      .select({ value: schema.appSettings.value })
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, KEY))
      .limit(1);
    return mergeSettings(row?.value as Partial<AppSettings> | undefined);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return DEFAULT_SETTINGS;
  }
}

/** Écrit l'objet complet de réglages (upsert sur la ligne unique). */
export async function setAppSettings(next: AppSettings): Promise<void> {
  const db = getDb();
  await db
    .insert(schema.appSettings)
    .values({ key: KEY, value: next, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value: next, updatedAt: new Date() } });
}
