import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { allWeaponBuilds } from "@/data/weapons/builds";
import { getCharacterBuilds } from "@/lib/characters/builds";
import { getCharacterById, resolveCharacterDisplayName } from "@/lib/characters/catalog";
import { buildPayloadSchema } from "@/lib/community-builds/validation";
import { isMissingTableError } from "@/lib/db-errors";
import type { PlannerBuildInput } from "./builds";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function countWedges(itemIds: (string | null | undefined)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of itemIds) if (id) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}

/**
 * Résout le paramètre `?build=` de la page en build réduit :
 * `official:<characterId>:<élément>:<index>` (builds du site) ou `community:<uuid>`.
 * Tout ce qui ne se résout pas renvoie `null` : la page s'affiche sans import.
 */
export async function resolvePlannerBuild(param: string | undefined, locale: string): Promise<PlannerBuildInput | null> {
  if (!param) return null;
  const lang = locale.toUpperCase();

  // Même filtre que l'onglet Build de la fiche : les builds marqués d'un
  // élément ne valent que pour lui, les autres pour tous.
  const official = param.match(/^official:([a-z0-9-]{1,80}):([A-Za-z]{1,20}):(\d{1,2})$/);
  if (official) {
    const [, characterId, elementKey, rawIndex] = official;
    const build = getCharacterBuilds(characterId, lang).filter((b) => !b.element || b.element === elementKey)[
      Number(rawIndex)
    ];
    const character = getCharacterById(characterId);
    if (!build || !character) return null;
    const name = build.buildName[lang] ?? build.buildName.EN ?? build.buildName.FR ?? "";
    const allWeapons = [...build.weapons.melee, ...build.weapons.ranged];
    const best = allWeapons.filter((w) => w.rank === "best" && w.item);
    // Les wedges d'arme d'un build officiel sont ceux du build canonique de
    // l'arme (`withWedges`), seulement pour les armes retenues.
    const weaponWedges = best
      .filter((w) => w.withWedges)
      .flatMap((w) => allWeaponBuilds.find((b) => b.weaponId === w.item!.itemId)?.demonWedges.slots.map((s) => s.itemId) ?? []);
    return {
      key: param,
      label: [resolveCharacterDisplayName(character, lang), name].filter(Boolean).join(" · "),
      characterId,
      element: build.element ?? elementKey,
      skillPriority: build.skillPriority
        .filter((s) => s.skillIndex)
        .map((s) => ({ skillIndex: s.skillIndex as number, priority: s.priority })),
      weapons: best.map((w) => w.item!.itemId),
      alternativeWeapons: allWeapons.filter((w) => w.rank !== "best" && w.item).map((w) => w.item!.itemId),
      wedges: countWedges([
        ...build.demonWedges.slots.map((s) => s.item?.itemId),
        build.demonWedges.centerItem?.itemId,
        ...weaponWedges,
      ]),
    };
  }

  const community = param.match(/^community:(.+)$/);
  if (community && UUID.test(community[1])) {
    try {
      const [row] = await getDb()
        .select({
          characterId: schema.builds.characterId,
          element: schema.builds.element,
          title: schema.builds.title,
          payload: schema.builds.payload,
          hidden: schema.builds.hidden,
        })
        .from(schema.builds)
        .where(eq(schema.builds.id, community[1]))
        .limit(1);
      if (!row || row.hidden) return null;
      // Charge utile relue et revalidée, jamais prise telle quelle.
      const parsed = buildPayloadSchema.safeParse(row.payload);
      if (!parsed.success) return null;
      const payload = parsed.data;
      const allWeapons = [...payload.weapons.melee, ...payload.weapons.ranged];
      return {
        key: param,
        label: row.title,
        characterId: row.characterId,
        element: row.element,
        skillPriority: payload.skillPriority.map((s) => ({ skillIndex: s.skillIndex, priority: s.priority })),
        weapons: allWeapons.filter((w) => w.rank === "best").map((w) => w.itemId),
        alternativeWeapons: allWeapons.filter((w) => w.rank !== "best").map((w) => w.itemId),
        wedges: countWedges([
          ...payload.demonWedges.slots.map((s) => s.itemId),
          payload.demonWedges.centerItemId,
          ...allWeapons.filter((w) => w.rank === "best").flatMap((w) => w.demonWedges?.slots.map((s) => s.itemId) ?? []),
        ]),
      };
    } catch (error) {
      if (isMissingTableError(error)) return null;
      throw error;
    }
  }
  return null;
}
