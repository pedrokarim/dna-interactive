import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Atome de stockage pour les marqueurs sous forme de tableau
const markedMarkersStorageAtom = atomWithStorage<string[]>(
  "marked-markers",
  []
);

// Types
export interface MarkerInstance {
  id: number;
  position: { x: number; y: number };
  image?: string; // Image descriptive du marqueur (screenshot, guide visuel)
}

export interface Marker {
  id: number;
  name: string;
  icon: string;
  instances: MarkerInstance[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  markers: Marker[];
}

export interface GameMap {
  id: string;
  name: string;
  image: string;
  imageSize: { width: number; height: number };
  categories: Category[];
}

export interface GameCode {
  id: string;
  code: string;
  rewards: string[];
  isNew?: boolean;
  expired?: boolean;
  expiresAt?: string;
}

// Liste des codes disponibles (triés: nouveaux en premier, puis actifs, puis expirés)
// Source: https://game8.co/games/Duet-Night-Abyss/archives/557781
export const GAME_CODES: GameCode[] = [
  // Nouveaux codes actifs (décembre 2025) - TOUJOURS EN HAUT
  {
    id: "icxfap",
    code: "ICXFAP",
    rewards: ["Récompenses à confirmer"], // Luno's Gift - Eternal Merriment | Winter's Invitation
    isNew: true,
  },
  {
    id: "dnagift",
    code: "DNAGIFT",
    rewards: ["100 Carmine Globule", "20,000 Coins", "5 Combat Melody I"],
    isNew: true,
  },
  {
    id: "dnabyssgift",
    code: "DNABYSSGIFT",
    rewards: ["20 Phoxene", "20,000 Coins", "10 Combat Melody I"],
    isNew: true,
  },
  {
    id: "dnallaunch",
    code: "DNALAUNCH",
    rewards: ["30,000 Coins", "10 Weapon Manual I", "10 Combat Melody I"],
    isNew: true,
  },
  {
    id: "epicgamesdna",
    code: "EPICGAMESDNA",
    rewards: [
      "10,000 Coins",
      "5 Combat Melody I",
      "1 Basic Weapon Component: Grip",
    ],
    isNew: true,
  },
  {
    id: "denaabiniiji",
    code: "DENAABINIJI",
    rewards: [
      "200 Carmine Globule",
      "20,000 Coins",
      "2 Commission Manual: Volume I",
    ],
    isNew: true,
  },
  {
    id: "dnaglobal",
    code: "DNAGLOBAL",
    rewards: ["20 Phoxene", "20,000 Coins", "10 Combat Melody I"],
    isNew: true,
  },
  {
    id: "dnalive",
    code: "DNALIVE",
    rewards: [
      "10,000 Coins",
      "2 Combat Manual: Volume I",
      "1 Basic Weapon Component: Blade",
    ],
    isNew: true,
  },

  // Codes du livestream "The Wind Awakening" (expirent le 24 décembre 2025 à 23:59 UTC+8)
  {
    id: "huaxuawaits",
    code: "HUAXUAWAITS",
    rewards: ["100 Phoxene", "3 Combat Melody III", "100 Carmine Globule"],
    isNew: true,
    expiresAt: "24 décembre 2025",
  },
  {
    id: "thewindawakening",
    code: "THEWINDAWAKENING",
    rewards: ["100 Phoxene", "3 Weapon Manual III", "100 Carmine Globule"],
    isNew: true,
    expiresAt: "24 décembre 2025",
  },
  {
    id: "dna20251223",
    code: "DNA20251223",
    rewards: ["100 Phoxene", "30,000 Coins", "100 Carmine Globule"],
    isNew: true,
    expiresAt: "24 décembre 2025",
  },

  // Codes expirés (selon Game8.co)
  {
    id: "dnarelease",
    code: "DNARELEASE",
    rewards: ["100 Phoxene", "3 Combat Melody III", "100 Carmine Globule"],
    expired: true,
  },
  {
    id: "dnafreeplay",
    code: "DNAFREEPLAY",
    rewards: ["100 Phoxene", "3 Weapon Manual III", "100 Carmine Globule"],
    expired: true,
  },
  {
    id: "dna1028",
    code: "DNA1028",
    rewards: ["100 Phoxene", "30,000 Coins", "100 Carmine Globule"],
    expired: true,
  },
];

// Atoms avec persistance
// Atome pour la carte sélectionnée (sans persistance automatique pour éviter les conflits)
export const selectedMapIdAtom = atom<string | null>(null);

// Atome dérivé pour gérer la persistance manuellement
export const selectedMapIdWithPersistenceAtom = atom(
  (get) => get(selectedMapIdAtom),
  (get, set, newValue: string | null) => {
    set(selectedMapIdAtom, newValue);
    // Sauvegarder manuellement dans localStorage
    if (typeof window !== "undefined") {
      if (newValue) {
        localStorage.setItem("selected-map", newValue);
      } else {
        localStorage.removeItem("selected-map");
      }
    }
  }
);
export const isMenuOpenAtom = atomWithStorage<boolean>("menu-open", false);
export const visibleCategoriesAtom = atomWithStorage<Record<string, boolean>>(
  "visible-categories",
  {}
);
export const expandedCategoriesAtom = atomWithStorage<Record<string, boolean>>(
  "expanded-categories",
  {}
);
export const sidebarWidthAtom = atomWithStorage<number>("sidebar-width", 320);

// Persistance des filtres de la section Items (par catégorie)
export type PersistedItemsFilters = Record<
  string,
  {
    search: string;
    selectedLanguages: string[];
    rarityFilter: string;
    polarityFilter: string;
    archiveFilter: string;
    itemTypeFilter: string;
    itemSubTypeFilter: string;
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

export const toggleItemFavoriteAtom = atom(
  null,
  (get, set, itemKey: string) => {
    const currentFavorites = get(itemsFavoritesAtom);
    const nextFavorites = new Set(currentFavorites);

    if (nextFavorites.has(itemKey)) {
      nextFavorites.delete(itemKey);
    } else {
      nextFavorites.add(itemKey);
    }

    set(itemsFavoritesAtom, nextFavorites);
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
  selectedLanguages: string[];
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
    selectedLanguages: [],
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

    if (nextFavorites.has(characterKey)) {
      nextFavorites.delete(characterKey);
    } else {
      nextFavorites.add(characterKey);
    }

    set(charactersFavoritesAtom, nextFavorites);
  },
);

// Atome de stockage pour les codes utilisés
const usedCodesStorageAtom = atomWithStorage<string[]>("used-codes", []);

// Atome dérivé pour convertir entre Set et Array pour les codes utilisés
export const usedCodesAtom = atom(
  (get) => {
    const stored = get(usedCodesStorageAtom);
    return new Set(Array.isArray(stored) ? stored : []);
  },
  (get, set, newValue: Set<string>) => {
    set(usedCodesStorageAtom, Array.from(newValue));
  }
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

// Atoms dérivés
export const selectedMapAtom = atom<GameMap | null>((get) => {
  // Cette valeur sera définie dynamiquement depuis les données
  return null;
});

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

export const toggleCategoryVisibilityAtom = atom(
  null,
  (get, set, categoryId: string) => {
    const currentVisible = get(visibleCategoriesAtom);
    const isCurrentlyVisible = currentVisible[categoryId] !== false; // undefined ou true = visible
    set(visibleCategoriesAtom, {
      ...currentVisible,
      [categoryId]: !isCurrentlyVisible, // Si visible, devient invisible (false), si invisible, devient visible (true)
    });
  }
);

export const resetAllMarkersAtom = atom(null, (get, set) => {
  set(markedMarkersAtom, new Set());
});

// Actions pour les codes
export const toggleCodeUsedAtom = atom(null, (get, set, codeId: string) => {
  const currentUsed = get(usedCodesAtom);
  const newUsed = new Set(currentUsed);

  if (newUsed.has(codeId)) {
    newUsed.delete(codeId);
  } else {
    newUsed.add(codeId);
  }

  set(usedCodesAtom, newUsed);
});

export const resetAllCodesAtom = atom(null, (get, set) => {
  set(usedCodesAtom, new Set());
});
