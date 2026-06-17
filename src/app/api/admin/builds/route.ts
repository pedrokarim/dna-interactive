import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  buildId: z.string().uuid().optional(),
  hidden: z.boolean().optional(),
  deleteBuild: z.boolean().optional(),
  reportId: z.string().uuid().optional(),
  reportStatus: z.enum(["resolved", "dismissed"]).optional(),
});

async function requireAdminResponse() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ error: "Admin requis." }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const db = getDb();
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
    .limit(80);

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
    })
    .from(schema.buildReports)
    .innerJoin(schema.builds, eq(schema.builds.id, schema.buildReports.buildId))
    .innerJoin(schema.users, eq(schema.users.id, schema.buildReports.reporterId))
    .orderBy(desc(schema.buildReports.createdAt))
    .limit(80);

  return NextResponse.json({ builds, reports });
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
  } else if (parsed.data.buildId && parsed.data.hidden !== undefined) {
    await db
      .update(schema.builds)
      .set({ hidden: parsed.data.hidden, updatedAt: new Date() })
      .where(eq(schema.builds.id, parsed.data.buildId));
  }

  if (parsed.data.reportId && parsed.data.reportStatus) {
    await db
      .update(schema.buildReports)
      .set({
        status: parsed.data.reportStatus,
        resolvedAt: new Date(),
        resolvedById: guard.user.id,
      })
      .where(eq(schema.buildReports.id, parsed.data.reportId));
  }

  return NextResponse.json({ ok: true });
}
