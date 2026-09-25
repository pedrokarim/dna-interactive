import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isMissingTableError } from "@/lib/db-errors";
import { recordAdminAction } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

/** Modération des itinéraires de farm : liste, signalements, masquage, suppression. */

const patchSchema = z.object({
  routeId: z.string().uuid().optional(),
  hidden: z.boolean().optional(),
  deleteRoute: z.boolean().optional(),
  reportId: z.string().uuid().optional(),
  reportStatus: z.enum(["resolved", "dismissed"]).optional(),
});

const PAGE_SIZE = 25;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ error: "Admin requis." }, { status: 403 }) };
  return { user };
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const page = Math.max(1, Math.trunc(Number(new URL(request.url).searchParams.get("page") ?? 1)) || 1);
  const db = getDb();
  const r = schema.farmRoutes;

  try {
    const [{ value: total = 0 } = { value: 0 }] = await db.select({ value: count() }).from(r);
    // Nombre de signalements ouverts par itinéraire, pour trier les suspects en tête.
    const openReports = sql<number>`(select count(*)::int from farm_route_reports fr where fr.route_id = ${r.id} and fr.status = 'open')`;
    const routes = await db
      .select({
        id: r.id,
        mapId: r.mapId,
        title: r.title,
        description: r.description,
        visibility: r.visibility,
        hidden: r.hidden,
        voteCount: r.voteCount,
        pointCount: sql<number>`jsonb_array_length(${r.points})`,
        createdAt: r.createdAt,
        authorName: schema.users.name,
        authorId: schema.users.id,
        openReports,
      })
      .from(r)
      .innerJoin(schema.users, eq(schema.users.id, r.userId))
      .orderBy(desc(openReports), desc(r.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    const reports = await db
      .select({
        id: schema.farmRouteReports.id,
        routeId: schema.farmRouteReports.routeId,
        reason: schema.farmRouteReports.reason,
        status: schema.farmRouteReports.status,
        createdAt: schema.farmRouteReports.createdAt,
        routeTitle: r.title,
        reporterName: schema.users.name,
      })
      .from(schema.farmRouteReports)
      .innerJoin(r, eq(r.id, schema.farmRouteReports.routeId))
      .innerJoin(schema.users, eq(schema.users.id, schema.farmRouteReports.reporterId))
      .where(eq(schema.farmRouteReports.status, "open"))
      .orderBy(desc(schema.farmRouteReports.createdAt))
      .limit(50);

    return NextResponse.json({
      routes,
      reports,
      pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return NextResponse.json({ routes: [], reports: [], pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 } });
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { routeId, hidden, deleteRoute, reportId, reportStatus } = parsed.data;
  const db = getDb();

  if (routeId && deleteRoute) {
    await db.delete(schema.farmRoutes).where(eq(schema.farmRoutes.id, routeId));
    await recordAdminAction({ adminId: guard.user.id, action: "delete_farm_route", targetType: "farm_route", targetId: routeId });
  } else if (routeId && hidden !== undefined) {
    await db.update(schema.farmRoutes).set({ hidden, updatedAt: new Date() }).where(eq(schema.farmRoutes.id, routeId));
    await recordAdminAction({
      adminId: guard.user.id,
      action: hidden ? "hide_farm_route" : "unhide_farm_route",
      targetType: "farm_route",
      targetId: routeId,
    });
  }

  if (reportId && reportStatus) {
    await db
      .update(schema.farmRouteReports)
      .set({ status: reportStatus, resolvedAt: new Date(), resolvedById: guard.user.id })
      .where(eq(schema.farmRouteReports.id, reportId));
    await recordAdminAction({ adminId: guard.user.id, action: `route_report_${reportStatus}`, targetType: "report", targetId: reportId });
  }

  return NextResponse.json({ ok: true });
}
