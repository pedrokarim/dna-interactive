import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/community-builds/validation";
import { getApiTranslator } from "@/lib/api-locale";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Signaler un itinéraire public (compte requis, une fois par itinéraire). */
export async function POST(request: Request, { params }: RouteContext) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  const rate = await checkRateLimit(`map:route:report:${user.id}`, 10, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: t("tooManyReports") },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: t("routeNotFound") }, { status: 404 });
  const [route] = await getDb()
    .select({ userId: schema.farmRoutes.userId, hidden: schema.farmRoutes.hidden, visibility: schema.farmRoutes.visibility })
    .from(schema.farmRoutes)
    .where(eq(schema.farmRoutes.id, id))
    .limit(1);
  if (!route || route.hidden || route.visibility !== "public")
    return NextResponse.json({ error: t("routeNotFound") }, { status: 404 });
  if (route.userId === user.id) return NextResponse.json({ error: t("cannotReportOwnRoute") }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t("invalidRequest") }, { status: 400 });
  }
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: t("invalidData") }, { status: 400 });

  // Un second signalement du même compte est ignoré sans erreur.
  await getDb()
    .insert(schema.farmRouteReports)
    .values({ routeId: id, reporterId: user.id, reason: parsed.data.reason })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}
