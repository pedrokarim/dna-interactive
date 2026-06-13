import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { commissionEntries, commissionSnapshots } from "@/db/schema";
import { computeRotationMeta } from "./meta";
import { type Category, type Region, type RotationMeta, type RotationState } from "./types";

/** Rotation la plus récemment observée, reconstruite en `RotationState`. */
export async function getLatestRotation(): Promise<RotationState | null> {
  const db = getDb();
  const [snapshot] = await db
    .select()
    .from(commissionSnapshots)
    .orderBy(desc(commissionSnapshots.lastSeenAt))
    .limit(1);

  if (!snapshot) return null;

  const entries = await db
    .select()
    .from(commissionEntries)
    .where(eq(commissionEntries.snapshotId, snapshot.id));

  const regions = {} as RotationState["regions"];
  for (const e of entries) {
    const region = e.region as Region;
    const category = e.category as Category;
    regions[region] = regions[region] ?? ({} as Record<Category, string[]>);
    regions[region][category] = regions[region][category] ?? [];
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
