import "server-only";
import progressionJson from "@/data/planner/progression.json";
import materialsJson from "@/data/planner/materials.json";
import sourcesJson from "@/data/planner/sources.json";
import { getActiveCharacterView, getCharacterById } from "@/lib/characters/catalog";
import { getBuilderOptions } from "@/lib/community-builds/options";
import type { MaterialKey, PlannerDataset, PlannerMaterial, PlannerSources, ProgressionData } from "./types";

type Localized = Partial<Record<string, string>>;
type RawMaterial = { name: Localized | null; icon: string | null; rarity: number; href: string | null };
type RawSources = {
  activities: Record<string, { name: Localized | null; focus: Localized | null; levels: [number, number] }>;
  access: Record<string, Localized | null>;
  byMaterial: PlannerSources["byMaterial"];
};

const pick = (value: Localized | null | undefined, lang: string): string | null =>
  value?.[lang] ?? value?.EN ?? value?.FR ?? null;

const cache = new Map<string, PlannerDataset>();

/**
 * Jeu de données du planificateur pour une langue : coûts, objets, sources et
 * catalogue des cibles. Les noms sont résolus ici, le client ne reçoit que la
 * langue affichée.
 */
export function getPlannerDataset(locale: string): PlannerDataset {
  const lang = locale.toUpperCase();
  const cached = cache.get(lang);
  if (cached) return cached;

  const materials: Record<MaterialKey, PlannerMaterial> = {};
  for (const [key, raw] of Object.entries(materialsJson as Record<string, RawMaterial>)) {
    materials[key] = { name: pick(raw.name, lang) ?? key, icon: raw.icon, rarity: raw.rarity, href: raw.href };
  }

  const rawSources = sourcesJson as unknown as RawSources;
  const sources: PlannerSources = {
    activities: Object.fromEntries(
      Object.entries(rawSources.activities).map(([id, a]) => [
        id,
        { name: pick(a.name, lang) ?? id, focus: pick(a.focus, lang), levels: a.levels },
      ]),
    ),
    access: Object.fromEntries(Object.entries(rawSources.access).map(([id, label]) => [id, pick(label, lang) ?? id])),
    byMaterial: rawSources.byMaterial,
  };

  const options = getBuilderOptions(locale);
  const characters = options.characters.map((option) => {
    const record = getCharacterById(option.id);
    const elements =
      record && option.elements.length > 0
        ? option.elements.map((element) => ({
            key: element.key as string | null,
            label: element.label,
            charId: getActiveCharacterView(record, element.key).charId,
          }))
        : [{ key: option.element as string | null, label: "", charId: option.charId }];
    return { id: option.id, name: option.name, avatar: option.avatar, rarity: option.rarity, elements, skills: option.skills };
  });

  const progression = progressionJson as unknown as ProgressionData;
  const item = (i: { id: string; name: string; icon?: string | null; rarity?: number | null }) => ({
    id: i.id,
    name: i.name,
    icon: i.icon ?? null,
    rarity: i.rarity ?? null,
  });

  const dataset: PlannerDataset = {
    progression,
    materials,
    sources,
    catalog: {
      characters: characters.filter((c) => c.elements.some((e) => progression.characters[String(e.charId)])),
      weapons: options.weapons.filter((w) => progression.weapons[w.id]).map(item),
      wedges: options.mods.filter((m) => progression.mods[m.id]).map(item),
    },
  };
  cache.set(lang, dataset);
  return dataset;
}
