import {
  currencyView,
  getBanner,
  getCosmeticCategory,
  getCosmeticVariants,
  pickText,
  resolveCharacterRef,
  subcategoryLabel,
  type CosmeticCharacterRef,
} from "@/lib/cosmetics/catalog";
import type { BannerType, CosmeticRecord, CosmeticVisuals, ObtainMethod } from "@/lib/cosmetics/types";

/**
 * Vue d'une fiche cosmétique, résolue côté serveur dans la langue du site :
 * le navigateur ne reçoit ni les 7 langues ni les tables voisines.
 */
export type CosmeticDetailView = {
  id: string;
  category: string;
  subcategory: string | null;
  subcategoryLabel: string | null;
  gameId: number;
  rarity: number | null;
  name: string;
  description: string | null;
  obtain: ObtainMethod[];
  obtainNote: string | null;
  hiddenUntilOwned: boolean;
  releaseVersion: string | null;
  visuals: CosmeticVisuals;
  /** Le jeu fournit un modèle 3D : l'emplacement de la visionneuse est réservé. */
  has3dModel: boolean;
  shop: { price: number; currency: { name: string; icon: string | null }; limit: number | null; end: string | null }[];
  refund: { amount: number; currency: { name: string; icon: string | null } } | null;
  variants: { id: string; name: string; icon: string | null; rarity: number | null; current: boolean }[];
  characters: (CosmeticCharacterRef & { visuals: CosmeticVisuals })[];
  banners: { id: number; name: string; type: BannerType; typeLabel: string | null; start: string | null; end: string | null; image: string | null }[];
};

const formatVersion = (version: number | null) => (version ? `${Math.floor(version / 100)}.${Math.floor((version % 100) / 10)}` : null);

export function buildCosmeticDetailView(item: CosmeticRecord, lang: string): CosmeticDetailView {
  const category = getCosmeticCategory(item.category);
  const variants = getCosmeticVariants(item);
  return {
    id: item.id,
    category: item.category,
    subcategory: item.subcategory,
    subcategoryLabel: category && item.subcategory ? subcategoryLabel(category, item.subcategory, lang) : null,
    gameId: item.gameId,
    rarity: item.rarity,
    name: pickText(item.name, lang) ?? String(item.gameId),
    description: pickText(item.description, lang),
    obtain: item.obtain.methods,
    obtainNote: pickText(item.obtain.label, lang),
    hiddenUntilOwned: item.hiddenUntilOwned,
    releaseVersion: formatVersion(item.releaseVersion),
    visuals: item.visuals,
    has3dModel: Boolean(item.model?.paths.length),
    shop: item.shop.map((offer) => ({
      price: offer.price,
      currency: currencyView(offer.currencyId, lang),
      limit: offer.limit,
      end: offer.end,
    })),
    refund: item.duplicateRefund
      ? { amount: item.duplicateRefund.amount, currency: currencyView(item.duplicateRefund.currencyId, lang) }
      : null,
    variants:
      variants.length > 1
        ? variants.map((variant) => ({
            id: variant.id,
            name: pickText(variant.name, lang) ?? variant.id,
            icon: variant.visuals.icon ?? null,
            rarity: variant.rarity,
            current: variant.id === item.id,
          }))
        : [],
    characters: item.characters
      .map((character) => {
        const ref = resolveCharacterRef(character.charId, lang);
        return ref ? { ...ref, visuals: character.visuals } : null;
      })
      .filter((character): character is CosmeticCharacterRef & { visuals: CosmeticVisuals } => character !== null),
    banners: item.banners
      .map((bannerId) => getBanner(bannerId))
      .filter((banner) => banner !== null)
      .map((banner) => ({
        id: banner.id,
        name: pickText(banner.name, lang) ?? String(banner.id),
        type: banner.type,
        typeLabel: pickText(banner.typeLabel, lang),
        start: banner.start,
        end: banner.end,
        image: banner.tabImage,
      })),
  };
}
