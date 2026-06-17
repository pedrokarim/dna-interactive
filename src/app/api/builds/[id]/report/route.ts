import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/community-builds/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const rate = checkRateLimit(`build:report:${user.id}`, 10, 60 * 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de signalements. Réessaie plus tard." },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const { id } = await params;
  const [build] = await getDb()
    .select({ id: schema.builds.id, userId: schema.builds.userId, hidden: schema.builds.hidden })
    .from(schema.builds)
    .where(eq(schema.builds.id, id))
    .limit(1);

  if (!build || build.hidden) return NextResponse.json({ error: "Build introuvable." }, { status: 404 });
  if (build.userId === user.id) {
    return NextResponse.json({ error: "Tu ne peux pas signaler ton propre build." }, { status: 400 });
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
