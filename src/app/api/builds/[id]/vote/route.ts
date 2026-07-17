import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVoterKey } from "@/lib/community-builds/vote-identity";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function getPublicBuild(id: string) {
  const [build] = await getDb()
    .select({ id: schema.builds.id, hidden: schema.builds.hidden })
    .from(schema.builds)
    .where(eq(schema.builds.id, id))
    .limit(1);
  return build ?? null;
}

async function currentVoteCount(id: string) {
  const [row] = await getDb()
    .select({ voteCount: schema.builds.voteCount })
    .from(schema.builds)
    .where(eq(schema.builds.id, id))
    .limit(1);
  return row?.voteCount ?? 0;
}

// Vote anonyme : identité = clé dérivée de l'IP (cf. vote-identity.ts). Pas de
// connexion requise, pas de blocage self-vote (on ne connaît plus l'auteur côté vote).
export async function POST(request: Request, { params }: RouteContext) {
  const voterKey = getVoterKey(request.headers);
  const rate = await checkRateLimit(`build:vote:${voterKey}`, 90, 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de votes. Réessaie plus tard." },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const { id } = await params;
  const build = await getPublicBuild(id);
  if (!build || build.hidden) return NextResponse.json({ error: "Build introuvable." }, { status: 404 });

  const inserted = await getDb()
    .insert(schema.buildIpVotes)
    .values({ buildId: id, voterKey })
    .onConflictDoNothing()
    .returning({ buildId: schema.buildIpVotes.buildId });

  if (inserted.length > 0) {
    await getDb()
      .update(schema.builds)
      .set({ voteCount: sql`${schema.builds.voteCount} + 1`, updatedAt: new Date() })
      .where(eq(schema.builds.id, id));
  }

  return NextResponse.json({ voted: true, voteCount: await currentVoteCount(id) });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const voterKey = getVoterKey(request.headers);
  const rate = await checkRateLimit(`build:vote:${voterKey}`, 90, 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de votes. Réessaie plus tard." },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const { id } = await params;
  const deleted = await getDb()
    .delete(schema.buildIpVotes)
    .where(and(eq(schema.buildIpVotes.buildId, id), eq(schema.buildIpVotes.voterKey, voterKey)))
    .returning({ buildId: schema.buildIpVotes.buildId });

  if (deleted.length > 0) {
    await getDb()
      .update(schema.builds)
      .set({
        voteCount: sql`GREATEST(${schema.builds.voteCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(schema.builds.id, id));
  }

  return NextResponse.json({ voted: false, voteCount: await currentVoteCount(id) });
}
