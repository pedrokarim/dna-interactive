import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { cookies } from "next/headers";
import {
  COMMISSION_FILTER_COOKIE,
  parseCommissionFilter,
  parseCommissionFilterCookie,
  type CommissionFilter,
} from "./preferences";

/**
 * Filtre enregistré sur le compte, revalidé à la lecture : une région ou une
 * catégorie retirée du site entre-temps fait retomber sur `null` (= tout).
 */
export async function getAccountCommissionFilter(userId: string): Promise<CommissionFilter | null> {
  const [row] = await getDb()
    .select({ commissionFilter: schema.userPreferences.commissionFilter })
    .from(schema.userPreferences)
    .where(eq(schema.userPreferences.userId, userId))
    .limit(1);
  return row?.commissionFilter ? parseCommissionFilter(row.commissionFilter) : null;
}

/** Enregistre le filtre du compte ; `null` efface le réglage (le cookie du navigateur reprend la main). */
export async function saveAccountCommissionFilter(userId: string, filter: CommissionFilter | null): Promise<void> {
  const now = new Date();
  await getDb()
    .insert(schema.userPreferences)
    .values({ userId, commissionFilter: filter, updatedAt: now })
    .onConflictDoUpdate({
      target: schema.userPreferences.userId,
      set: { commissionFilter: filter, updatedAt: now },
    });
}

/**
 * Filtre à appliquer au rendu de l'accueil : celui du compte s'il en a un,
 * sinon celui du cookie de ce navigateur, sinon `null` (= tout afficher).
 * Une base injoignable ne bloque pas l'accueil : on retombe sur le cookie.
 */
export async function resolveCommissionFilter(userId: string | null): Promise<CommissionFilter | null> {
  if (userId) {
    try {
      const fromAccount = await getAccountCommissionFilter(userId);
      if (fromAccount) return fromAccount;
    } catch (err) {
      console.error("[commissions] lecture du filtre du compte impossible:", err);
    }
  }
  const cookieStore = await cookies();
  return parseCommissionFilterCookie(cookieStore.get(COMMISSION_FILTER_COOKIE)?.value);
}
