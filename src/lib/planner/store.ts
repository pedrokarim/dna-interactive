import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { EMPTY_PLANNER } from "./builds";
import { readPlannerState } from "./schema";
import type { PlannerState } from "./types";

/**
 * Plan du visiteur, dans le navigateur. Relu à travers le schéma : une entrée
 * corrompue ou d'une ancienne version est écartée, jamais tout le plan.
 */
const storage = createJSONStorage<PlannerState>(() =>
  // Côté serveur, pas de stockage : jotai lit alors la valeur initiale.
  typeof window === "undefined" ? (undefined as unknown as Storage) : window.localStorage,
);
const safeStorage = {
  ...storage,
  getItem: (key: string, initialValue: PlannerState) => {
    // Navigation privée, données du site bloquées : on part d'un plan vide.
    try {
      return readPlannerState(storage.getItem(key, initialValue));
    } catch {
      return initialValue;
    }
  },
};

export const PLANNER_STORAGE_KEY = "planner:v1";

/**
 * `getOnInit` : le plan est lu dès la création de l'atome, pas après le
 * montage. Sans cela, une action rapide (import d'un build à l'arrivée sur la
 * page) partirait d'un plan vide et écraserait le vrai. L'interface n'est de
 * toute façon rendue qu'au client, une fois les données chargées.
 */
export const plannerStateAtom = atomWithStorage<PlannerState>(PLANNER_STORAGE_KEY, EMPTY_PLANNER, safeStorage, {
  getOnInit: true,
});
