import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { captureAnalytics } from "@/lib/analytics";

// Points trouvés de la carte (clés `mapId-type-markerId-instanceId`). Ne jamais
// renommer la clé localStorage : c'est là qu'est la progression des visiteurs.
// Le reste de l'état de la carte est dans `@/lib/map/state`.
const markedMarkersStorageAtom = atomWithStorage<string[]>(
  "marked-markers",
  []
);

export const isMenuOpenAtom = atomWithStorage<boolean>("menu-open", false);

// Mode d'affichage des listes : Simplifié (grandes images), Liste (lignes) ou
// Détaillé (cartes avec traductions). Par défaut "detailed" pour les DW/mods,
// "simplified" ailleurs. Enregistré par liste ("characters", "items:<categoryId>",
// "drafts") pour garder ces défauts.
export type ListViewMode = "simplified" | "list" | "detailed";
export const listViewModesAtom = atomWithStorage<Record<string, ListViewMode>>(
  "list-view-modes",
  {},
);

// Filtres de la section Items, par catégorie.
export type PersistedItemsFilters = Record<
  string,
  {
    search: string;
    selectedLanguages: string[];
    rarityFilter: string;
    polarityFilter: string;
    archiveFilter: string;
    newFilter: string;
    itemTypeFilter: string;
    itemSubTypeFilter: string;
    seriesFilter?: string;
    compatFilter?: string;
    calamityFilter?: string;
    sortMode: string;
    pageSize: number;
    currentPage: number;
  }
>;

export const itemsFiltersStorageAtom = atomWithStorage<PersistedItemsFilters>(
  "items-filters",
  {}
);

// Bandeaux d'annonce de l'accueil fermés par le visiteur.
export type PersistedHomeAnnouncements = Record<string, boolean>;

export const dismissedHomeAnnouncementsAtom =
  atomWithStorage<PersistedHomeAnnouncements>("home-dismissed-announcements", {});

export const dismissHomeAnnouncementAtom = atom(
  null,
  (get, set, announcementId: string) => {
    const normalizedAnnouncementId = announcementId.trim();
    if (!normalizedAnnouncementId) {
      return;
    }

    const currentDismissedAnnouncements = get(dismissedHomeAnnouncementsAtom);
    if (currentDismissedAnnouncements[normalizedAnnouncementId]) {
      return;
    }

    set(dismissedHomeAnnouncementsAtom, {
      ...currentDismissedAnnouncements,
      [normalizedAnnouncementId]: true,
    });
  }
);

// Favoris d'items, stockés en tableau et exposés en Set.
const itemsFavoritesStorageAtom = atomWithStorage<string[]>("items-favorites", []);

export const itemsFavoritesAtom = atom(
  (get) => {
    const stored = get(itemsFavoritesStorageAtom);
    return new Set(Array.isArray(stored) ? stored : []);
  },
  (_get, set, newValue: Set<string>) => {
    set(itemsFavoritesStorageAtom, Array.from(newValue));
  }
);

/**
 * L'événement d'analytics part d'ici et pas des quatre boutons qui appellent
 * l'atome (grille, fiche, deux vues compactes) : un seul endroit, rien à
 * oublier sur un nouvel écran.
 *
 * `itemKey` est un identifiant de donnée de jeu, pas une saisie du visiteur.
 */
export const toggleItemFavoriteAtom = atom(
  null,
  (get, set, itemKey: string) => {
    const currentFavorites = get(itemsFavoritesAtom);
    const nextFavorites = new Set(currentFavorites);
    const removing = nextFavorites.has(itemKey);

    if (removing) {
      nextFavorites.delete(itemKey);
    } else {
      nextFavorites.add(itemKey);
    }

    set(itemsFavoritesAtom, nextFavorites);
    captureAnalytics("favorite_toggled", {
      kind: "item",
      action: removing ? "removed" : "added",
      key: itemKey,
      total: nextFavorites.size,
    });
  }
);

export const resetAllItemsFavoritesAtom = atom(null, (_get, set) => {
  set(itemsFavoritesAtom, new Set());
});

// Filtres de la section Personnages.
export type PersistedCharactersFilters = {
  search: string;
  elementFilter: string;
  weaponFilter: string;
  campFilter: string;
  sortMode: string;
  pageSize: number;
  currentPage: number;
};

export const charactersFiltersStorageAtom =
  atomWithStorage<PersistedCharactersFilters>("characters-filters", {
    search: "",
    elementFilter: "all",
    weaponFilter: "all",
    campFilter: "all",
    sortMode: "default",
    pageSize: 24,
    currentPage: 1,
  });

// Filtres de la section Cosmétiques, par catégorie.
export type PersistedCosmeticsFilters = Record<
  string,
  {
    search: string;
    subcategoryFilter: string;
    rarityFilter: string;
    obtainFilter: string;
    characterFilter: string;
    sortMode: string;
    pageSize: number;
    currentPage: number;
  }
>;

export const cosmeticsFiltersStorageAtom = atomWithStorage<PersistedCosmeticsFilters>(
  "cosmetics-filters",
  {},
);

// Favoris des cosmétiques (clé `catégorie/id`)
const cosmeticsFavoritesStorageAtom = atomWithStorage<string[]>("cosmetics-favorites", []);

export const cosmeticsFavoritesAtom = atom(
  (get) => {
    const stored = get(cosmeticsFavoritesStorageAtom);
    return new Set(Array.isArray(stored) ? stored : []);
  },
  (_get, set, newValue: Set<string>) => {
    set(cosmeticsFavoritesStorageAtom, Array.from(newValue));
  },
);

export const toggleCosmeticFavoriteAtom = atom(null, (get, set, cosmeticKey: string) => {
  const nextFavorites = new Set(get(cosmeticsFavoritesAtom));
  const removing = nextFavorites.has(cosmeticKey);
  if (removing) nextFavorites.delete(cosmeticKey);
  else nextFavorites.add(cosmeticKey);
  set(cosmeticsFavoritesAtom, nextFavorites);
  captureAnalytics("favorite_toggled", {
    kind: "cosmetic",
    action: removing ? "removed" : "added",
    key: cosmeticKey,
    total: nextFavorites.size,
  });
});

// Favoris de personnages, stockés en tableau et exposés en Set.
const charactersFavoritesStorageAtom = atomWithStorage<string[]>(
  "characters-favorites",
  [],
);

export const charactersFavoritesAtom = atom(
  (get) => {
    const stored = get(charactersFavoritesStorageAtom);
    return new Set(Array.isArray(stored) ? stored : []);
  },
  (_get, set, newValue: Set<string>) => {
    set(charactersFavoritesStorageAtom, Array.from(newValue));
  },
);

export const toggleCharacterFavoriteAtom = atom(
  null,
  (get, set, characterKey: string) => {
    const currentFavorites = get(charactersFavoritesAtom);
    const nextFavorites = new Set(currentFavorites);
    const removing = nextFavorites.has(characterKey);

    if (removing) {
      nextFavorites.delete(characterKey);
    } else {
      nextFavorites.add(characterKey);
    }

    set(charactersFavoritesAtom, nextFavorites);
    captureAnalytics("favorite_toggled", {
      kind: "character",
      action: removing ? "removed" : "added",
      key: characterKey,
      total: nextFavorites.size,
    });
  },
);

// Points trouvés exposés en Set.
export const markedMarkersAtom = atom(
  (get) => {
    const stored = get(markedMarkersStorageAtom);
    return new Set(Array.isArray(stored) ? stored : []);
  },
  (get, set, newValue: Set<string>) => {
    set(markedMarkersStorageAtom, Array.from(newValue));
  }
);

export const toggleMarkerMarkedAtom = atom(
  null,
  (get, set, markerKey: string) => {
    const currentMarked = get(markedMarkersAtom);
    const newMarked = new Set(currentMarked);

    if (newMarked.has(markerKey)) {
      newMarked.delete(markerKey);
    } else {
      newMarked.add(markerKey);
    }

    set(markedMarkersAtom, newMarked);
  }
);

