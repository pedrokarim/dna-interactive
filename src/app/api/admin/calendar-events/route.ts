import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isMissingTableError } from "@/lib/db-errors";
import { recordAdminAction } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ.");
const category = z.enum(["Bannière", "Arme", "Événement", "Épreuve", "Récompense"]);

const baseFields = {
  title: z.string().trim().min(1).max(160),
  category,
  startDate: isoDate,
  endDate: isoDate,
  image: z.string().trim().max(2000).optional().nullable(),
  href: z.string().trim().max(2000).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  sourceUrl: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.number().int().optional(),
  hidden: z.boolean().optional(),
};

const createSchema = z.object(baseFields);
const updateSchema = z.object({
  id: z.string().uuid(),
  title: baseFields.title.optional(),
  category: category.optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  image: baseFields.image,
  href: baseFields.href,
  description: baseFields.description,
  sourceUrl: baseFields.sourceUrl,
  sortOrder: baseFields.sortOrder,
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
  const db = getDb();
  try {
    const events = await db
      .select()
      .from(schema.calendarEvents)
      .orderBy(asc(schema.calendarEvents.sortOrder), asc(schema.calendarEvents.startDate));
    return NextResponse.json({ events });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return NextResponse.json({ events: [], migrationPending: true });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  const db = getDb();
  const [row] = await db
    .insert(schema.calendarEvents)
    .values({ ...parsed.data, createdById: guard.user.id })
    .returning({ id: schema.calendarEvents.id });
  await recordAdminAction({ adminId: guard.user.id, action: "create_calendar_event", targetType: "calendar_event", targetId: row?.id });
  return NextResponse.json({ ok: true, id: row?.id });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  const { id, ...rest } = parsed.data;
  const db = getDb();
  await db
    .update(schema.calendarEvents)
    .set({ ...clean(rest), updatedAt: new Date() })
    .where(eq(schema.calendarEvents.id, id));
  await recordAdminAction({ adminId: guard.user.id, action: "update_calendar_event", targetType: "calendar_event", targetId: id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  const db = getDb();
  await db.delete(schema.calendarEvents).where(eq(schema.calendarEvents.id, parsed.data.id));
  await recordAdminAction({ adminId: guard.user.id, action: "delete_calendar_event", targetType: "calendar_event", targetId: parsed.data.id });
  return NextResponse.json({ ok: true });
}
