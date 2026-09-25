import type { MapTypeGroup, NormalizedMap } from "./taxonomy";

export interface Progress {
  found: number;
  total: number;
}

export const percent = ({ found, total }: Progress) =>
  total === 0 ? 0 : Math.floor((found / total) * 100);

/** Pourcentage formaté selon la langue (« 30 % » en français, « 30% » en anglais). */
export const formatPercent = (value: number, locale: string) =>
  new Intl.NumberFormat(locale === "jp" ? "ja" : locale === "kr" ? "ko" : locale === "tc" ? "zh-Hant" : locale, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);

export function typeProgress(group: MapTypeGroup, marked: ReadonlySet<string>): Progress {
  let found = 0;
  for (const p of group.points) if (marked.has(p.key)) found++;
  return { found, total: group.points.length };
}

/**
 * Exploration d'une carte : seuls les types `tracked` comptent. Les ressources
 * et géniemons réapparaissent, les boutiques ne se « trouvent » pas : les
 * inclure rendrait le pourcentage inatteignable ou dénué de sens.
 */
export function mapProgress(map: NormalizedMap, marked: ReadonlySet<string>): Progress {
  let found = 0;
  let total = 0;
  for (const group of map.types) {
    if (!group.tracked) continue;
    const p = typeProgress(group, marked);
    found += p.found;
    total += p.total;
  }
  return { found, total };
}
