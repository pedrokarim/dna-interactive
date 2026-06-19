import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isMissingTableError } from "@/lib/db-errors";
import {
  updateBuildSchema,
  validateBuildReferences,
} from "@/lib/community-builds/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function getEditableBuild(id: string) {
  const db = getDb();
  const [build] = await db.select().from(schema.builds).where(eq(schema.builds.id, id)).limit(1);
  return build ?? null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  const { id } = await params;
  const db = getDb();

  try {
    const [row] = await db
      .select({
        id: schema.builds.id,
        userId: schema.builds.userId,
        characterId: schema.builds.characterId,
        element: schema.builds.element,
        title: schema.builds.title,
        note: schema.builds.note,
        payload: schema.builds.payload,
        voteCount: schema.builds.voteCount,
        hidden: schema.builds.hidden,
        createdAt: schema.builds.createdAt,
        updatedAt: schema.builds.updatedAt,
        authorName: schema.users.name,
        authorImage: schema.users.image,
        authorDiscordId: schema.users.discordId,
      })
      .from(schema.builds)
      .innerJoin(schema.users, eq(schema.users.id, schema.builds.userId))
      .where(eq(schema.builds.id, id))
      .limit(1);

    if (!row) return NextResponse.json({ error: "Build introuvable." }, { status: 404 });

    const editableByMe = user?.id === row.userId || user?.role === "admin";
    if (row.hidden && !editableByMe) {
      return NextResponse.json({ error: "Build introuvable." }, { status: 404 });
    }

    let votedByMe = false;
    if (user) {
      const [vote] = await db
        .select({ buildId: schema.buildVotes.buildId })
        .from(schema.buildVotes)
        .where(and(eq(schema.buildVotes.buildId, id), eq(schema.buildVotes.userId, user.id)))
        .limit(1);
      votedByMe = Boolean(vote);
    }

    return NextResponse.json({
      build: {
        id: row.id,
        userId: row.userId,
        characterId: row.characterId,
        element: row.element,
        title: row.title,
        note: row.note,
        payload: row.payload,
        voteCount: row.voteCount,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        authorName: row.authorName,
        authorImage: row.authorImage,
        authorDiscordId: row.authorDiscordId,
        votedByMe,
        editableByMe,
      },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return NextResponse.json({ error: "Build introuvable." }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { id } = await params;
  const build = await getEditableBuild(id);
  if (!build) return NextResponse.json({ error: "Build introuvable." }, { status: 404 });
  if (build.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Action interdite." }, { status: 403 });
  }

  const parsed = updateBuildSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Build invalide." }, { status: 400 });
  }

  if (parsed.data.payload) {
    const referenceErrors = validateBuildReferences({
      characterId: build.characterId,
      element: build.element,
      title: parsed.data.title ?? build.title,
      note: parsed.data.note ?? build.note,
      payload: parsed.data.payload,
    });
    if (referenceErrors.length > 0) {
      return NextResponse.json({ error: referenceErrors[0], details: referenceErrors }, { status: 400 });
    }
  }

  const [updated] = await getDb()
    .update(schema.builds)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note ?? null } : {}),
      ...(parsed.data.payload !== undefined ? { payload: parsed.data.payload } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.builds.id, id))
    .returning();

  return NextResponse.json({ build: updated });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { id } = await params;
  const build = await getEditableBuild(id);
  if (!build) return NextResponse.json({ error: "Build introuvable." }, { status: 404 });
  if (build.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Action interdite." }, { status: 403 });
  }

  await getDb().delete(schema.builds).where(and(eq(schema.builds.id, id)));
  return NextResponse.json({ ok: true });
}
