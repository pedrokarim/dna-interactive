import { getAllCharacters, getActiveCharacterView, getCharacterSlug, resolveCharacterDisplayName, getCharacterSkills } from "@/lib/characters/catalog";
import { getItemTranslation, getItemsByCategoryId } from "@/lib/items/catalog";
import type { CharacterRecord } from "@/lib/characters/types";
import type { ItemRecord } from "@/lib/items/types";
import type { DnaPickerItem } from "@/components/dna/ItemPicker";
import type { ElementKey } from "@/components/dna/elements";
import { allWeaponBuilds } from "@/data/weapons/builds";

const ELEMENT_KEYS = new Set(["Fire", "Water", "Thunder", "Wind", "Light", "Dark"]);

export type BuilderCharacterOption = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  portrait: string | null;
  /** Splash complet (bust 2048²) — pour la bannière des cartes. */
  art: string | null;
  /** Portrait carré (head) — pour les mini-avatars / line-up. */
  avatar: string | null;
  /** Compétences réelles référençables (slots skill1/2/3) — le builder n'en propose pas d'autres. */
  skills: Array<{ index: number; name: string }>;
  element: ElementKey | null;
  elements: Array<{ key: ElementKey; label: string }>;
  weapons: string[];
  rarity: number | null;
  searchText: string;
  consonanceByElement: Record<string, DnaPickerItem | null>;
};

export type BuilderOptions = {
  characters: BuilderCharacterOption[];
  weapons: DnaPickerItem[];
  mods: DnaPickerItem[];
  genimons: DnaPickerItem[];
  /** IDs des armes qui ont un build de Demon Wedges canonique (pour le toggle « inclure »). */
  weaponBuildIds: string[];
};

function asElementKey(value: string | null | undefined): ElementKey | null {
  return value && ELEMENT_KEYS.has(value) ? (value as ElementKey) : null;
}

function itemToPickerItem(item: ItemRecord, locale: string): DnaPickerItem {
  const t = getItemTranslation(item, locale, ["FR", "EN"]);
  const name = t.modName
    ? t.demonWedgeName
      ? `${t.modName} ${t.demonWedgeName}`
      : t.modName
    : `#${item.modId}`;

  const base: DnaPickerItem = {
    id: item.id,
    name,
    icon: item.icon.publicPath ?? item.icon.placeholderPath,
    rarity: item.stats.rarity,
    element: asElementKey(item.affinity.char),
    polarity: item.stats.polarity,
  };

  // Pour les armes, on expose le type (WeaponType_X) et la classe mêlée/distance
  // afin de pouvoir filtrer le picker selon les weaponTags du perso.
  if (item.categoryId === "weapons") {
    const keys = item.typeCompatibility?.textKeys ?? [];
    const typeKey = keys.find((k) => k.startsWith("WeaponType_"));
    base.weaponType = typeKey ? typeKey.replace("WeaponType_", "") : null;
    base.weaponClass = keys.includes("UI_Armory_Meleeweapon") ? "melee" : "ranged";
  }

  return base;
}

function consonanceToPickerItem(character: CharacterRecord): DnaPickerItem | null {
  const weapon = character.consonanceWeapons[0];
  if (!weapon) return null;

  const name = weapon.translations.FR?.name ?? weapon.translations.EN?.name ?? weapon.nameKey ?? `#${weapon.weaponId}`;
  return {
    id: `consonance-${weapon.weaponId}`,
    name,
    icon: weapon.icon.publicPath,
    rarity: weapon.rarity,
    element: asElementKey(character.element.key),
    polarity: null,
  };
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Résout les vrais noms de compétence (slots skill1/2/3) du perso, en matchant
// l'icône du slot avec la compétence du kit (iconName / iconPublicPath normalisé).
function resolveCharacterSkills(character: CharacterRecord, locale: string): Array<{ index: number; name: string }> {
  const set = getCharacterSkills(character.charId);
  if (!set) return [];
  const norm = (s: string) => s.replace(/^.*\//, "").replace(/\.png$/i, "").replace(/^T_/i, "").toLowerCase();
  const skillKey = (sk: (typeof set.skills)[number]) =>
    sk.iconName ? norm(sk.iconName) : sk.iconPublicPath ? norm(sk.iconPublicPath) : null;
  const icons = character.skillIcons;
  const out: Array<{ index: number; name: string }> = [];
  for (const index of [1, 2, 3] as const) {
    const iconPath = index === 1 ? icons.skill1?.publicPath : index === 2 ? icons.skill2?.publicPath : icons.skill3?.publicPath;
    if (!iconPath) continue;
    const key = norm(iconPath);
    const skill = set.skills.find((s) => skillKey(s) === key);
    const loc = skill
      ? skill.translations[locale] ?? skill.translations.EN ?? skill.translations.FR ?? Object.values(skill.translations)[0]
      : null;
    const name = loc?.name;
    if (name) out.push({ index, name });
  }
  return out;
}

function characterToOption(character: CharacterRecord, locale: string): BuilderCharacterOption {
  const translation = character.translations[locale] ?? character.translations.FR ?? character.translations.EN;
  const elements = (character.elements ?? [character.element])
    .map((element) => ({ key: asElementKey(element.key), label: element.label }))
    .filter((element): element is { key: ElementKey; label: string } => element.key !== null);

  const consonanceByElement: Record<string, DnaPickerItem | null> = {};
  for (const element of elements) {
    consonanceByElement[element.key] = consonanceToPickerItem(getActiveCharacterView(character, element.key));
  }

  const name = resolveCharacterDisplayName(character, locale);
  const subtitle = translation?.subtitle ?? null;
  const searchText = normalizeSearchText(
    [
      name,
      subtitle,
      character.internalName,
      character.id,
      character.camp.key,
      ...character.weaponTags,
      ...elements.flatMap((element) => [element.key, element.label]),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return {
    id: character.id,
    slug: getCharacterSlug(character),
    name,
    subtitle,
    portrait: character.portraits.gacha?.publicPath ?? character.portraits.head?.publicPath ?? character.portraits.icon?.publicPath ?? null,
    art: character.portraits.bust?.publicPath ?? character.portraits.gacha?.publicPath ?? null,
    avatar: character.portraits.head?.publicPath ?? character.portraits.icon?.publicPath ?? character.portraits.gacha?.publicPath ?? null,
    skills: resolveCharacterSkills(character, locale),
    element: asElementKey(character.element.key),
    elements,
    weapons: character.weaponTags,
    rarity: character.rarity,
    searchText,
    consonanceByElement,
  };
}

export function getBuilderOptions(locale: string): BuilderOptions {
  const upperLocale = locale.toUpperCase();
  return {
    characters: getAllCharacters().map((character) => characterToOption(character, upperLocale)),
    weapons: getItemsByCategoryId("weapons").map((item) => itemToPickerItem(item, upperLocale)),
    mods: getItemsByCategoryId("mods").map((item) => itemToPickerItem(item, upperLocale)),
    weaponBuildIds: allWeaponBuilds.map((b) => b.weaponId),
    // On n'expose dans le builder que les vrais génimons équipables : ceux du
    // système de leveling (maxLevel 60). Les entrées maxLevel 1 sont des pets
    // d'événement (Monster Rush / Wishen) ou des drones non buildables —
    // l'encyclopédie d'items les garde, mais ils n'ont rien à faire dans un build.
    genimons: getItemsByCategoryId("genimons")
      .filter((item) => item.stats.maxLevel === 60)
      .map((item) => itemToPickerItem(item, upperLocale)),
  };
}
