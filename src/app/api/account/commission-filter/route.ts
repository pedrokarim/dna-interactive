import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getApiTranslator } from "@/lib/api-locale";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseCommissionFilter } from "@/lib/commissions/preferences";
import { saveAccountCommissionFilter } from "@/lib/commissions/preferences-db";

export const dynamic = "force-dynamic";

/** Le filtre tient en une centaine d'octets ; au-delà, ce n'est pas un filtre. */
const MAX_BODY_BYTES = 1024;

/**
 * Enregistre sur le compte les commissions affichées sur l'accueil.
 * Corps : `{ filter: { regions, categories } | null }`. Un filtre qui garde
 * tout est enregistré tel quel : c'est un choix explicite, qui l'emporte sur le
 * cookie d'un autre navigateur. `null` efface le réglage du compte.
 */
export async function PUT(request: Request) {
  const t = await getApiTranslator(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: t("signInRequired") }, { status: 401 });

  const rate = await checkRateLimit(`account:commission-filter:${user.id}`, 30, 60 * 1000);
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
  const value = (body as { filter?: unknown } | null)?.filter;
  const filter = value === null ? null : parseCommissionFilter(value);
  if (value !== null && !filter) return NextResponse.json({ error: t("invalidData") }, { status: 400 });

  await saveAccountCommissionFilter(user.id, filter);
  return NextResponse.json({ ok: true });
}
