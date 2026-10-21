// Sonde de santé : le processus répond ET lit sa base. Interrogée par Docker
// (healthcheck du compose) et par la sonde externe en cron. Ne renvoie aucune
// donnée : un 200 ou un 503, jamais mis en cache.

import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3_000;

export async function GET() {
  try {
    await Promise.race([
      getDb().execute(sql`select 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS)),
    ]);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
