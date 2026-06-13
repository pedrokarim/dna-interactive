import { NextResponse } from "next/server";
import { getRotationForDisplay } from "@/lib/commissions";

export const dynamic = "force-dynamic";

/** État courant des Covert Commissions + cadence (consommé par le board client). */
export async function GET() {
  const { state, meta, hasData } = await getRotationForDisplay();
  return NextResponse.json(
    { state, meta, hasData },
    { headers: { "Cache-Control": "no-store" } },
  );
}
