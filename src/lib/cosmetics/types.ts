/**
 * Données des cosmétiques, générées par `research_data/extract-cosmetics.ts`
 * (`bun run extract:cosmetics:site`). Ne pas éditer les JSON à la main.
 */

/** Codes de langue des données du jeu. */
export type GameLang = "FR" | "EN" | "DE" | "ES" | "JP" | "KR" | "TC";
export type LocalizedText = Partial<Record<GameLang, string>>;

export type CosmeticKind =
  | "outfit"
  | "hairstyle"
  | "accessory"
  | "effect"
  | "victoryPose"
  | "weaponSkin"
  | "weaponOrnament"
  | "weaponStance"
  | "mount"
  | "gesture"
  | "dye";

export type ObtainMethod =
  | "banner"
  | "prismExchange"
  | "shop"
  | "event"
  | "battlePass"
  | "starterPack"
  | "impressionShop"
  | "quest"
  | "reputation"
  | "default";

/** Visuels 2D disponibles pour une fiche. */
export type VisualKey = "icon" | "portrait" | "bust" | "wide";
export type CosmeticVisuals = Partial<Record<VisualKey, string>>;

export type ShopOffer = {
  price: number;
  currencyId: number;
  limit: number | null;
  start: string | null;
  end: string | null;
};

export type CosmeticRecord = {
  id: string;
  kind: CosmeticKind;
  /** Slug de catégorie (URL). */
  category: string;
  subcategory: string | null;
  gameId: number;
  rarity: number | null;
  name: LocalizedText;
  description: LocalizedText | null;
  obtain: { methods: ObtainMethod[]; label: LocalizedText | null };
  shop: ShopOffer[];
  duplicateRefund: { currencyId: number; amount: number } | null;
  /** Masqué dans la garde-robe du jeu tant qu'il n'est pas possédé. */
  hiddenUntilOwned: boolean;
  releaseVersion: number | null;
  /** Variantes de couleur d'un même objet (même modèle). */
  variant: { group: string; index: number | null } | null;
  /** Tenues : une déclinaison par personnage. */
  characters: { charId: number; gameId: number; visuals: CosmeticVisuals }[];
  series: string | null;
  banners: number[];
  visuals: CosmeticVisuals;
  /** Chemins des modèles 3D dans les paks : réservés à la future visionneuse. */
  model: { paths: string[] } | null;
};

export type CosmeticCategory = {
  kind: CosmeticKind;
  slug: string;
  count: number;
  tabIcon: string | null;
  sample: string | null;
  subcategories: { id: string; count: number; label: LocalizedText | null }[];
};

export type CosmeticsCatalog = {
  generatedAt: string;
  gameVersion: number;
  categories: CosmeticCategory[];
  currencies: Record<string, { name: LocalizedText | null; icon: string | null }>;
  obtainLabels: Partial<Record<ObtainMethod, LocalizedText | null>>;
  sectionLabel: LocalizedText | null;
};

export type BannerType = "limited" | "rerun" | "standard";

export type BannerPoolEntry = {
  /** `catégorie/id` de la fiche, ou null (monnaie, objet non publié). */
  ref: string | null;
  table: string;
  gameId: number;
  count: number;
  /** Pourcentage au sein de sa rareté, quand le jeu le précise. */
  probability: number | null;
};

export type BannerRecord = {
  id: number;
  type: BannerType;
  typeLabel: LocalizedText | null;
  name: LocalizedText | null;
  start: string | null;
  end: string | null;
  sequence: number;
  tabImage: string | null;
  featured: string | null;
  rates: { star5: number; star4: number; pity: number };
  pools: { star5: BannerPoolEntry[]; star4: BannerPoolEntry[]; star3: BannerPoolEntry[] };
  cumulative: {
    pulls: number;
    rewards: { table: string; gameId: number; count: number; ref: string | null }[];
  }[];
  exchange: { ref: string | null; table: string; gameId: number; price: number; currencyId: number; limit: number | null }[];
  costCurrencyIds: number[];
};
