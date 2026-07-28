import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/community-builds/validation";
import { getApiTranslator } from "@/lib/api-locale";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });
  const rate = await checkRateLimit(`build:report:${user.id}`, 10, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: t("tooManyReports") },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const { id } = await params;
  const [build] = await getDb()
    .select({ id: schema.builds.id, userId: schema.builds.userId, hidden: schema.builds.hidden })
    .from(schema.builds)
    .where(eq(schema.builds.id, id))
    .limit(1);

  if (!build || build.hidden) return NextResponse.json({ error: t("buildNotFound") }, { status: 404 });
  if (build.userId === user.id) {
    return NextResponse.json({ error: t("cannotReportOwnBuild") }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Signalement invalide." }, { status: 400 });
  }

  const [report] = await getDb()
    .insert(schema.buildReports)
    .values({ buildId: id, reporterId: user.id, reason: parsed.data.reason })
    .returning();

  return NextResponse.json({ report }, { status: 201 });
}
