import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createBuildSchema,
  validateBuildReferences,
} from "@/lib/community-builds/validation";

export const dynamic = "force-dynamic";

const MAX_BUILDS_PER_CHARACTER = 3;

function clampLimit(value: string | null): number {
  const parsed = Number(value ?? 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.trunc(parsed), 1), 50);
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const url = new URL(request.url);
  const characterId = url.searchParams.get("characterId");
  const sort = url.searchParams.get("sort") === "recent" ? "recent" : "top";
  const limit = clampLimit(url.searchParams.get("limit"));
  const user = await getCurrentUser();

  const filters = [eq(schema.builds.hidden, false)];
  if (characterId) filters.push(eq(schema.builds.characterId, characterId));

  const rows = await db
    .select({
      id: schema.builds.id,
      userId: schema.builds.userId,
      characterId: schema.builds.characterId,
      element: schema.builds.element,
      title: schema.builds.title,
      note: schema.builds.note,
      payload: schema.builds.payload,
      voteCount: schema.builds.voteCount,
      createdAt: schema.builds.createdAt,
      updatedAt: schema.builds.updatedAt,
      authorName: schema.users.name,
      authorImage: schema.users.image,
      authorDiscordId: schema.users.discordId,
    })
    .from(schema.builds)
    .innerJoin(schema.users, eq(schema.users.id, schema.builds.userId))
    .where(and(...filters))
    .orderBy(
      ...(sort === "recent"
        ? [desc(schema.builds.updatedAt)]
        : [desc(schema.builds.voteCount), desc(schema.builds.updatedAt)]),
    )
    .limit(limit);

  let votedIds = new Set<string>();
  if (user && rows.length > 0) {
    const votes = await db
      .select({ buildId: schema.buildVotes.buildId })
      .from(schema.buildVotes)
      .where(
        and(
          eq(schema.buildVotes.userId, user.id),
          inArray(
            schema.buildVotes.buildId,
            rows.map((row) => row.id),
          ),
        ),
      );
    votedIds = new Set(votes.map((vote) => vote.buildId));
  }

  return NextResponse.json({
    builds: rows.map((row) => ({
      ...row,
      votedByMe: votedIds.has(row.id),
      editableByMe: user?.id === row.userId || user?.role === "admin",
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createBuildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Build invalide." }, { status: 400 });
  }

  const referenceErrors = validateBuildReferences(parsed.data);
  if (referenceErrors.length > 0) {
    return NextResponse.json({ error: referenceErrors[0], details: referenceErrors }, { status: 400 });
  }

  const db = getDb();
  const [quota] = await db
    .select({ value: count() })
    .from(schema.builds)
    .where(and(eq(schema.builds.userId, user.id), eq(schema.builds.characterId, parsed.data.characterId)));

  if ((quota?.value ?? 0) >= MAX_BUILDS_PER_CHARACTER) {
    return NextResponse.json(
      { error: "Limite atteinte : 3 builds publiés maximum par personnage." },
      { status: 409 },
    );
  }

  const now = new Date();
  const [created] = await db
    .insert(schema.builds)
    .values({
      userId: user.id,
      characterId: parsed.data.characterId,
      element: parsed.data.element ?? null,
      title: parsed.data.title,
      note: parsed.data.note ?? null,
      payload: parsed.data.payload,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ build: created }, { status: 201 });
}
