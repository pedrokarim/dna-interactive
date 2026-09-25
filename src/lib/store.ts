import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { captureAnalytics } from "@/lib/analytics";

// Points trouvés de la carte interactive (clés `mapId-type-markerId-instanceId`).
// Même clé localStorage depuis l'origine : la progression des visiteurs en dépend.
// Le reste de l'état de la carte vit dans `@/lib/map/state`.
const markedMarkersStorageAtom = atomWithStorage<string[]>(
  "marked-markers",
  []
);

export const isMenuOpenAtom = atomWithStorage<boolean>("menu-open", false);

// Mode d'affichage des listes : 3 modes sélectionnables partout (Simplifié = images en
// grand plan, Liste = lignes, Détaillé = cartes avec traductions). Le défaut dépend de la
// liste (DW/mods → "detailed", les autres → "simplified"). Persistance PAR liste (clé de
// surface : "characters", "items:<categoryId>", "drafts") pour respecter ces défauts.
export type ListViewMode = "simplified" | "list" | "detailed";
export const listViewModesAtom = atomWithStorage<Record<string, ListViewMode>>(
  "list-view-modes",
  {},
);

// Persistance des filtres de la section Items (par catégorie)
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

// Persistance des bandeaux d'annonce de la page d'accueil
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

// Atome de stockage pour les favoris d'items
const itemsFavoritesStorageAtom = atomWithStorage<string[]>("items-favorites", []);

// Atome dérivé pour convertir entre Set et Array (favoris d'items)
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
 * Mesuré ici et non sur les quatre boutons qui l'appellent : la grille, la
 * fiche et les deux vues compactes basculent le même favori, et quatre points
 * d'appel sont quatre occasions d'en oublier un au prochain écran.
 *
 * `itemKey` est un identifiant de donnée de jeu, pas une saisie du visiteur.
 */
export const toggleItemFavoriteAtom = atom(
  null,
  (get, set, itemKey: string) => {
    const currentFavorites = get(itemsFavoritesAtom);
    const nextFavorites = new Set(currentFavorites);
    const retire = nextFavorites.has(itemKey);

    if (retire) {
      nextFavorites.delete(itemKey);
    } else {
      nextFavorites.add(itemKey);
    }

    set(itemsFavoritesAtom, nextFavorites);
    captureAnalytics("favorite_toggled", {
      kind: "item",
      action: retire ? "removed" : "added",
      key: itemKey,
      total: nextFavorites.size,
    });
  }
);

export const resetAllItemsFavoritesAtom = atom(null, (_get, set) => {
  set(itemsFavoritesAtom, new Set());
});

// Persistance des filtres de la section Characters
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

// Atome de stockage pour les favoris de personnages
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
    const retire = nextFavorites.has(characterKey);

    if (retire) {
      nextFavorites.delete(characterKey);
    } else {
      nextFavorites.add(characterKey);
    }

    set(charactersFavoritesAtom, nextFavorites);
    captureAnalytics("favorite_toggled", {
      kind: "character",
      action: retire ? "removed" : "added",
      key: characterKey,
      total: nextFavorites.size,
    });
  },
);

// Atome dérivé pour convertir entre Set et Array
export const markedMarkersAtom = atom(
  (get) => {
    const stored = get(markedMarkersStorageAtom);
    return new Set(Array.isArray(stored) ? stored : []);
  },
  (get, set, newValue: Set<string>) => {
    set(markedMarkersStorageAtom, Array.from(newValue));
  }
);

// Actions
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

