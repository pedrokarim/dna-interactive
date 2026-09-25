import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVoterKey } from "@/lib/community-builds/vote-identity";
import { getApiTranslator } from "@/lib/api-locale";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function voteCount(id: string) {
  const [row] = await getDb()
    .select({ voteCount: schema.farmRoutes.voteCount })
    .from(schema.farmRoutes)
    .where(eq(schema.farmRoutes.id, id))
    .limit(1);
  return row?.voteCount ?? 0;
}

/**
 * Vote anonyme sur un itinéraire public, même mécanique que les builds :
 * identité = clé dérivée de l'IP sur une fenêtre de 24 h (voir vote-identity.ts).
 */
async function handle(request: Request, { params }: RouteContext, add: boolean) {
  const t = await getApiTranslator(request);
  const voterKey = getVoterKey(request.headers);
  const rate = await checkRateLimit(`map:route:vote:${voterKey}`, 90, 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: t("tooManyVotes") },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: t("routeNotFound") }, { status: 404 });
  const [route] = await getDb()
    .select({ visibility: schema.farmRoutes.visibility, hidden: schema.farmRoutes.hidden })
    .from(schema.farmRoutes)
    .where(eq(schema.farmRoutes.id, id))
    .limit(1);
  if (!route || route.hidden || route.visibility !== "public")
    return NextResponse.json({ error: t("routeNotFound") }, { status: 404 });

  const v = schema.farmRouteIpVotes;
  if (add) {
    const inserted = await getDb().insert(v).values({ routeId: id, voterKey }).onConflictDoNothing().returning({ id: v.routeId });
    if (inserted.length)
      await getDb()
        .update(schema.farmRoutes)
        .set({ voteCount: sql`${schema.farmRoutes.voteCount} + 1` })
        .where(eq(schema.farmRoutes.id, id));
  } else {
    const deleted = await getDb()
      .delete(v)
      .where(and(eq(v.routeId, id), eq(v.voterKey, voterKey)))
      .returning({ id: v.routeId });
    if (deleted.length)
      await getDb()
        .update(schema.farmRoutes)
        .set({ voteCount: sql`GREATEST(${schema.farmRoutes.voteCount} - 1, 0)` })
        .where(eq(schema.farmRoutes.id, id));
  }

  return NextResponse.json({ voted: add, voteCount: await voteCount(id) });
}

export const POST = (request: Request, ctx: RouteContext) => handle(request, ctx, true);
export const DELETE = (request: Request, ctx: RouteContext) => handle(request, ctx, false);
