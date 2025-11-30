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
}

// Liste des codes disponibles
export const GAME_CODES: GameCode[] = [
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
    id: "epicgamesdna",
    code: "EPICGAMESDNA",
    rewards: [
      "10,000 Coins",
      "5 Combat Melody I",
      "1 Basic Weapon Component: Grip",
    ],
  },
  {
    id: "dnalive",
    code: "DNALIVE",
    rewards: [
      "10,000 Coins",
      "2 Commission Manual: Volume I",
      "1 Basic Weapon Component: Blade",
    ],
  },
  {
    id: "dnaglobal",
    code: "DNAGLOBAL",
    rewards: ["20 Phoxene", "20,000 Coins", "10 Combat Melody I"],
  },
  {
    id: "dnabyssgift",
    code: "DNABYSSGIFT",
    rewards: ["20 Phoxene", "20,000 Coins", "10 Combat Melody I"],
  },
  {
    id: "dnagift",
    code: "DNAGIFT",
    rewards: ["100 Carmine Globule", "20,000 Coins", "5 Combat Melody I"],
  },
  {
    id: "dnarelease",
    code: "DNARELEASE",
    rewards: ["100 Phoxene", "3 Combat Melody III", "100 Carmine Globule"],
  },
  {
    id: "dnafreeplay",
    code: "DNAFREEPLAY",
    rewards: ["100 Phoxene", "3 Weapon Manual III", "100 Carmine Globule"],
  },
  {
    id: "dna1028",
    code: "DNA1028",
    rewards: ["100 Phoxene", "30,000 Coins", "100 Carmine Globule"],
  },
  {
    id: "dnallaunch",
    code: "DNALAUNCH",
    rewards: ["30,000 Coins", "10 Weapon Manual I", "10 Combat Melody I"],
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
    if (typeof window !== 'undefined') {
      if (newValue) {
        localStorage.setItem('selected-map', newValue);
      } else {
        localStorage.removeItem('selected-map');
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
export const sidebarWidthAtom = atomWithStorage<number>(
  "sidebar-width",
  320
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
