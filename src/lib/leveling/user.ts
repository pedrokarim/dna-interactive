import "server-only";
import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { EMPTY_CONTRIBUTIONS, levelProgress, xpFromContributions, type Contributions, type LevelProgress } from "./index";

export type UserProgress = LevelProgress & { contributions: Contributions };

/** Progression (XP/niveau) d'un utilisateur, dérivée de ses contributions. Sûr si tables absentes. */
export async function getUserProgress(userId: string): Promise<UserProgress> {
  const db = getDb();
  try {
    const builds = await db
      .select({ voteCount: schema.builds.voteCount, views: schema.builds.views })
      .from(schema.builds)
      .where(eq(schema.builds.userId, userId));

    const [{ value: votesGiven = 0 } = { value: 0 }] = await db
      .select({ value: count() })
      .from(schema.buildVotes)
      .where(eq(schema.buildVotes.userId, userId));

    const contributions: Contributions = {
      buildsPublished: builds.length,
      likesReceived: builds.reduce((sum, b) => sum + (b.voteCount ?? 0), 0),
      votesGiven,
      buildViews: builds.map((b) => b.views ?? 0),
    };

    return { ...levelProgress(xpFromContributions(contributions)), contributions };
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return { ...levelProgress(0), contributions: EMPTY_CONTRIBUTIONS };
  }
}
