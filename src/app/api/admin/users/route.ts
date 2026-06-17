import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin"]).optional(),
  banned: z.boolean().optional(),
});

async function requireAdminResponse() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ error: "Admin requis." }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const users = await getDb()
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      image: schema.users.image,
      discordId: schema.users.discordId,
      role: schema.users.role,
      banned: schema.users.banned,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(120);

  return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  if (parsed.data.userId === guard.user.id && parsed.data.banned) {
    return NextResponse.json({ error: "Impossible de bannir ton propre compte." }, { status: 400 });
  }

  await getDb()
    .update(schema.users)
    .set({
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      ...(parsed.data.banned !== undefined ? { banned: parsed.data.banned } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, parsed.data.userId));

  return NextResponse.json({ ok: true });
}
