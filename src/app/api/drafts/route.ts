import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  draftElementKey,
  draftSchema,
  publicElementValue,
  validateBuildReferences,
} from "@/lib/community-builds/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const url = new URL(request.url);
  const characterId = url.searchParams.get("characterId");
  if (!characterId) {
    return NextResponse.json({ error: "characterId est requis." }, { status: 400 });
  }
  const element = draftElementKey(url.searchParams.get("element"));

  const [draft] = await getDb()
    .select()
    .from(schema.buildDrafts)
    .where(
      and(
        eq(schema.buildDrafts.userId, user.id),
        eq(schema.buildDrafts.characterId, characterId),
        eq(schema.buildDrafts.element, element),
      ),
    )
    .limit(1);

  return NextResponse.json({
    draft: draft
      ? {
          ...draft,
          element: publicElementValue(draft.element),
        }
      : null,
  });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const rate = checkRateLimit(`build:draft:${user.id}`, 120, 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de sauvegardes. Réessaie plus tard." },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const parsed = draftSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Brouillon invalide." }, { status: 400 });
  }

  const referenceErrors = validateBuildReferences(parsed.data);
  if (referenceErrors.length > 0) {
    return NextResponse.json({ error: referenceErrors[0], details: referenceErrors }, { status: 400 });
  }

  const element = draftElementKey(parsed.data.element);
  const now = new Date();
  const [draft] = await getDb()
    .insert(schema.buildDrafts)
    .values({
      userId: user.id,
      characterId: parsed.data.characterId,
      element,
      title: parsed.data.title ?? null,
      note: parsed.data.note ?? null,
      payload: parsed.data.payload,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.buildDrafts.userId, schema.buildDrafts.characterId, schema.buildDrafts.element],
      set: {
        title: parsed.data.title ?? null,
        note: parsed.data.note ?? null,
        payload: parsed.data.payload,
        updatedAt: now,
      },
    })
    .returning();

  return NextResponse.json({ draft: { ...draft, element: publicElementValue(draft.element) } });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const url = new URL(request.url);
  const characterId = url.searchParams.get("characterId");
  if (!characterId) {
    return NextResponse.json({ error: "characterId est requis." }, { status: 400 });
  }
  const element = draftElementKey(url.searchParams.get("element"));

  await getDb()
    .delete(schema.buildDrafts)
    .where(
      and(
        eq(schema.buildDrafts.userId, user.id),
        eq(schema.buildDrafts.characterId, characterId),
        eq(schema.buildDrafts.element, element),
      ),
    );

  return NextResponse.json({ ok: true });
}
