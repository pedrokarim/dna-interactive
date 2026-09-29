import {
  currencyView,
  getBanner,
  getBanners,
  getCosmeticByRef,
  pickText,
  resolveBannerEntry,
  type BannerEntryView,
} from "@/lib/cosmetics/catalog";
import type { BannerRecord, BannerType, CosmeticVisuals } from "@/lib/cosmetics/types";

export type BannerSummaryView = {
  id: number;
  name: string;
  type: BannerType;
  typeLabel: string | null;
  start: string | null;
  end: string | null;
  image: string | null;
  featured: { href: string; name: string; visuals: CosmeticVisuals } | null;
};

export type BannerDetailView = BannerSummaryView & {
  rates: BannerRecord["rates"];
  pools: { star5: BannerEntryView[]; star4: BannerEntryView[]; star3: BannerEntryView[] };
  cumulative: { pulls: number; rewards: BannerEntryView[] }[];
  exchange: (BannerEntryView & { price: number; currency: { name: string; icon: string | null }; limit: number | null })[];
  costCurrencies: { name: string; icon: string | null }[];
};

function summarize(banner: BannerRecord, lang: string): BannerSummaryView {
  const featured = getCosmeticByRef(banner.featured);
  return {
    id: banner.id,
    name: pickText(banner.name, lang) ?? String(banner.id),
    type: banner.type,
    typeLabel: pickText(banner.typeLabel, lang),
    start: banner.start,
    end: banner.end,
    image: banner.tabImage,
    featured: featured
      ? {
          href: `/cosmetics/${featured.category}/${featured.id}`,
          name: pickText(featured.name, lang) ?? featured.id,
          visuals: featured.visuals,
        }
      : null,
  };
}

/** Toutes les bannières, la plus récente d'abord ; la permanente en tête. */
export function getBannerSummaries(lang: string): BannerSummaryView[] {
  return getBanners()
    .map((banner) => summarize(banner, lang))
    .sort((a, b) => {
      if (a.type === "standard") return -1;
      if (b.type === "standard") return 1;
      return (b.start ?? "").localeCompare(a.start ?? "");
    });
}

export function getBannerDetail(id: number, lang: string): BannerDetailView | null {
  const banner = getBanner(id);
  if (!banner) return null;
  return {
    ...summarize(banner, lang),
    rates: banner.rates,
    pools: {
      star5: banner.pools.star5.map((entry) => resolveBannerEntry(entry, lang)),
      star4: banner.pools.star4.map((entry) => resolveBannerEntry(entry, lang)),
      star3: banner.pools.star3.map((entry) => resolveBannerEntry(entry, lang)),
    },
    cumulative: banner.cumulative.map((step) => ({
      pulls: step.pulls,
      rewards: step.rewards.map((reward) => resolveBannerEntry(reward, lang)),
    })),
    exchange: banner.exchange.map((item) => ({
      ...resolveBannerEntry({ ...item, count: 1 }, lang),
      price: item.price,
      currency: currencyView(item.currencyId, lang),
      limit: item.limit,
    })),
    costCurrencies: banner.costCurrencyIds.map((id) => currencyView(id, lang)),
  };
}
