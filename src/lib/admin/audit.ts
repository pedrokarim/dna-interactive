import { getDb, schema } from "@/db";

type AdminActionInput = {
  adminId: string;
  action: string;
  targetType: "user" | "build" | "report";
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
};

/**
 * Enregistre une action de modération admin (best-effort : ne doit JAMAIS faire
 * échouer l'action elle-même — table absente, erreur DB, etc. sont avalées).
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
    // Journalisation best-effort — on n'interrompt pas la modération.
  }
}
