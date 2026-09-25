import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getApiTranslator } from "@/lib/api-locale";
import { checkRateLimit } from "@/lib/rate-limit";
import { progressPayloadSchema } from "@/lib/map/validation";

export const dynamic = "force-dynamic";

/** Taille maximale du corps : ~1 200 clés suivies + 300 marqueurs tiennent large. */
const MAX_BODY_BYTES = 256 * 1024;

/** Progression de la carte du compte connecté. */
export async function GET(request: Request) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  const [row] = await getDb()
    .select()
    .from(schema.mapProgress)
    .where(eq(schema.mapProgress.userId, user.id))
    .limit(1);

  return NextResponse.json({
    foundKeys: row?.foundKeys ?? [],
    personalMarkers: row?.personalMarkers ?? [],
    updatedAt: row?.updatedAt ?? null,
  });
}

/**
 * Remplace la progression du compte. Le client envoie l'état complet (déjà
 * fusionné avec celui du serveur au premier chargement) : le dernier écrit
 * gagne, ce qui suffit pour un seul joueur sur quelques appareils.
 */
export async function PUT(request: Request) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  const rate = await checkRateLimit(`map:progress:${user.id}`, 60, 60 * 1000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: t("tooManyRequests") },
      { status: 429, headers: { "Retry-After": `${rate.retryAfter}` } },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: t("payloadTooLarge") }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: t("invalidRequest") }, { status: 400 });
  }
  const parsed = progressPayloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: t("invalidData") }, { status: 400 });

  const now = new Date();
  await getDb()
    .insert(schema.mapProgress)
    .values({ userId: user.id, ...parsed.data, updatedAt: now })
    .onConflictDoUpdate({
      target: schema.mapProgress.userId,
      set: { ...parsed.data, updatedAt: now },
    });

  return NextResponse.json({ ok: true, foundCount: parsed.data.foundKeys.length, updatedAt: now });
}
