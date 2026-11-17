import { getDb, schema } from "@/db";

type AdminActionInput = {
  adminId: string;
  action: string;
  targetType: "user" | "build" | "report" | "calendar_event" | "settings" | "redemption_code" | "announcement" | "changelog_entry" | "farm_route" | "theatre_rotation";
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
};

/**
 * Enregistre une action de modération admin, au mieux : une table absente ou
 * une erreur DB est avalée, l'action elle-même ne doit jamais échouer à cause du journal.
 */
export async function recordAdminAction(input: AdminActionInput): Promise<void> {
  try {
    await getDb().insert(schema.adminActions).values({
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      meta: input.meta ?? null,
    });
  } catch {
    // Le journal ne bloque pas la modération.
  }
}
