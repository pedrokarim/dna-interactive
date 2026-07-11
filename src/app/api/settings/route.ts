import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/settings/db";

export const dynamic = "force-dynamic";

/** Réglages publics (non secrets) — consommés côté client (bannière, visibilités…). */
export async function GET() {
  const settings = await getAppSettings();
  return NextResponse.json({ settings });
}
