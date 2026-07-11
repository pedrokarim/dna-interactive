import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getEmailStats } from "@/lib/email/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const stats = await getEmailStats();
  return NextResponse.json(stats);
}
