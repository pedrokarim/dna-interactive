import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isMissingTableError } from "@/lib/db-errors";
import { recordAdminAction } from "@/lib/admin/audit";
import { sendReportFollowUp } from "@/lib/email/report-emails";
import { locales, type Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  buildId: z.string().uuid().optional(),
  hidden: z.boolean().optional(),
  deleteBuild: z.boolean().optional(),
  reportId: z.string().uuid().optional(),
  reportStatus: z.enum(["resolved", "dismissed"]).optional(),
  /** Présent = prévenir par mail la personne qui a signalé, dans cette langue. */
  notifyReporter: z.object({ locale: z.enum(locales) }).optional(),
});

type ReporterMail = "sent" | "skipped" | "no_email" | "failed";

/** Prévient le signaleur de la suite donnée. Un échec d'envoi n'annule pas la modération. */
async function notifyReporter(reportId: string, outcome: "resolved" | "dismissed", locale: Locale): Promise<ReporterMail> {
  const [row] = await getDb()
    .select({
      reporterId: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      buildTitle: schema.builds.title,
    })
    .from(schema.buildReports)
    .innerJoin(schema.users, eq(schema.users.id, schema.buildReports.reporterId))
    .innerJoin(schema.builds, eq(schema.builds.id, schema.buildReports.buildId))
    .where(eq(schema.buildReports.id, reportId))
    .limit(1);
  if (!row?.email) return "no_email";

  try {
    const { skipped } = await sendReportFollowUp({
      to: row.email,
      userId: row.reporterId,
      name: row.name,
      locale,
      outcome,
      buildTitles: [row.buildTitle],
    });
    return skipped ? "skipped" : "sent";
  } catch (error) {
    console.error("[admin/builds] mail de suivi de signalement non envoyé :", error);
    return "failed";
  }
}

function clampPage(value: string | null): number {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(Math.trunc(parsed), 1);
}

function clampPageSize(value: string | null): number {
  const parsed = Number(value ?? 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.trunc(parsed), 5), 50);
}

async function requireAdminResponse() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ error: "Admin requis." }, { status: 403 }) };
  return { user };
}

export async function GET(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const db = getDb();
  const url = new URL(request.url);
  const buildPageSize = clampPageSize(url.searchParams.get("buildPageSize"));
  const reportPageSize = clampPageSize(url.searchParams.get("reportPageSize"));
  const requestedBuildPage = clampPage(url.searchParams.get("buildPage"));
  const requestedReportPage = clampPage(url.searchParams.get("reportPage"));

  try {
    const [[{ value: buildTotal = 0 } = { value: 0 }], [{ value: reportTotal = 0 } = { value: 0 }]] = await Promise.all([
      db.select({ value: count() }).from(schema.builds),
      db.select({ value: count() }).from(schema.buildReports),
    ]);

    const buildTotalPages = Math.max(1, Math.ceil(buildTotal / buildPageSize));
    const reportTotalPages = Math.max(1, Math.ceil(reportTotal / reportPageSize));
    const buildPage = Math.min(requestedBuildPage, buildTotalPages);
    const reportPage = Math.min(requestedReportPage, reportTotalPages);

    const builds = await db
      .select({
        id: schema.builds.id,
        title: schema.builds.title,
        characterId: schema.builds.characterId,
        element: schema.builds.element,
        voteCount: schema.builds.voteCount,
        hidden: schema.builds.hidden,
        createdAt: schema.builds.createdAt,
        updatedAt: schema.builds.updatedAt,
        authorId: schema.users.id,
        authorName: schema.users.name,
        authorImage: schema.users.image,
        authorBanned: schema.users.banned,
      })
      .from(schema.builds)
      .innerJoin(schema.users, eq(schema.users.id, schema.builds.userId))
      .orderBy(desc(schema.builds.updatedAt))
      .limit(buildPageSize)
      .offset((buildPage - 1) * buildPageSize);

    const reports = await db
      .select({
        id: schema.buildReports.id,
        reason: schema.buildReports.reason,
        status: schema.buildReports.status,
        createdAt: schema.buildReports.createdAt,
        buildId: schema.builds.id,
        buildTitle: schema.builds.title,
        reporterId: schema.users.id,
        reporterName: schema.users.name,
        // Booléen seulement : l'adresse n'a pas à transiter vers le navigateur.
        reporterHasEmail: sql<boolean>`${schema.users.email} is not null`,
      })
      .from(schema.buildReports)
      .innerJoin(schema.builds, eq(schema.builds.id, schema.buildReports.buildId))
      .innerJoin(schema.users, eq(schema.users.id, schema.buildReports.reporterId))
      .orderBy(desc(schema.buildReports.createdAt))
      .limit(reportPageSize)
      .offset((reportPage - 1) * reportPageSize);

    return NextResponse.json({
      builds,
      reports,
      pagination: {
        builds: { page: buildPage, pageSize: buildPageSize, total: buildTotal, totalPages: buildTotalPages },
        reports: { page: reportPage, pageSize: reportPageSize, total: reportTotal, totalPages: reportTotalPages },
      },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;

    return NextResponse.json({
      builds: [],
      reports: [],
      pagination: {
        builds: { page: 1, pageSize: buildPageSize, total: 0, totalPages: 1 },
        reports: { page: 1, pageSize: reportPageSize, total: 0, totalPages: 1 },
      },
    });
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }

  const db = getDb();
  if (parsed.data.buildId && parsed.data.deleteBuild) {
    await db.delete(schema.builds).where(eq(schema.builds.id, parsed.data.buildId));
    await recordAdminAction({ adminId: guard.user.id, action: "delete_build", targetType: "build", targetId: parsed.data.buildId });
  } else if (parsed.data.buildId && parsed.data.hidden !== undefined) {
    await db
      .update(schema.builds)
      .set({ hidden: parsed.data.hidden, updatedAt: new Date() })
      .where(eq(schema.builds.id, parsed.data.buildId));
    await recordAdminAction({
      adminId: guard.user.id,
      action: parsed.data.hidden ? "hide_build" : "unhide_build",
      targetType: "build",
      targetId: parsed.data.buildId,
    });
  }

  let reporterMail: ReporterMail | null = null;
  if (parsed.data.reportId && parsed.data.reportStatus) {
    await db
      .update(schema.buildReports)
      .set({
        status: parsed.data.reportStatus,
        resolvedAt: new Date(),
        resolvedById: guard.user.id,
      })
      .where(eq(schema.buildReports.id, parsed.data.reportId));
    if (parsed.data.notifyReporter) {
      reporterMail = await notifyReporter(parsed.data.reportId, parsed.data.reportStatus, parsed.data.notifyReporter.locale);
    }
    await recordAdminAction({
      adminId: guard.user.id,
      action: `report_${parsed.data.reportStatus}`,
      targetType: "report",
      targetId: parsed.data.reportId,
      meta: { reporterMail: reporterMail ?? "not_requested" },
    });
  }

  return NextResponse.json({ ok: true, reporterMail });
}
