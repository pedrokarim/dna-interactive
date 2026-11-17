import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { EMPTY_CONTRIBUTIONS, levelProgress, xpFromContributions, type Contributions, type LevelProgress } from "./index";

export type UserProgress = LevelProgress & { contributions: Contributions };

/** XP et niveau d'un utilisateur, calculés sur ses contributions. Tables absentes : niveau 0. */
export async function getUserProgress(userId: string): Promise<UserProgress> {
  const db = getDb();
  try {
    const builds = await db
      .select({ voteCount: schema.builds.voteCount, views: schema.builds.views })
      .from(schema.builds)
      .where(eq(schema.builds.userId, userId));

    // Les votes sont anonymes (par IP), on ne peut plus les rattacher à un
    // compte : votesGiven reste à 0. likesReceived vient du compteur builds.voteCount.
    const contributions: Contributions = {
      buildsPublished: builds.length,
      likesReceived: builds.reduce((sum, b) => sum + (b.voteCount ?? 0), 0),
      votesGiven: 0,
      buildViews: builds.map((b) => b.views ?? 0),
    };

    return { ...levelProgress(xpFromContributions(contributions)), contributions };
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return { ...levelProgress(0), contributions: EMPTY_CONTRIBUTIONS };
  }
}
