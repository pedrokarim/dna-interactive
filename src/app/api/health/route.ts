// Sonde de santé : 200 si le processus répond et lit sa base, 503 sinon, sans
// cache ni donnée. Appelée par le healthcheck Docker du compose et par la
// sonde externe en cron.

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
