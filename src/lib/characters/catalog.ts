import catalogJson from "@/data/characters/catalog.json";
import charactersJson from "@/data/characters/characters.json";
import levelUpCurvesJson from "@/data/characters/levelup-curves.json";
import skillsJson from "@/data/characters/skills.json";
import type {
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
