import { NextResponse } from "next/server";
import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getApiTranslator } from "@/lib/api-locale";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVoterKey } from "@/lib/community-builds/vote-identity";
import { getMapLocation } from "@/lib/map/world";
import { ROUTES_PER_USER_MAX, routeInputSchema } from "@/lib/map/validation";

export const dynamic = "force-dynamic";

const LIST_LIMIT = 60;

/**
 * Itinéraires d'une carte : les publics (non masqués par la modération) et
 * ceux, privés compris, du compte connecté. Triés par votes.
 */
export async function GET(request: Request) {
  const t = await getApiTranslator(request);
  const mapId = new URL(request.url).searchParams.get("mapId") ?? "";
  if (!getMapLocation(mapId)) return NextResponse.json({ error: t("invalidRequest") }, { status: 400 });

  const user = await getCurrentUser();
  const r = schema.farmRoutes;
  const visible = user
    ? or(and(eq(r.visibility, "public"), eq(r.hidden, false)), eq(r.userId, user.id))
    : and(eq(r.visibility, "public"), eq(r.hidden, false));

  const rows = await getDb()
    .select({
      id: r.id,
      mapId: r.mapId,
      title: r.title,
      description: r.description,
      points: r.points,
      typeIds: r.typeIds,
      visibility: r.visibility,
      voteCount: r.voteCount,
      userId: r.userId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      authorName: schema.users.name,
    })
    .from(r)
    .innerJoin(schema.users, eq(schema.users.id, r.userId))
    .where(and(eq(r.mapId, mapId), visible))
    .orderBy(desc(r.voteCount), desc(r.createdAt))
    .limit(LIST_LIMIT);

  // Votes du visiteur (clé IP, comme pour les builds).
  const voterKey = getVoterKey(request.headers);
  const ids = rows.map((row) => row.id);
  const voted = ids.length
    ? await getDb()
        .select({ routeId: schema.farmRouteIpVotes.routeId })
        .from(schema.farmRouteIpVotes)
        .where(and(inArray(schema.farmRouteIpVotes.routeId, ids), eq(schema.farmRouteIpVotes.voterKey, voterKey)))
    : [];
  const votedSet = new Set(voted.map((v) => v.routeId));

  return NextResponse.json({
    routes: rows.map(({ userId, ...row }) => ({
      ...row,
      isMine: user?.id === userId,
      votedByMe: votedSet.has(row.id),
    })),
  });
}

export async function POST(request: Request) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  const rate = await checkRateLimit(`map:route:create:${user.id}`, 12, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: t("tooManyPublications") },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t("invalidRequest") }, { status: 400 });
  }
  const parsed = routeInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: t("invalidData") }, { status: 400 });

  const [{ value: owned = 0 } = { value: 0 }] = await getDb()
    .select({ value: count() })
    .from(schema.farmRoutes)
    .where(eq(schema.farmRoutes.userId, user.id));
  if (owned >= ROUTES_PER_USER_MAX) return NextResponse.json({ error: t("routeLimitReached") }, { status: 409 });

  const [created] = await getDb()
    .insert(schema.farmRoutes)
    .values({ userId: user.id, ...parsed.data })
    .returning({ id: schema.farmRoutes.id });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
