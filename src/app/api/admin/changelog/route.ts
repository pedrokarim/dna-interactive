import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAdminAction } from "@/lib/admin/audit";
import { listAllChangelogEntries } from "@/lib/changelog/db";
import { CHANGELOG_TYPES, isValidVersion } from "@/lib/changelog/types";
import { locales, defaultLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

const translation = z.object({
  title: z.string().trim().min(1, "Titre requis.").max(200),
  description: z.string().trim().max(2000).default(""),
  items: z.array(z.string().trim().min(1).max(500)).max(40).default([]),
});

const baseFields = {
  version: z
    .string()
    .trim()
    .refine(isValidVersion, "Version attendue au format numérique, ex. « 2.4.0 »."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ."),
  type: z.enum(CHANGELOG_TYPES),
  // PIÈGE : `z.record(z.enum(locales), …)` rend en Zod 4 **toutes** les langues
  // obligatoires. Une entrée rédigée en français seul était donc refusée. On
  // valide donc des clés libres, puis on vérifie qu'elles sont bien des langues
  // du site.
  translations: z
    .record(z.string(), translation)
    .refine((value) => Object.keys(value).length > 0, "Au moins une langue est requise.")
    .refine(
      (value) => Object.keys(value).every((key) => (locales as readonly string[]).includes(key)),
      "Langue inconnue.",
    )
    // La langue par défaut sert de repli à toutes les autres : sans elle, une
    // entrée pourrait n'être lisible dans aucune langue attendue.
    .refine((value) => Boolean(value[defaultLocale]), `La langue « ${defaultLocale} » est obligatoire.`),
  hidden: z.boolean().optional(),
};

const createSchema = z.object(baseFields);
const updateSchema = z.object({
  id: z.string().uuid(),
  version: baseFields.version.optional(),
  date: baseFields.date.optional(),
  type: baseFields.type.optional(),
  translations: baseFields.translations.optional(),
  hidden: baseFields.hidden,
});
const deleteSchema = z.object({ id: z.string().uuid() });

async function requireAdminResponse() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Connexion requise." }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ error: "Admin requis." }, { status: 403 }) };
  return { user };
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function GET() {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;
  const entries = await listAllChangelogEntries();
  return NextResponse.json({ entries, locales, defaultLocale });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }

  const db = getDb();
  // La version est l'ancre publique (#v2.4.0) : deux entrées ne peuvent pas la
  // partager. On le dit clairement plutôt que de laisser remonter l'erreur SQL.
  const [existing] = await db
    .select({ id: schema.changelogEntries.id })
    .from(schema.changelogEntries)
    .where(eq(schema.changelogEntries.version, parsed.data.version))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: `La version ${parsed.data.version} existe déjà.` }, { status: 409 });
  }

  const [row] = await db
    .insert(schema.changelogEntries)
    .values({ ...parsed.data, createdById: guard.user.id })
    .returning({ id: schema.changelogEntries.id });

  await recordAdminAction({
    adminId: guard.user.id,
    action: "create_changelog_entry",
    targetType: "changelog_entry",
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

  const { id, ...rest } = parsed.data;
  const db = getDb();

  if (rest.version) {
    const [clash] = await db
      .select({ id: schema.changelogEntries.id })
      .from(schema.changelogEntries)
      .where(eq(schema.changelogEntries.version, rest.version))
      .limit(1);
    if (clash && clash.id !== id) {
      return NextResponse.json({ error: `La version ${rest.version} existe déjà.` }, { status: 409 });
    }
  }

  await db
    .update(schema.changelogEntries)
    .set({ ...clean(rest), updatedAt: new Date() })
    .where(eq(schema.changelogEntries.id, id));

  await recordAdminAction({
    adminId: guard.user.id,
    action: "update_changelog_entry",
    targetType: "changelog_entry",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminResponse();
  if ("response" in guard) return guard.response;

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const db = getDb();
  await db.delete(schema.changelogEntries).where(eq(schema.changelogEntries.id, parsed.data.id));
  await recordAdminAction({
    adminId: guard.user.id,
    action: "delete_changelog_entry",
    targetType: "changelog_entry",
    targetId: parsed.data.id,
  });
  return NextResponse.json({ ok: true });
}
