import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isMissingTableError } from "@/lib/db-errors";
import { checkRateLimit } from "@/lib/rate-limit";
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

function clampPage(value: string | null): number {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(Math.trunc(parsed), 1);
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const url = new URL(request.url);
  const characterId = url.searchParams.get("characterId");
  const element = url.searchParams.get("element");
  const sort = url.searchParams.get("sort") === "recent" ? "recent" : "top";
  const pageSize = clampLimit(url.searchParams.get("pageSize") ?? url.searchParams.get("limit"));
  const requestedPage = clampPage(url.searchParams.get("page"));
  const user = await getCurrentUser();

  const filters = [eq(schema.builds.hidden, false)];
  if (characterId) filters.push(eq(schema.builds.characterId, characterId));
  if (element) {
    const elementFilter = or(isNull(schema.builds.element), eq(schema.builds.element, element));
    if (elementFilter) filters.push(elementFilter);
  }

  try {
    const [{ value: total = 0 } = { value: 0 }] = await db
      .select({ value: count() })
      .from(schema.builds)
      .where(and(...filters));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);

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
      .limit(pageSize)
      .offset((page - 1) * pageSize);

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
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;

    return NextResponse.json({
      builds: [],
      pagination: {
        page: 1,
        pageSize,
        total: 0,
        totalPages: 1,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }
  const rate = checkRateLimit(`build:create:${user.id}`, 6, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de publications. Réessaie plus tard." },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
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
  // Insertion atomique : la limite de 3 builds/perso est appliquée DANS la
  // requête (INSERT ... SELECT ... WHERE count < 3), pour éviter la course
  // entre un COUNT et un INSERT séparés — neon-http n'a pas de transaction
  // interactive. 0 ligne renvoyée ⇒ quota atteint.
  const result = await db.execute(sql`
    INSERT INTO ${schema.builds} (user_id, character_id, element, title, note, payload)
    SELECT ${user.id}, ${parsed.data.characterId}, ${parsed.data.element ?? null},
           ${parsed.data.title}, ${parsed.data.note ?? null}, ${JSON.stringify(parsed.data.payload)}::jsonb
    WHERE (
      SELECT count(*) FROM ${schema.builds}
      WHERE user_id = ${user.id} AND character_id = ${parsed.data.characterId}
    ) < ${MAX_BUILDS_PER_CHARACTER}
    RETURNING
      id,
      user_id AS "userId",
      character_id AS "characterId",
      element, title, note, payload,
      vote_count AS "voteCount",
      hidden,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `);

  const createdRows = result.rows as Array<Record<string, unknown>>;
  if (createdRows.length === 0) {
    return NextResponse.json(
      { error: "Limite atteinte : 3 builds publiés maximum par personnage." },
      { status: 409 },
    );
  }

  return NextResponse.json({ build: createdRows[0] }, { status: 201 });
}
