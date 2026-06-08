import catalogJson from "@/data/characters/catalog.json";
import charactersJson from "@/data/characters/characters.json";
import levelUpCurvesJson from "@/data/characters/levelup-curves.json";
import skillsJson from "@/data/characters/skills.json";
import type {
  CharacterElement,
  CharacterLocalizedContent,
  CharacterRecord,
  CharacterSkillSet,
  CharactersCatalog,
  LevelUpCurves,
} from "@/lib/characters/types";

const LANGUAGE_LABELS: Record<string, string> = {
  DE: "Deutsch",
  EN: "English",
  ES: "Espanol",
  FR: "Francais",
  JP: "Japanese",
  KR: "Korean",
  TC: "Traditional Chinese",
};

const catalog = catalogJson as CharactersCatalog;
const characters = charactersJson as unknown as CharacterRecord[];
const levelUpCurves = levelUpCurvesJson as unknown as LevelUpCurves;
const skills = skillsJson as unknown as CharacterSkillSet[];
const skillsByCharId = new Map(skills.map((s) => [s.charId, s]));

function slugifyEnglishName(name: string | null | undefined): string | null {
  if (!name) return null;
  // Les protagonistes utilisent un nom-template "{nickname}" résolu côté
  // client avec le pseudo du joueur. Ce template slugifie en "nickname",
  // ce qui collisionne entre plusieurs persos (variantes Lumino/Umbro).
  // → fallback sur character.id pour ces cas.
  if (/^\{[^}]+\}$/.test(name.trim())) return null;
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : null;
}

export function getCharacterSlug(character: CharacterRecord): string {
  return slugifyEnglishName(character.translations?.EN?.name) ?? character.id;
}

// Certains personnages (notamment les formes alternatives du Phoxhunter)
// utilisent un nom-template "{nickname}" dans les data du jeu, parce que le
// jeu y substitue le pseudo du joueur à l'exécution. Hors-jeu, on veut un
// nom marketing stable à afficher dans la liste, la build card, les modales,
// etc. Ce mapping fournit ce fallback par charId.
const DISPLAY_NAME_OVERRIDES: Record<number, Record<string, string> & { default: string }> = {
  1201: { default: "Phoxhunter (Umbro) ♀" },
  120101: { default: "Phoxhunter (Umbro) ♂" },
};

function isNicknameTemplate(name: string | null | undefined): boolean {
  if (!name) return true;
  return /^\{[^}]+\}$/.test(name.trim());
}

/**
 * Retourne un nom d'affichage propre pour un personnage, en remplaçant les
 * templates `{nickname}` du jeu par un nom marketing (ou `internalName` /
 * `id` en dernier recours). Doit être utilisé dans l'UI partout où on
 * affiche `translations?.X?.name` brut.
 */
export function resolveCharacterDisplayName(
  character: CharacterRecord,
  locale: string = "EN",
): string {
  const upperLocale = locale.toUpperCase();
  const raw = character.translations?.[upperLocale]?.name ?? null;
  if (!isNicknameTemplate(raw)) {
    return raw as string;
  }
  const override = DISPLAY_NAME_OVERRIDES[character.charId];
  if (override) {
    return override[upperLocale] ?? override.default;
  }
  return character.internalName ?? character.id;
}

/**
 * Variante qui prend juste le nom brut + un fallback. Utile dans les
 * composants qui n'ont pas accès à l'objet `character` complet (ex. la
 * build card qui itère sur `team[i].characterId`).
 */
export function resolveDisplayName(
  rawName: string | null | undefined,
  fallback: string,
): string {
  if (isNicknameTemplate(rawName)) return fallback;
  return rawName as string;
}

const slugToCharacter = new Map<string, CharacterRecord>();
for (const character of characters) {
  const slug = slugifyEnglishName(character.translations?.EN?.name);
  if (slug && !slugToCharacter.has(slug)) {
    slugToCharacter.set(slug, character);
  }
}

// Anciens identifiants des variantes d'élément du protagoniste, désormais
// fusionnées en un seul record multi-éléments (cf. MULTI_ELEMENT_GROUPS dans
// le générateur). On les redirige vers le record unifié pour ne pas casser les
// liens/bookmarks existants. Les charIds/internalName du membre *primary*
// (1201 / 120101 / Nvzhu02 / Nanzhu02) résolvent déjà nativement via le record.
const LEGACY_ID_ALIASES: Record<string, string> = {
  "char-nvzhu": "char-protagonist-female",
  "char-nvzhu02": "char-protagonist-female",
  nvzhu: "char-protagonist-female",
  "1601": "char-protagonist-female",
  "char-nanzhu": "char-protagonist-male",
  "char-nanzhu02": "char-protagonist-male",
  nanzhu: "char-protagonist-male",
  "160101": "char-protagonist-male",
};

// ---------------------------------------------------------------------------
// Multi-element helpers
// ---------------------------------------------------------------------------

/** Tous les éléments d'un perso (un seul pour les persos mono-élément). */
export function getCharacterElements(character: CharacterRecord): CharacterElement[] {
  return character.elements ?? [character.element];
}

/**
 * Résout la clé d'élément active pour un perso multi-éléments. Accepte une clé
 * (`Dark`) ou un label (`Umbro`). Retombe sur l'élément par défaut du record.
 */
export function resolveActiveElementKey(
  character: CharacterRecord,
  requested?: string | null,
): string {
  if (!character.variants) return character.element.key;
  if (requested) {
    if (character.variants[requested]) return requested;
    const byLabel = getCharacterElements(character).find(
      (e) => e.label.toLowerCase() === requested.toLowerCase(),
    );
    if (byLabel && character.variants[byLabel.key]) return byLabel.key;
  }
  if (character.variants[character.element.key]) return character.element.key;
  return Object.keys(character.variants)[0] ?? character.element.key;
}

function mergeVariantTranslations(
  base: Record<string, CharacterLocalizedContent>,
  variant: Record<string, CharacterLocalizedContent>,
): Record<string, CharacterLocalizedContent> {
  const merged: Record<string, CharacterLocalizedContent> = {};
  for (const [code, t] of Object.entries(base)) {
    const v = variant[code];
    // On garde le nom/sous-titre "marketing" stable du record unifié, mais on
    // prend les effets d'intron spécifiques à l'élément actif.
    merged[code] = v ? { ...t, intronEffects: v.intronEffects } : t;
  }
  return merged;
}

/**
 * Renvoie une vue "aplatie" du perso pour l'élément actif : le record de base
 * avec les champs de la variante choisie écrasés. Pour un perso mono-élément
 * (pas de `variants`), renvoie le record tel quel.
 */
export function getActiveCharacterView(
  character: CharacterRecord,
  elementKey?: string | null,
): CharacterRecord {
  if (!character.variants) return character;
  const key = resolveActiveElementKey(character, elementKey);
  const variant = character.variants[key];
  if (!variant) return character;
  return {
    ...character,
    charId: variant.charId,
    internalName: variant.internalName,
    element: variant.element,
    weaponTags: variant.weaponTags,
    maxLevel: variant.maxLevel,
    baseStats: variant.baseStats,
    addonAttrs: variant.addonAttrs,
    positioning: variant.positioning,
    recommendAttr: variant.recommendAttr,
    ascensionLevels: variant.ascensionLevels,
    intronLevels: variant.intronLevels,
    intronDescriptionKeys: variant.intronDescriptionKeys,
    intronParameters: variant.intronParameters,
    portraits: variant.portraits,
    skillIcons: variant.skillIcons,
    consonanceWeapons: variant.consonanceWeapons,
    translations: mergeVariantTranslations(character.translations, variant.translations),
  };
}

export function getLanguageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code;
}

export function getCharactersCatalog(): CharactersCatalog {
  return catalog;
}

export function getAllCharacters(): CharacterRecord[] {
  return characters;
}

export function getCharacterById(id: string): CharacterRecord | null {
  const normalized = id.trim().toLowerCase();
  const aliasTarget = LEGACY_ID_ALIASES[normalized];
  if (aliasTarget) {
    const aliased = characters.find((c) => c.id.toLowerCase() === aliasTarget);
    if (aliased) return aliased;
  }
  const bySlug = slugToCharacter.get(normalized);
  if (bySlug) return bySlug;
  return (
    characters.find(
      (c) =>
        c.id.toLowerCase() === normalized ||
        `${c.charId}` === id ||
        c.internalName.toLowerCase() === normalized,
    ) ?? null
  );
}

export function isLegacyCharacterId(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return characters.some(
    (c) =>
      c.id.toLowerCase() === normalized ||
      `${c.charId}` === value ||
      c.internalName.toLowerCase() === normalized,
  );
}

export function getCharacterTranslation(
  character: CharacterRecord,
  languageCode: string,
  fallbackLanguages: string[],
): CharacterLocalizedContent {
  const normalized = languageCode.toUpperCase();
  if (character.translations[normalized]) {
    return character.translations[normalized];
  }

  for (const fallback of fallbackLanguages) {
    const normalizedFallback = fallback.toUpperCase();
    if (character.translations[normalizedFallback]) {
      return character.translations[normalizedFallback];
    }
  }

  const firstAvailable = Object.values(character.translations)[0];
  return (
    firstAvailable ?? {
      name: null,
      subtitle: null,
      birthday: null,
      force: null,
      campName: null,
      intronEffects: [],
    }
  );
}

export function normalizeLanguageCodes(
  requested: string[],
  available: string[],
  fallback: string[],
): string[] {
  const availableSet = new Set(available.map((code) => code.toUpperCase()));
  const selected = new Set<string>();

  for (const code of requested) {
    const normalized = code.toUpperCase();
    if (availableSet.has(normalized)) {
      selected.add(normalized);
    }
  }

  if (selected.size === 0) {
    for (const code of fallback) {
      const normalized = code.toUpperCase();
      if (availableSet.has(normalized)) {
        selected.add(normalized);
      }
    }
  }

  if (selected.size === 0 && available.length > 0) {
    selected.add(available[0].toUpperCase());
  }

  return Array.from(selected);
}

export function getLevelUpCurves(): LevelUpCurves {
  return levelUpCurves;
}

export function getStatAtLevel(
  baseStat: number,
  curveName: string,
  level: number,
  curves: LevelUpCurves,
): number {
  const curve = curves.curves[curveName];
  if (!curve) return baseStat;
  const multiplier = curve[level] ?? 1;
  return Math.round(baseStat * multiplier);
}

export function getCharacterSkills(charId: number): CharacterSkillSet | null {
  return skillsByCharId.get(charId) ?? null;
}
