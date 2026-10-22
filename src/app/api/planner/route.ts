import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getApiTranslator } from "@/lib/api-locale";
import { isMissingTableError } from "@/lib/db-errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { keepKnownReferences } from "@/lib/planner/references";
import { plannerStateSchema, readPlannerState } from "@/lib/planner/schema";

export const dynamic = "force-dynamic";

/** 40 objectifs et 600 lignes de stock tiennent très largement. */
const MAX_BODY_BYTES = 128 * 1024;

/** Plan du compte connecté. `plan: null` = rien d'enregistré (ou table absente). */
export async function GET(request: Request) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  try {
    const [row] = await getDb()
      .select()
      .from(schema.farmPlans)
      .where(eq(schema.farmPlans.userId, user.id))
      .limit(1);
    if (!row) return NextResponse.json({ plan: null, updatedAt: null });
    // Relu à travers le schéma : jamais renvoyé tel quel.
    const plan = keepKnownReferences(
      readPlannerState({ version: 1, goals: row.goals, inventory: row.inventory, craftChoices: row.craftChoices }),
    );
    return NextResponse.json({ plan, updatedAt: row.updatedAt });
  } catch (error) {
    if (isMissingTableError(error)) return NextResponse.json({ plan: null, updatedAt: null, unavailable: true });
    throw error;
  }
}

/**
 * Remplace le plan du compte. Le client envoie l'état complet (déjà fusionné
 * avec celui du serveur au premier chargement) : le dernier écrit gagne, comme
 * pour la progression de la carte.
 */
export async function PUT(request: Request) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  const rate = await checkRateLimit(`planner:save:${user.id}`, 60, 60 * 1000);
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
  const parsed = plannerStateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  const plan = keepKnownReferences(parsed.data);

  const now = new Date();
  const values = { goals: plan.goals, inventory: plan.inventory, craftChoices: plan.craftChoices, schemaVersion: 1, updatedAt: now };
  try {
    await getDb()
      .insert(schema.farmPlans)
      .values({ userId: user.id, ...values })
      .onConflictDoUpdate({ target: schema.farmPlans.userId, set: values });
  } catch (error) {
    if (isMissingTableError(error)) return NextResponse.json({ error: t("invalidRequest") }, { status: 503 });
    throw error;
  }

  return NextResponse.json({ ok: true, updatedAt: now });
}
