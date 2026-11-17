import { desc, eq, exists } from "drizzle-orm";
import { getDb } from "@/db";
import { commissionEntries, commissionSnapshots } from "@/db/schema";
import { computeRotationMeta } from "./meta";
import {
  CATEGORIES,
  REGIONS,
  type Category,
  type Region,
  type RotationMeta,
  type RotationState,
} from "./types";

/**
 * Squelette complet : toutes les régions × catégories, objectifs vides. Les
 * lecteurs indexent `regions[region]` sans garde, et un objet construit à partir
 * des seules lignes en base avait des trous que le typage ne voyait pas.
 */
export function emptyRegions(): RotationState["regions"] {
  const regions = {} as RotationState["regions"];
  for (const region of REGIONS) {
    regions[region] = {} as Record<Category, string[]>;
    for (const category of CATEGORIES) regions[region][category] = [];
  }
  return regions;
}

/**
 * Rotation la plus récemment observée, reconstruite en `RotationState`.
 *
 * Le collecteur écrit le snapshot puis ses 45 entrées, hors transaction : à chaque
 * heure pile, pendant quelques secondes, la ligne existe sans ses objectifs. On ne
 * garde que les snapshots qui ont au moins une entrée, ce qui sert la rotation
 * précédente (encore juste) au lieu d'une grille vide.
 */
export async function getLatestRotation(): Promise<RotationState | null> {
  const db = getDb();
  const [snapshot] = await db
    .select()
    .from(commissionSnapshots)
    .where(
      exists(
        db
          .select({ one: commissionEntries.snapshotId })
          .from(commissionEntries)
          .where(eq(commissionEntries.snapshotId, commissionSnapshots.id)),
      ),
    )
    .orderBy(desc(commissionSnapshots.lastSeenAt))
    .limit(1);

  if (!snapshot) return null;

  const entries = await db
    .select()
    .from(commissionEntries)
    .where(eq(commissionEntries.snapshotId, snapshot.id));

  // Par sécurité : le snapshot avait des entrées, mais les deux requêtes ne sont
  // pas dans la même transaction.
  if (entries.length === 0) return null;

  const regions = emptyRegions();
  for (const e of entries) {
    const region = e.region as Region;
    const category = e.category as Category;
    if (!regions[region]?.[category]) continue; // région/catégorie inconnue en base
    regions[region][category][e.slot - 1] = e.objective;
  }

  return {
    contentHash: snapshot.contentHash,
    updatedAt: snapshot.startedAt.toISOString(),
    regions,
  };
}

export function getRotationMeta(state: RotationState | null): RotationMeta {
  return computeRotationMeta(state?.updatedAt ?? null);
}
