"use client";

import { useMemo } from "react";
import type { BannerSummaryView } from "@/lib/cosmetics/banners";
import { bannerStatus, useNow, type BannerStatus } from "@/lib/cosmetics/format";
import BannerCard from "./BannerCard";

const STATUS_RANK: Record<BannerStatus, number> = { current: 0, upcoming: 1, permanent: 2, ended: 3 };

/**
 * Bannières mises en avant : celles en cours d'abord, selon l'heure du
 * visiteur. Avant le montage (rendu serveur), l'ordre des données sert
 * d'ordre de repli : aucune date n'est comparée pendant le rendu.
 */
export default function BannersShowcase({ banners, limit = 3 }: { banners: BannerSummaryView[]; limit?: number }) {
  const now = useNow();
  const shown = useMemo(() => {
    if (!now) return banners.slice(0, limit);
    const ranked = banners
      .map((banner) => ({ banner, status: bannerStatus(banner.start, banner.end, now) }))
      .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || (b.banner.start ?? "").localeCompare(a.banner.start ?? ""));
    return ranked.slice(0, limit).map((entry) => entry.banner);
  }, [banners, now, limit]);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {shown.map((banner) => (
        <BannerCard key={banner.id} banner={banner} />
      ))}
    </div>
  );
}
