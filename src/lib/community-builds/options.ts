import { getAllCharacters, getActiveCharacterView, getCharacterSlug, resolveCharacterDisplayName } from "@/lib/characters/catalog";
import { getItemTranslation, getItemsByCategoryId } from "@/lib/items/catalog";
import type { CharacterRecord } from "@/lib/characters/types";
import type { ItemRecord } from "@/lib/items/types";
import type { DnaPickerItem } from "@/components/dna/ItemPicker";
import type { ElementKey } from "@/components/dna/elements";

const ELEMENT_KEYS = new Set(["Fire", "Water", "Thunder", "Wind", "Light", "Dark"]);

export type BuilderCharacterOption = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  portrait: string | null;
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

  return {
    id: item.id,
    name,
    icon: item.icon.publicPath ?? item.icon.placeholderPath,
    rarity: item.stats.rarity,
    element: asElementKey(item.affinity.char),
    polarity: item.stats.polarity,
  };
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
    genimons: getItemsByCategoryId("genimons").map((item) => itemToPickerItem(item, upperLocale)),
  };
}
