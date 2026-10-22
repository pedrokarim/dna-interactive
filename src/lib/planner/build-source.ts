import "server-only";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { allWeaponBuilds } from "@/data/weapons/builds";
import { getCharacterBuilds, resolveBuildItemRef } from "@/lib/characters/builds";
import { getCharacterById, resolveCharacterDisplayName } from "@/lib/characters/catalog";
import { buildPayloadSchema } from "@/lib/community-builds/validation";
import { isMissingTableError } from "@/lib/db-errors";
import { getWeaponBuilds } from "@/lib/items/weapon-builds";
import type { PlannerBuildInput, PlannerBuildOption } from "./builds";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function countWedges(itemIds: (string | null | undefined)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of itemIds) if (id) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}


const COMMUNITY_LIST_LIMIT = 12;

/**
 * Builds qu'on peut planifier pour une cible : builds officiels et
 * communautaires d'un personnage (pour son élément), ou builds de Demon Wedges
 * d'une arme.
 */
export async function listPlannerBuilds(
  target: string,
  element: string | null,
  locale: string,
): Promise<PlannerBuildOption[]> {
  const lang = locale.toUpperCase();
  const pickName = (texts: Record<string, string | undefined>) => texts[lang] ?? texts.EN ?? texts.FR ?? "";

  if (/^weapons-\d{1,9}$/.test(target)) {
    const weaponName = resolveBuildItemRef("weapons", target, lang)?.name ?? target;
    return getWeaponBuilds(target, lang).map((build, index) => ({
      key: `weapon:${target}:${index}`,
      label: [weaponName, pickName(build.buildName)].filter(Boolean).join(" · "),
      kind: "weapon" as const,
    }));
  }

  const character = getCharacterById(target);
  if (!character) return [];
  const elementKey = element ?? character.element.key;
  const official: PlannerBuildOption[] = getCharacterBuilds(target, lang)
    .filter((b) => !b.element || b.element === elementKey)
    .map((build, index) => ({
      key: `official:${target}:${elementKey}:${index}`,
      label: pickName(build.buildName) || resolveCharacterDisplayName(character, lang),
      kind: "official" as const,
      legacy: build.legacy,
    }));

  let community: PlannerBuildOption[] = [];
  try {
    const rows = await getDb()
      .select({ id: schema.builds.id, title: schema.builds.title, voteCount: schema.builds.voteCount })
      .from(schema.builds)
      .where(
        and(
          eq(schema.builds.characterId, target),
          eq(schema.builds.hidden, false),
          or(isNull(schema.builds.element), eq(schema.builds.element, elementKey)),
        ),
      )
      .orderBy(desc(schema.builds.voteCount))
      .limit(COMMUNITY_LIST_LIMIT);
    community = rows.map((row) => ({ key: `community:${row.id}`, label: row.title, kind: "community" as const, votes: row.voteCount }));
  } catch (error) {
    // Base indisponible : les builds officiels, eux, ne dépendent pas d'elle.
    if (!isMissingTableError(error)) console.error("[planner] builds communautaires indisponibles", error);
  }
  return [...official, ...community];
}

/**
 * Résout le paramètre `?build=` de la page en build réduit :
 * `official:<characterId>:<élément>:<index>` (builds du site), `community:<uuid>`
 * ou `weapon:<weaponId>:<index>` (build de Demon Wedges d'une arme).
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
    const weaponWedges = Object.fromEntries(
      best
        .filter((w) => w.withWedges)
        .map((w) => [
          w.item!.itemId,
          countWedges(allWeaponBuilds.find((b) => b.weaponId === w.item!.itemId)?.demonWedges.slots.map((s) => s.itemId) ?? []),
        ]),
    );
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
      wedges: countWedges([...build.demonWedges.slots.map((s) => s.item?.itemId), build.demonWedges.centerItem?.itemId]),
      weaponWedges,
    };
  }

  // Build de Demon Wedges d'une arme : l'arme et ses wedges, sans personnage.
  // Les exemplaires sont comptés au nom de l'arme (cf. `copiesFromDemand`).
  const weapon = param.match(/^weapon:(weapons-\d{1,9}):(\d{1,2})$/);
  if (weapon) {
    const [, weaponId, rawIndex] = weapon;
    const build = getWeaponBuilds(weaponId, lang)[Number(rawIndex)];
    if (!build) return null;
    const weaponName = resolveBuildItemRef("weapons", weaponId, lang)?.name ?? weaponId;
    const name = build.buildName[lang] ?? build.buildName.EN ?? build.buildName.FR ?? "";
    return {
      key: param,
      label: [weaponName, name].filter(Boolean).join(" · "),
      characterId: weaponId,
      element: null,
      skillPriority: [],
      weapons: [weaponId],
      alternativeWeapons: [],
      wedges: {},
      weaponWedges: { [weaponId]: countWedges(build.demonWedges.slots.map((s) => s.item?.itemId)) },
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
        wedges: countWedges([...payload.demonWedges.slots.map((s) => s.itemId), payload.demonWedges.centerItemId]),
        weaponWedges: Object.fromEntries(
          allWeapons
            .filter((w) => w.rank === "best" && w.demonWedges?.slots.length)
            .map((w) => [w.itemId, countWedges(w.demonWedges!.slots.map((s) => s.itemId))]),
        ),
      };
    } catch (error) {
      if (isMissingTableError(error)) return null;
      throw error;
    }
  }
  return null;
}
