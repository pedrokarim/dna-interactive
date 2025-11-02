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

// Atoms avec persistance
export const selectedMapIdAtom = atomWithStorage<string | null>(
  "selected-map",
  null
);
export const isMenuOpenAtom = atomWithStorage<boolean>("menu-open", false);
export const visibleCategoriesAtom = atomWithStorage<Record<string, boolean>>(
  "visible-categories",
  {}
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
