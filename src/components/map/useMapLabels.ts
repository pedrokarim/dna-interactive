"use client";

import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { resourceName, type MapCategoryId, type MapTypeGroup } from "@/lib/map/taxonomy";
import { getMapLocation, localized, type LocalizedName } from "@/lib/map/world";

/** Libellés traduits de la carte : types, catégories, noms de zones. */
export function useMapLabels() {
  const locale = useLocale();
  const tTypes = useTranslations("mapTypes");
  const tCategories = useTranslations("mapCategories");

  const typeName = useCallback(
    (group: Pick<MapTypeGroup, "messageKey" | "resourceIds" | "rawName">) => {
      if (group.resourceIds?.length) return resourceName(group.resourceIds, locale);
      if (group.messageKey && tTypes.has(group.messageKey)) return tTypes(group.messageKey);
      return group.rawName;
    },
    [locale, tTypes],
  );

  const categoryName = useCallback((id: MapCategoryId) => tCategories(id), [tCategories]);

  const name = useCallback((n: LocalizedName) => localized(n, locale), [locale]);

  const mapName = useCallback(
    (mapId: string) => {
      const loc = getMapLocation(mapId);
      return loc ? localized(loc.map.name, locale) : mapId;
    },
    [locale],
  );

  return { locale, typeName, categoryName, name, mapName };
}
