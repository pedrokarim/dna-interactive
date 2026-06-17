import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { isConfiguredAdminDiscordId } from "@/lib/auth/admins";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin"]).optional(),
  banned: z.boolean().optional(),
});

function clampPage(value: string | null): number {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(Math.trunc(parsed), 1);
}

function clampPageSize(value: string | null): number {
  const parsed = Number(value ?? 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.trunc(parsed), 5), 50);
}

async function requireAdminResponse() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ error: "Admin requis." }, { status: 403 }) };
  return { user };
}

export async function GET(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const db = getDb();
  const url = new URL(request.url);
  const pageSize = clampPageSize(url.searchParams.get("pageSize"));
  const requestedPage = clampPage(url.searchParams.get("page"));
  const [{ value: total = 0 } = { value: 0 }] = await db.select({ value: count() }).from(schema.users);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const users = await db
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
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      configuredAdmin: isConfiguredAdminDiscordId(user.discordId),
    })),
    pagination: { page, pageSize, total, totalPages },
  });
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
  if (parsed.data.userId === guard.user.id && parsed.data.role === "user") {
    return NextResponse.json({ error: "Impossible de retirer ton propre accès admin." }, { status: 400 });
  }

  const db = getDb();
  if (parsed.data.role === "user" || parsed.data.banned === true) {
    const [target] = await db
      .select({ discordId: schema.users.discordId })
      .from(schema.users)
      .where(eq(schema.users.id, parsed.data.userId))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }
    if (isConfiguredAdminDiscordId(target.discordId)) {
      return NextResponse.json(
        { error: "Cet admin est défini par ADMIN_DISCORD_IDS et ne peut pas être rétrogradé ou banni depuis l'UI." },
        { status: 400 },
      );
    }
  }

  await db
    .update(schema.users)
    .set({
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      ...(parsed.data.banned !== undefined ? { banned: parsed.data.banned } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, parsed.data.userId));

  return NextResponse.json({ ok: true });
}
