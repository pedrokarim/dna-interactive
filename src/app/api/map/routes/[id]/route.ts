import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getApiTranslator } from "@/lib/api-locale";
import { routeInputSchema } from "@/lib/map/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadOwned(request: Request, params: RouteContext["params"]) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: t("signInRequired") }, { status: 401 }) };
  const { id } = await params;
  if (!UUID.test(id)) return { error: NextResponse.json({ error: t("routeNotFound") }, { status: 404 }) };

  const [route] = await getDb()
    .select({ id: schema.farmRoutes.id, userId: schema.farmRoutes.userId, mapId: schema.farmRoutes.mapId })
    .from(schema.farmRoutes)
    .where(eq(schema.farmRoutes.id, id))
    .limit(1);
  if (!route) return { error: NextResponse.json({ error: t("routeNotFound") }, { status: 404 }) };
  return { t, user, route };
}

/** Modifier son itinéraire (la carte ne change pas : on en trace un autre). */
export async function PATCH(request: Request, { params }: RouteContext) {
  const loaded = await loadOwned(request, params);
  if ("error" in loaded) return loaded.error;
  const { t, user, route } = loaded;
  if (route.userId !== user.id) return NextResponse.json({ error: t("actionForbidden") }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t("invalidRequest") }, { status: 400 });
  }
  const parsed = routeInputSchema.safeParse({ ...(body as object), mapId: route.mapId });
  if (!parsed.success) return NextResponse.json({ error: t("invalidData") }, { status: 400 });

  const { mapId: _mapId, ...changes } = parsed.data;
  void _mapId;
  await getDb()
    .update(schema.farmRoutes)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(schema.farmRoutes.id, route.id));
  return NextResponse.json({ ok: true });
}

/** Supprimer : l'auteur, ou un administrateur (modération). */
export async function DELETE(request: Request, { params }: RouteContext) {
  const loaded = await loadOwned(request, params);
  if ("error" in loaded) return loaded.error;
  const { t, user, route } = loaded;
  if (route.userId !== user.id && user.role !== "admin")
    return NextResponse.json({ error: t("actionForbidden") }, { status: 403 });

  await getDb().delete(schema.farmRoutes).where(eq(schema.farmRoutes.id, route.id));
  return NextResponse.json({ ok: true });
}
