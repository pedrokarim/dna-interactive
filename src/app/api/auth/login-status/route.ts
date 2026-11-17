import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/community-builds/vote-identity";

export const dynamic = "force-dynamic";

// Après un login raté, l'UI demande ici si c'est un email non vérifié (on
// propose alors de renvoyer le lien) ou juste un mauvais identifiant.
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  if (!(await checkRateLimit(`auth:login-status:${ip}`, 20, 60 * 1000)).ok) {
    return NextResponse.json({ needsVerification: false });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ needsVerification: false });

  const [user] = await getDb()
    .select({
      passwordHash: schema.users.passwordHash,
      emailVerified: schema.users.emailVerified,
      banned: schema.users.banned,
    })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .limit(1);

  const needsVerification = Boolean(user && user.passwordHash && !user.emailVerified && !user.banned);
  return NextResponse.json({ needsVerification });
}
