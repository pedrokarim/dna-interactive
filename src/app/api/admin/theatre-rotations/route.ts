import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isMissingTableError } from "@/lib/db-errors";
import { recordAdminAction } from "@/lib/admin/audit";
import { rowToRotation } from "@/lib/theatre/db";
import { toRotationView } from "@/lib/theatre/featured";

export const dynamic = "force-dynamic";

const instant = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Date et heure attendues au format ISO.");
const featuredKind = z.enum(["character", "weapon"]);
/** `char-…` pour un personnage, `weapons-…` pour une arme. */
const featuredId = z.string().trim().min(1).max(80);

const baseFields = {
  startsAt: instant,
  endsAt: instant,
  featuredKind,
  featuredId,
  note: z.string().trim().max(2000).optional().nullable(),
  sourceUrl: z.string().trim().max(2000).optional().nullable(),
  hidden: z.boolean().optional(),
};

const createSchema = z.object(baseFields);
const updateSchema = z.object({
  id: z.string().uuid(),
  startsAt: instant.optional(),
  endsAt: instant.optional(),
  featuredKind: featuredKind.optional(),
  featuredId: featuredId.optional(),
  note: baseFields.note,
  sourceUrl: baseFields.sourceUrl,
  hidden: baseFields.hidden,
});
const deleteSchema = z.object({ id: z.string().uuid() });

function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

async function requireAdminResponse() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ error: "Admin requis." }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  try {
    const rows = await getDb()
      .select()
      .from(schema.theatreRotations)
      .orderBy(asc(schema.theatreRotations.startsAt));
    // L'admin lit en français : les noms résolus servent à vérifier d'un coup
    // d'œil que l'identifiant saisi désigne bien ce qu'on croit.
    const rotations = rows.map((row) => ({
      ...toRotationView(rowToRotation(row), "fr"),
      hidden: row.hidden,
    }));
    return NextResponse.json({ rotations });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return NextResponse.json({ rotations: [], migrationPending: true });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  const { startsAt, endsAt, ...rest } = parsed.data;
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    return NextResponse.json({ error: "La fin doit être postérieure au début." }, { status: 400 });
  }
  const [row] = await getDb()
    .insert(schema.theatreRotations)
    .values({ ...rest, startsAt: new Date(startsAt), endsAt: new Date(endsAt), createdById: guard.user.id })
    .returning({ id: schema.theatreRotations.id });
  await recordAdminAction({ adminId: guard.user.id, action: "create_theatre_rotation", targetType: "theatre_rotation", targetId: row?.id });
  return NextResponse.json({ ok: true, id: row?.id });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  const { id, startsAt, endsAt, ...rest } = parsed.data;
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    return NextResponse.json({ error: "La fin doit être postérieure au début." }, { status: 400 });
  }
  await getDb()
    .update(schema.theatreRotations)
    .set({
      ...clean(rest),
      ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
      ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.theatreRotations.id, id));
  await recordAdminAction({ adminId: guard.user.id, action: "update_theatre_rotation", targetType: "theatre_rotation", targetId: id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  await getDb().delete(schema.theatreRotations).where(eq(schema.theatreRotations.id, parsed.data.id));
  await recordAdminAction({ adminId: guard.user.id, action: "delete_theatre_rotation", targetType: "theatre_rotation", targetId: parsed.data.id });
  return NextResponse.json({ ok: true });
}
