/**
 * Taxonomie de la carte interactive.
 *
 * Les cartes (`src/data/maps/*.json`) sont relevées chez boarhat et gardent sa
 * légende brute : « Collectibles » déclaré deux fois, `Challenge` / `Challenges`,
 * une catégorie en chinois, et surtout un **type par livre** (≈150 types à un
 * seul point). Plutôt que de retoucher ces fichiers, que le pipeline de mise à
 * jour réécrit, on les normalise ici, au chargement :
 *
 * - chaque type boarhat est rattaché à un **type canonique** (`CanonicalTypeId`)
 *   rangé dans une **catégorie** (onglet du panneau) ;
 * - les types « un point par objet » (lectures, événements, preuves
 *   d'exploration) fusionnent en un seul filtre, le nom d'origine devient le
 *   titre du point ;
 * - les noms de sous-zones (« Inner City », « Lower Ironworks ») cessent d'être
 *   des filtres et deviennent des **étiquettes de lieu**, liées à la sous-carte
 *   quand elle existe.
 *
 * ==La clé d'un point ne change pas== : `mapId-type-markerId-instanceId`, avec le
 * type et l'id **boarhat**. C'est elle que stocke la progression des joueurs ;
 * la dériver du type canonique effacerait tout ce qu'ils ont coché.
 */

import world from "@/data/maps/world.json";
import type { GameMap } from "@/types/map";

// ---------------------------------------------------------------------------
// Catégories et types canoniques
// ---------------------------------------------------------------------------

export const MAP_CATEGORY_IDS = [
  "waypoints",
  "chests",
  "puzzles",
  "exploration",
  "materials",
  "geniemons",
  "quests",
  "readables",
  "others",
] as const;
export type MapCategoryId = (typeof MAP_CATEGORY_IDS)[number];

export interface CanonicalType {
  id: string;
  category: MapCategoryId;
  /**
   * Compte dans la progression d'exploration. Faux pour ce qui réapparaît
   * (ressources, géniemons) ou n'est qu'un service (boutique, pêche, PNJ).
   */
  tracked: boolean;
  /** Ressource du jeu (`RESOURCE_NAME_<id>`) : nom et icône officiels. */
  resourceIds?: number[];
  /** Nom traduit dans `messages/*.json` → `mapTypes.<id>`. */
  messageKey?: string;
}

const T = (
  id: string,
  category: MapCategoryId,
  tracked: boolean,
  extra: Partial<CanonicalType> = {},
): CanonicalType => ({ id, category, tracked, messageKey: id, ...extra });

const R = (id: string, ...resourceIds: number[]): CanonicalType => ({
  id,
  category: "materials",
  tracked: false,
  resourceIds,
});

/** Ordre d'affichage = ordre de déclaration. */
export const CANONICAL_TYPES: CanonicalType[] = [
  // Repères
  T("teleport", "waypoints", true),
  T("nightmareEcho", "waypoints", true),
  T("spiritBirdEcho", "waypoints", true),
  T("caveEntrance", "waypoints", false),
  T("shop", "waypoints", false),
  T("fishingSpot", "waypoints", false),
  // Coffres
  T("storageChest", "chests", true),
  T("treasureMapChest", "chests", true),
  T("monsterChest", "chests", true),
  T("hiddenChest", "chests", true),
  // Énigmes et défis
  T("mechanismPuzzle", "puzzles", true),
  T("parkourChallenge", "puzzles", true),
  T("shootingChallenge", "puzzles", true),
  T("mountChallenge", "puzzles", true),
  // Objets d'exploration
  T("explorerProof", "exploration", true),
  T("greatVoidRune", "exploration", true),
  T("panSpirit", "exploration", true),
  T("musicSegment", "exploration", true),
  T("wanderer", "exploration", true),
  T("shootingRangeTicket", "exploration", true),
  T("camillaDice", "exploration", true),
  // Ressources de récolte (noms officiels via le TextMap)
  R("res-virifly", 4010001),
  R("res-indigofly", 4010002),
  R("res-springWater", 4010003),
  R("res-snowcap", 4010004),
  R("res-phoxichor", 4010005),
  R("res-dewiolet", 4010006),
  R("res-seashell", 4010007),
  R("res-eclipta", 4010008),
  R("res-powerUnit", 4010009),
  R("res-crackbloom", 4010010),
  R("res-bellflower", 4010011),
  R("res-birdEgg", 4010012),
  R("res-caramellus", 4010013),
  R("res-skylily", 4010014),
  R("res-waywardstone", 4010015),
  R("res-brokenRelic", 4010016),
  R("res-loomhopper", 4010017),
  R("res-skink", 4010018),
  R("res-rainseerFrog", 4010019),
  R("res-gritfly", 4010020),
  R("res-ironshellNut", 4020001),
  R("res-goldshellNut", 4020002),
  R("res-silverite", 4020003, 4020004),
  R("res-plopStone", 4020005),
  R("res-coralstone", 4020006),
  // Géniemons
  T("geniemon", "geniemons", false),
  // Quêtes et événements
  T("sideQuest", "quests", true),
  T("specialSideQuest", "quests", true),
  T("eventQuest", "quests", false),
  T("impressionCheck", "quests", true),
  T("dynamicEvent", "quests", true),
  T("npc", "quests", false),
  // Lectures
  T("readable", "readables", true),
];

const TYPE_BY_ID = new Map(CANONICAL_TYPES.map((t) => [t.id, t]));
export const getCanonicalType = (id: string) => TYPE_BY_ID.get(id);

// ---------------------------------------------------------------------------
// Rattachement des types boarhat
// ---------------------------------------------------------------------------

/**
 * Nom boarhat → type canonique. Les ressources sont rapprochées de leur nom
 * officiel par les zones de récolte déclarées dans le jeu (`AccessKey`) : voir
 * `research_data/scripts/map-resource-zones.mjs`. Boarhat nomme parfois deux
 * ressources en une (« Lustrous/Silverstone » = Lumite + Argentite).
 */
const BY_NAME: Record<string, string> = {
  "Teleport Point": "teleport",
  "Nightmare Echo": "nightmareEcho",
  "Echo of the Spirit Bird": "spiritBirdEcho",
  "Cave Entrance": "caveEntrance",
  Shop: "shop",
  "Fishing Spot": "fishingSpot",
  "Storage Chest": "storageChest",
  "Treasure Map Chest": "treasureMapChest",
  "Monster Chest": "monsterChest",
  "Hidden Chest": "hiddenChest",
  "Mechanism Puzzle": "mechanismPuzzle",
  "Parkour Challenge": "parkourChallenge",
  "Shooting Challenge": "shootingChallenge",
  "Mount Challenge": "mountChallenge",
  "Great Void Rune": "greatVoidRune",
  "Pan Spirit": "panSpirit",
  "Music Segment": "musicSegment",
  "Hidden Trail Wanderer": "wanderer",
  "Item-Seeking Wanderer": "wanderer",
  "Shooting Range Ticket": "shootingRangeTicket",
  "Camilla’s Dice": "camillaDice",
  Virifly: "res-virifly",
  Indigofly: "res-indigofly",
  "Spring Water": "res-springWater",
  Snowcap: "res-snowcap",
  "Bottled Lunar Sap": "res-phoxichor",
  Dewioletr: "res-dewiolet",
  Seashell: "res-seashell",
  "Lotus Grass": "res-eclipta",
  "Portable Power Supply Device": "res-powerUnit",
  Crackbloom: "res-crackbloom",
  "Holy Sound Lily": "res-bellflower",
  "Bird Egg": "res-birdEgg",
  "Caramel Mushroom": "res-caramellus",
  "Appeal to the Heavens": "res-skylily",
  "Unyielding Stone": "res-waywardstone",
  "Broken Relic": "res-brokenRelic",
  "Loom Maiden": "res-loomhopper",
  "Rock Skink": "res-skink",
  "Rain-Watching Frog": "res-rainseerFrog",
  "Dustbreath Butterfly": "res-gritfly",
  "Hard Shell Fruit": "res-ironshellNut",
  "Golden Shell Fruit": "res-goldshellNut",
  "Lustrous/Silverstone": "res-silverite",
  Thumpstone: "res-plopStone",
  "Mountain Coral": "res-coralstone",
  "Side Quest": "sideQuest",
  "Special Side Quest": "specialSideQuest",
  "Limited-Time Event Quest": "eventQuest",
  "Impression Check": "impressionCheck",
  NPC: "npc",
};

/**
 * Sous-zones affichées en étiquette. Valeur = carte du site vers laquelle
 * l'étiquette mène, quand elle existe (noms du jeu : « Valley Rift » = Faille de
 * la vallée = `arcanorift`).
 */
const PLACE_TARGETS: Record<string, string | null> = {
  "Lower Ironworks": "ironworks",
  "Upper Ironworks": "bloomfield-station",
  "Taixu Mausoleum": "taixu-mausoleum",
  "Mount Arcano": "mountarcano",
  "Old Site of Arcano Town": "arcanoruins",
  "Valley Rift": "arcanorift",
  "Galeia Opera House": "galea-theater",
};

const isReadableCategory = (type: string) =>
  /^(Readables|Reading Material)/i.test(type) || /阅读物/.test(type);
const isDispatchCategory = (type: string) => /Dispatch/i.test(type);
const isExplorerProof = (name: string) =>
  /^(Explorer|Exploration)/i.test(name) &&
  /(Proof|Certificate|Record|Token)/i.test(name);

type Classification =
  | { kind: "type"; typeId: string; merged: boolean }
  | { kind: "place"; target: string | null }
  | { kind: "unknown" };

function classify(categoryType: string, name: string): Classification {
  if (isReadableCategory(categoryType)) return { kind: "type", typeId: "readable", merged: true };
  if (isDispatchCategory(categoryType)) return { kind: "type", typeId: "dynamicEvent", merged: true };
  if (/^Geniemon/i.test(categoryType)) return { kind: "type", typeId: "geniemon", merged: false };
  // Fusionnées sans titre : toutes les preuves d'une zone portent le même nom,
  // le répéter sur chaque point n'apprendrait rien.
  if (isExplorerProof(name)) return { kind: "type", typeId: "explorerProof", merged: false };
  const typeId = BY_NAME[name];
  if (typeId) return { kind: "type", typeId, merged: false };
  if (/^Landmarks?$/i.test(categoryType))
    return { kind: "place", target: PLACE_TARGETS[name] ?? null };
  return { kind: "unknown" };
}

// ---------------------------------------------------------------------------
// Carte normalisée
// ---------------------------------------------------------------------------

export interface MapPoint {
  /** Clé de progression, identique à l'ancienne (voir en-tête). */
  key: string;
  x: number;
  y: number;
  /** Nom propre du point pour les types fusionnés (titre du livre, de l'événement). */
  title?: string;
  image?: string;
}

export interface MapTypeGroup {
  /** Id canonique, ou `raw:<nom>` pour un type boarhat encore inconnu. */
  id: string;
  category: MapCategoryId;
  tracked: boolean;
  icon: string;
  /** Clé `mapTypes.*` à traduire, sinon `rawName` tel quel. */
  messageKey?: string;
  resourceIds?: number[];
  rawName: string;
  points: MapPoint[];
}

export interface MapPlace {
  /** Titre boarhat (anglais), clé de rapprochement. */
  title: string;
  /** Nom officiel du jeu en 7 langues, quand on l'a rapproché. */
  name: Record<string, string> | null;
  x: number;
  y: number;
  targetMapId: string | null;
}

export interface NormalizedMap {
  id: string;
  image: string;
  imageSize: { width: number; height: number };
  types: MapTypeGroup[];
  places: MapPlace[];
}

type WorldJson = typeof world;
const PLACE_NAMES = (world as WorldJson).places as Record<string, Record<string, string>>;
const RESOURCES = (world as WorldJson).resources as Record<
  string,
  { name: Record<string, string>; icon: string | null }
>;

/** Icône officielle d'un type de ressource (celle du jeu, servie en local). */
export function resourceIcon(resourceIds?: number[]): string | undefined {
  const id = resourceIds?.[0];
  return id ? (RESOURCES[id]?.icon ?? undefined) : undefined;
}

/** Nom officiel d'une ressource dans la langue demandée. */
export function resourceName(resourceIds: number[], locale: string): string {
  return resourceIds
    .map((id) => RESOURCES[id]?.name[locale] ?? RESOURCES[id]?.name.en)
    .filter(Boolean)
    .join(" / ");
}

const ORDER = new Map(CANONICAL_TYPES.map((t, i) => [t.id, i]));

export function normalizeMap(map: GameMap): NormalizedMap {
  const groups = new Map<string, MapTypeGroup>();
  const places: MapPlace[] = [];

  for (const category of map.legend) {
    for (const markerType of category.markers) {
      const c = classify(category.type, markerType.name);
      const toPoint = (inst: (typeof markerType.markers)[number], title?: string): MapPoint => ({
        key: `${map.id}-${category.type}-${markerType.id}-${inst.id}`,
        x: inst.position.x,
        y: inst.position.y,
        ...(title ? { title } : {}),
        ...(inst.image ? { image: inst.image } : {}),
      });

      if (c.kind === "place") {
        for (const inst of markerType.markers ?? [])
          places.push({
            title: markerType.name,
            name: PLACE_NAMES[markerType.name] ?? null,
            x: inst.position.x,
            y: inst.position.y,
            targetMapId: c.target,
          });
        continue;
      }

      const canonical = c.kind === "type" ? TYPE_BY_ID.get(c.typeId) : undefined;
      const id = canonical?.id ?? `raw:${markerType.name}`;
      let group = groups.get(id);
      if (!group) {
        group = {
          id,
          category: canonical?.category ?? "others",
          tracked: canonical?.tracked ?? true,
          icon: resourceIcon(canonical?.resourceIds) ?? markerType.icon,
          messageKey: canonical?.messageKey,
          resourceIds: canonical?.resourceIds,
          rawName: markerType.name,
          points: [],
        };
        groups.set(id, group);
      }
      const merged = c.kind === "type" && c.merged;
      for (const inst of markerType.markers ?? [])
        group.points.push(toPoint(inst, merged ? markerType.name : undefined));
    }
  }

  // Un point boarhat peut apparaître deux fois (même id déclaré dans deux
  // blocs « Collectibles ») : on dédoublonne par clé.
  for (const group of groups.values()) {
    const seen = new Set<string>();
    group.points = group.points.filter((p) => (seen.has(p.key) ? false : (seen.add(p.key), true)));
  }

  return {
    id: map.id,
    image: map.image,
    imageSize: map.imageSize,
    types: [...groups.values()].sort(
      (a, b) => (ORDER.get(a.id) ?? 999) - (ORDER.get(b.id) ?? 999) || a.rawName.localeCompare(b.rawName),
    ),
    places,
  };
}
