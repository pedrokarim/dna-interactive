import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

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

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const rate = checkRateLimit(`build:vote:${user.id}`, 90, 60 * 1000);
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
    .insert(schema.buildVotes)
    .values({ buildId: id, userId: user.id })
    .onConflictDoNothing()
    .returning({ buildId: schema.buildVotes.buildId });

  if (inserted.length > 0) {
    await getDb()
      .update(schema.builds)
      .set({ voteCount: sql`${schema.builds.voteCount} + 1`, updatedAt: new Date() })
      .where(eq(schema.builds.id, id));
  }

  const [row] = await getDb()
    .select({ voteCount: schema.builds.voteCount })
    .from(schema.builds)
    .where(eq(schema.builds.id, id))
    .limit(1);

  return NextResponse.json({ voted: true, voteCount: row?.voteCount ?? 0 });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const rate = checkRateLimit(`build:vote:${user.id}`, 90, 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de votes. Réessaie plus tard." },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const { id } = await params;
  const deleted = await getDb()
    .delete(schema.buildVotes)
    .where(sql`${schema.buildVotes.buildId} = ${id} AND ${schema.buildVotes.userId} = ${user.id}`)
    .returning({ buildId: schema.buildVotes.buildId });

  if (deleted.length > 0) {
    await getDb()
      .update(schema.builds)
      .set({
        voteCount: sql`GREATEST(${schema.builds.voteCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(schema.builds.id, id));
  }

  const [row] = await getDb()
    .select({ voteCount: schema.builds.voteCount })
    .from(schema.builds)
    .where(eq(schema.builds.id, id))
    .limit(1);

  return NextResponse.json({ voted: false, voteCount: row?.voteCount ?? 0 });
}
