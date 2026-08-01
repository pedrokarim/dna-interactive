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
 * Squelette complet : toutes les régions × catégories présentes, objectifs vides.
 * Les lecteurs indexent `regions[region]` sans garde ; construire l'objet à
 * partir des seules lignes en base laissait des trous que le typage niait.
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
 * Le collecteur écrit le snapshot PUIS ses 45 entrées, hors transaction : au top
 * de l'heure il existe une fenêtre de quelques secondes où la ligne existe sans
 * ses objectifs. On ne retient donc que les snapshots ayant au moins une entrée,
 * ce qui sert la rotation précédente — encore exacte — au lieu d'une grille vide.
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

  // Filet : le snapshot retenu ci-dessus avait des entrées, mais les deux
  // requêtes ne partagent pas de transaction.
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
