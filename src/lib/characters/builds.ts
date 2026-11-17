import { allBuilds } from "@/data/characters/builds";
import { getItemByCategoryAndId, getItemTranslation } from "@/lib/items/catalog";
import {
  getCharacterById,
  getCharacterSlug,
  getCharacterTranslation,
  resolveDisplayName,
} from "@/lib/characters/catalog";
import { getGenimonPassive, type GenimonPassive } from "@/lib/genimons/passive";
import {
  genimonTraitSlots,
  resolveBuildTrait,
  sanitizeTraitKeys,
  type BuildGenimonTrait,
} from "@/lib/genimons/build-traits";
import type { ItemRecord } from "@/lib/items/types";
import type { CharacterRecord } from "@/lib/characters/types";

// ---------------------------------------------------------------------------
// Types bruts (le contenu des JSON de builds)
// ---------------------------------------------------------------------------

interface RawLocalizedText {
  [lang: string]: string;
}

interface RawWeaponEntry {
  itemId: string;
  rank: "best" | "alternative";
  note?: RawLocalizedText;
  /** Inclure/afficher le build de Demon Wedges canonique de cette arme. */
  withWedges?: boolean;
  /**
   * Armes de calamité seulement : ordre conseillé dans l'arbre de Potentiel, par
   * id de nœud.
   *
   * Tout finit par être pris (le nœud du palier 5 exige les deux du palier 4), on
   * ne choisit que l'ordre. Il compte parce qu'aux paliers I à IV le premier
   * Potentiel pris est gratuit et l'autre coûte des matériaux : le chemin conseillé
   * dit lequel prendre gratuitement à chaque palier.
   */
  potentialOrder?: number[];
}

interface RawDemonWedgeSlot {
  position: number;
  itemId: string;
  track?: number | null;
}

interface RawDemonWedgesConfig {
  slots: RawDemonWedgeSlot[];
  centerItemId?: string;
  /**
   * Piste du centre, le slot 09 de l'armurerie, qui s'ajuste comme les huit
   * autres. Même règle que `track` sur un slot : la valeur est la polarité de la
   * pièce centrale, `null` veut dire pas de module posé.
   */
  centerTrack?: number | null;
  affinity?: RawLocalizedText;
  note?: RawLocalizedText;
}

interface RawTeamEntry {
  characterId: string;
  role: string;
  note?: RawLocalizedText;
}

interface RawGenimonEntry {
  itemId: string;
  rank: "best" | "alternative";
  /**
   * Traits à viser sur ce Géniemon, par clé (`data/genimons/traits.json`).
   *
   * L'ordre est une priorité de farm : le jeu ne fixe pas quel Trait va dans
   * quelle sphère. Le nombre dépend de la créature, trois pour une variante
   * ordinaire, quatre pour une scintillante.
   */
  traits?: string[];
}

interface RawSkillPriority {
  skillName: RawLocalizedText;
  skillIndex?: number;
  priority: number;
  note?: RawLocalizedText;
}

interface RawCharacterBuild {
  characterId: string;
  /** Build remplacé par la recommandation actuelle : gardé, mais signalé et rangé en dernier. */
  legacy?: boolean;
  // Élément du build pour les persos multi-éléments (clé : "Dark", "Light"…).
  // Absent = build valable pour tous les éléments (persos mono-élément).
  element?: string;
  buildName: RawLocalizedText;
  weapons?: {
    melee?: RawWeaponEntry[];
    ranged?: RawWeaponEntry[];
  };
  demonWedges?: RawDemonWedgesConfig;
  statsPriority?: string[];
  team?: RawTeamEntry[];
  genimon?: RawGenimonEntry[];
  skillPriority?: RawSkillPriority[];
  consonanceWeapon?: {
    name: RawLocalizedText;
    icon?: string;
    slots: string[];
  };
  notes?: RawLocalizedText;
}

// ---------------------------------------------------------------------------
// Types résolus (ce que lisent les composants)
// ---------------------------------------------------------------------------

export interface ResolvedItemRef {
  itemId: string;
  modId: number;
  name: string;
  /**
   * Nom de la pièce sans la famille de Demon Wedge : « Ardeur » quand `name` vaut
   * « Ardeur du Phénix ». Pour les affichages serrés (carte de build) où l'icône
   * montre déjà la famille.
   */
  shortName: string;
  description: string | null;
  icon: string;
  href: string;
  rarity: number | null;
  element: string | null;
  polarity: number | null;
}

export interface ResolvedCharacterRef {
  characterId: string;
  name: string;
  portrait: string | null;
  href: string;
  element: { key: string; label: string };
}

export interface BuildWeaponEntry {
  item: ResolvedItemRef | null;
  rank: "best" | "alternative";
  note: RawLocalizedText;
  withWedges: boolean;
  /**
   * Demon Wedges de cette arme dans ce build (builds communautaires), résolus pour
   * l'affichage. Sans lien avec le build canonique de la fiche arme.
   */
  demonWedges?: { slots: BuildDemonWedgeSlot[]; affinityElement: string | null } | null;
  /** Ordre d'investissement conseillé dans l'arbre de Potentiel (armes de calamité). */
  potentialOrder: number[] | null;
}

export interface BuildDemonWedgeSlot {
  position: number;
  item: ResolvedItemRef | null;
  track: number | null;
}

export interface BuildDemonWedgesConfig {
  slots: BuildDemonWedgeSlot[];
  centerItem: ResolvedItemRef | null;
  /** Piste du centre (slot 09) : polarité de la pièce, ou `null` sans module. */
  centerTrack: number | null;
  affinity: RawLocalizedText;
  note: RawLocalizedText;
}

export interface BuildTeamEntry {
  character: ResolvedCharacterRef | null;
  role: string;
  note: RawLocalizedText;
}

export interface BuildGenimonEntry {
  item: ResolvedItemRef | null;
  rank: "best" | "alternative";
  /** Traits visés, déjà traduits et nettoyés de l'inconnu. */
  traits: BuildGenimonTrait[];
  /** Emplacements qu'ouvre cette créature : 4 pour une scintillante, 3 sinon. */
  traitSlots: number;
  /** Son passif au palier max, c'est pour lui qu'on la choisit. */
  passive: GenimonPassive | null;
}

export interface BuildSkillPriority {
  skillName: RawLocalizedText;
  skillIndex?: number;
  priority: number;
  note: RawLocalizedText;
}

export interface CharacterBuild {
  characterId: string;
  /** Vrai pour un build que la recommandation actuelle a remplacé. */
  legacy: boolean;
  element: string | null;
  buildName: RawLocalizedText;
  weapons: {
    melee: BuildWeaponEntry[];
    ranged: BuildWeaponEntry[];
  };
  demonWedges: BuildDemonWedgesConfig;
  statsPriority: string[];
  team: BuildTeamEntry[];
  genimon: BuildGenimonEntry[];
  skillPriority: BuildSkillPriority[];
  consonanceWeapon: {
    name: RawLocalizedText;
    icon: string | null;
    slots: ResolvedItemRef[];
  } | null;
  notes: RawLocalizedText;
}

// ---------------------------------------------------------------------------
// Résolution
// ---------------------------------------------------------------------------

const FALLBACK_LANGS = ["FR", "EN"];

/** Retire les balises rich-text du jeu (<H>, </>, <color=…>…), qui ne sont que de la mise en forme. */
function stripGameRichText(text: string): string {
  return text.replace(/<\/?[A-Za-z][^>]*>|<\/>/g, "");
}

function formatEffectNumber(value: number): string {
  if (!Number.isFinite(value)) return `${value}`;
  return Number.isInteger(value) ? `${value}` : `${+value.toFixed(2)}`;
}

/**
 * Texte d'effet, comme sur la fiche item : on retire les balises <H>…</> et on
 * remplace les #N par leur valeur au niveau max (scaling.valuesByLevel). Sans
 * valeurs (mods sans scaling), on nettoie juste les balises ; un #N sans valeur
 * connue reste tel quel.
 */
function formatEffectDescription(
  item: ItemRecord,
  rawText: string | null | undefined,
): string | null {
  if (!rawText) return null;
  const text = stripGameRichText(rawText);
  const values = item.scaling?.valuesByLevel;
  if (!values || !/#\d/.test(text)) return text;
  const levelKeys = Object.keys(values);
  const maxKey =
    item.scaling.maxLevel != null && values[String(item.scaling.maxLevel)]
      ? String(item.scaling.maxLevel)
      : levelKeys.reduce((a, b) => (Number(b) > Number(a) ? b : a), levelKeys[0] ?? "0");
  const byIndex = values[maxKey] ?? {};
  return text.replace(/#(\d+)/g, (full, idx: string) =>
    byIndex[idx] !== undefined ? formatEffectNumber(byIndex[idx]) : full,
  );
}

export function resolveBuildItemRef(
  categoryId: string,
  itemId: string,
  lang: string = "FR",
): ResolvedItemRef | null {
  const item: ItemRecord | null = getItemByCategoryAndId(categoryId, itemId);
  if (!item) return null;

  const translation = getItemTranslation(item, lang, FALLBACK_LANGS);
  // 11 mods sur 829 n'ont pas de libellé traduit et sortent la clé brute
  // (« MOD_NAME_2801 ») : on retombe alors sur l'identifiant numérique.
  const rawModName =
    translation.modName && !/^MOD_(NAME|DES)_\d+$/.test(translation.modName)
      ? translation.modName
      : null;
  const shortName = rawModName ?? `#${item.modId}`;
  const name = rawModName
    ? translation.demonWedgeName
      ? `${rawModName} ${translation.demonWedgeName}`
      : rawModName
    : `#${item.modId}`;

  return {
    itemId: item.id,
    modId: item.modId,
    name,
    shortName,
    description: formatEffectDescription(
      item,
      translation.passiveEffectsDescription ?? translation.description,
    ),
    icon: item.icon.publicPath ?? item.icon.placeholderPath ?? "/marker-default.svg",
    href: `/items/${categoryId}/${item.id}`,
    rarity: item.stats.rarity,
    element: item.affinity?.char ?? null,
    polarity: item.stats.polarity ?? null,
  };
}

export function resolveBuildCharacterRef(
  characterId: string,
  lang: string = "FR",
): ResolvedCharacterRef | null {
  const character: CharacterRecord | null = getCharacterById(characterId);
  if (!character) return null;

  const translation = getCharacterTranslation(character, lang, FALLBACK_LANGS);

  // Les protagonistes Umbro (Nvzhu02, Nanzhu02) ont translation.name =
  // "{nickname}" : on retombe sur le nom marketing (cf. DISPLAY_NAME_OVERRIDES).
  const displayName = resolveDisplayName(
    translation.name,
    DISPLAY_NAME_OVERRIDES_BY_CHARID[character.charId] ?? character.internalName,
  );

  return {
    characterId: character.id,
    name: displayName,
    portrait: character.portraits.head?.publicPath ?? null,
    href: `/characters/${getCharacterSlug(character)}`,
    element: character.element,
  };
}

// Copie de DISPLAY_NAME_OVERRIDES (catalog.ts), pour éviter une dépendance
// circulaire. À fusionner si on déplace l'API dans un module partagé.
const DISPLAY_NAME_OVERRIDES_BY_CHARID: Record<number, string> = {
  1201: "Phoxhunter (Umbro) ♀",
  120101: "Phoxhunter (Umbro) ♂",
};

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

const rawBuilds = allBuilds as unknown as RawCharacterBuild[];

export function getCharacterBuilds(
  characterId: string,
  lang: string = "FR",
): CharacterBuild[] {
  return rawBuilds
    .filter((b) => b.characterId === characterId)
    .map((raw) => ({
      characterId: raw.characterId,
      legacy: raw.legacy === true,
      element: raw.element ?? null,
      buildName: raw.buildName ?? {},
      weapons: {
        melee: (raw.weapons?.melee ?? []).map((w) => ({
          item: resolveBuildItemRef("weapons", w.itemId, lang),
          rank: w.rank,
          note: w.note ?? {},
          withWedges: w.withWedges ?? false,
          potentialOrder: w.potentialOrder ?? null,
        })),
        ranged: (raw.weapons?.ranged ?? []).map((w) => ({
          item: resolveBuildItemRef("weapons", w.itemId, lang),
          rank: w.rank,
          note: w.note ?? {},
          withWedges: w.withWedges ?? false,
          potentialOrder: w.potentialOrder ?? null,
        })),
      },
      demonWedges: {
        slots: (raw.demonWedges?.slots ?? []).map((s) => ({
          position: s.position,
          item: resolveBuildItemRef("mods", s.itemId, lang),
          track: s.track ?? null,
        })),
        centerItem: raw.demonWedges?.centerItemId
          ? resolveBuildItemRef("mods", raw.demonWedges.centerItemId, lang)
          : null,
        centerTrack: raw.demonWedges?.centerTrack ?? null,
        affinity: raw.demonWedges?.affinity ?? {},
        note: raw.demonWedges?.note ?? {},
      },
      statsPriority: raw.statsPriority ?? [],
      team: (raw.team ?? []).map((t) => ({
        character: resolveBuildCharacterRef(t.characterId, lang),
        role: t.role,
        note: t.note ?? {},
      })),
      genimon: (raw.genimon ?? []).map((g) => ({
        item: resolveBuildItemRef("genimons", g.itemId, lang),
        rank: g.rank,
        traitSlots: genimonTraitSlots(g.itemId),
        passive: getGenimonPassive(g.itemId, lang),
        // `sanitize` avant de résoudre : un build peut venir d'une version où
        // un Trait existait encore, ou porter plus de clés que d'emplacements.
        traits: sanitizeTraitKeys(g.itemId, g.traits)
          .map((key) => resolveBuildTrait(key, lang))
          .filter((t): t is BuildGenimonTrait => t !== null),
      })),
      skillPriority: (raw.skillPriority ?? []).map((s) => ({
        skillName: s.skillName ?? {},
        skillIndex: s.skillIndex,
        priority: s.priority,
        note: s.note ?? {},
      })),
      consonanceWeapon: raw.consonanceWeapon
        ? {
            name: raw.consonanceWeapon.name ?? {},
            icon: raw.consonanceWeapon.icon ?? null,
            slots: (raw.consonanceWeapon.slots ?? [])
              .map((itemId) => resolveBuildItemRef("mods", itemId, lang))
              .filter((ref): ref is ResolvedItemRef => ref !== null),
          }
        : null,
      notes: raw.notes ?? {},
    }))
    // Les anciens builds restent consultables mais passent après les actuels :
    // le premier de la liste s'ouvre par défaut.
    .sort((a, b) => Number(a.legacy) - Number(b.legacy));
}

// ---------------------------------------------------------------------------
// Assets de l'armurerie : déplacés dans `build-assets.ts`, réexportés ici.
// ---------------------------------------------------------------------------

export {
  getArmoryCircle,
  getArmoryLine,
  getArmoryCorner,
  getElementIcon,
  ARMORY_DEFAULT_ICON,
  ARMORY_MOD_GLOW,
  getTrackIcon,
  TRACK_SHIFT_ICON,
} from "@/lib/characters/build-assets";
