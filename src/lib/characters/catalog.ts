import catalogJson from "@/data/characters/catalog.json";
import charactersJson from "@/data/characters/characters.json";
import levelUpCurvesJson from "@/data/characters/levelup-curves.json";
import type {
  CharacterLocalizedContent,
  CharacterRecord,
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
  return (
    characters.find(
      (c) =>
        c.id.toLowerCase() === normalized ||
        `${c.charId}` === id ||
        c.internalName.toLowerCase() === normalized,
    ) ?? null
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
