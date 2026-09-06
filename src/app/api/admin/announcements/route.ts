import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isMissingTableError } from "@/lib/db-errors";
import { recordAdminAction } from "@/lib/admin/audit";
import { listAllAnnouncements } from "@/lib/notifications/announcements";
import { isPushConfigured } from "@/lib/notifications/push";
import { isMailConfigured } from "@/lib/email/mailer";
import { ANNOUNCEMENT_AUDIENCES, ANNOUNCEMENT_KINDS } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";

const kind = z.enum(ANNOUNCEMENT_KINDS);
const audience = z.enum(ANNOUNCEMENT_AUDIENCES);
/** Champ date-heure du formulaire : ISO complet, ou vide pour « pas de date ». */
const instant = z
  .string()
  .trim()
  .max(40)
  .nullable()
  .optional()
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Date invalide.");

const baseFields = {
  title: z.string().trim().min(1, "Titre requis.").max(160),
  body: z.string().trim().max(4000).nullable().optional(),
  href: z.string().trim().max(2000).nullable().optional(),
  image: z.string().trim().max(2000).nullable().optional(),
  kind: kind.optional(),
  audience: audience.optional(),
  status: z.enum(["draft", "published"]).optional(),
  pinned: z.boolean().optional(),
  publishedAt: instant,
  expiresAt: instant,
};

const createSchema = z.object(baseFields);
const updateSchema = z.object({ id: z.string().uuid(), ...baseFields, title: baseFields.title.optional() });
const deleteSchema = z.object({ id: z.string().uuid() });

async function requireAdminResponse() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ error: "Admin requis." }, { status: 403 }) };
  return { user };
}

/** `undefined` = champ absent du formulaire → on ne l'écrase pas. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return new Date(value);
}

export async function GET() {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const announcements = await listAllAnnouncements();
  const db = getDb();
  let pushSubscribers = 0;
  try {
    pushSubscribers = (await db.select({ endpoint: schema.pushSubscriptions.endpoint }).from(schema.pushSubscriptions)).length;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  return NextResponse.json({
    announcements,
    channels: {
      push: { configured: isPushConfigured(), subscribers: pushSubscribers },
      email: { configured: isMailConfigured() },
    },
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }

  const { publishedAt, expiresAt, ...rest } = parsed.data;
  const status = rest.status ?? "draft";
  const db = getDb();
  const [row] = await db
    .insert(schema.announcements)
    .values({
      ...clean(rest),
      title: rest.title,
      status,
      // Publier sans date explicite veut dire « maintenant ». Sans ce défaut,
      // l'annonce serait publiée mais jamais visible (publishedAt nul).
      publishedAt: toDate(publishedAt) ?? (status === "published" ? new Date() : null),
      expiresAt: toDate(expiresAt) ?? null,
      createdById: guard.user.id,
    })
    .returning({ id: schema.announcements.id });

  await recordAdminAction({
    adminId: guard.user.id,
    action: "create_announcement",
    targetType: "announcement",
    targetId: row?.id,
  });
  return NextResponse.json({ ok: true, id: row?.id });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }

  const { id, publishedAt, expiresAt, ...rest } = parsed.data;
  const db = getDb();

  const [current] = await db
    .select({ publishedAt: schema.announcements.publishedAt })
    .from(schema.announcements)
    .where(eq(schema.announcements.id, id))
    .limit(1);
  if (!current) return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });

  const dates: Record<string, Date | null> = {};
  const nextPublishedAt = toDate(publishedAt);
  if (nextPublishedAt !== undefined) dates.publishedAt = nextPublishedAt;
  const nextExpiresAt = toDate(expiresAt);
  if (nextExpiresAt !== undefined) dates.expiresAt = nextExpiresAt;
  // Passage en « publié » sans date déjà posée : on horodate à l'instant.
  if (rest.status === "published" && dates.publishedAt === undefined && !current.publishedAt) {
    dates.publishedAt = new Date();
  }

  await db
    .update(schema.announcements)
    .set({ ...clean(rest), ...dates, updatedAt: new Date() })
    .where(eq(schema.announcements.id, id));

  await recordAdminAction({
    adminId: guard.user.id,
    action: "update_announcement",
    targetType: "announcement",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const db = getDb();
  await db.delete(schema.announcements).where(eq(schema.announcements.id, parsed.data.id));
  await recordAdminAction({
    adminId: guard.user.id,
    action: "delete_announcement",
    targetType: "announcement",
    targetId: parsed.data.id,
  });
  return NextResponse.json({ ok: true });
}
