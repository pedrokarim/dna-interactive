import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import {
  updateBuildSchema,
  validateBuildReferences,
} from "@/lib/community-builds/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function getEditableBuild(id: string) {
  const db = getDb();
  const [build] = await db.select().from(schema.builds).where(eq(schema.builds.id, id)).limit(1);
  return build ?? null;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { id } = await params;
  const build = await getEditableBuild(id);
  if (!build) return NextResponse.json({ error: "Build introuvable." }, { status: 404 });
  if (build.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Action interdite." }, { status: 403 });
  }

  const parsed = updateBuildSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Build invalide." }, { status: 400 });
  }

  if (parsed.data.payload) {
    const referenceErrors = validateBuildReferences({
      characterId: build.characterId,
      element: build.element,
      title: parsed.data.title ?? build.title,
      note: parsed.data.note ?? build.note,
      payload: parsed.data.payload,
    });
    if (referenceErrors.length > 0) {
      return NextResponse.json({ error: referenceErrors[0], details: referenceErrors }, { status: 400 });
    }
  }

  const [updated] = await getDb()
    .update(schema.builds)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note ?? null } : {}),
      ...(parsed.data.payload !== undefined ? { payload: parsed.data.payload } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.builds.id, id))
    .returning();

  return NextResponse.json({ build: updated });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { id } = await params;
  const build = await getEditableBuild(id);
  if (!build) return NextResponse.json({ error: "Build introuvable." }, { status: 404 });
  if (build.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Action interdite." }, { status: 403 });
  }

  await getDb().delete(schema.builds).where(and(eq(schema.builds.id, id)));
  return NextResponse.json({ ok: true });
}
