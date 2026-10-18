import { z } from "zod";
import { CATEGORIES, REGIONS, type Category, type Region } from "./types";

/**
 * Commissions affichées sur l'accueil : régions et catégories retenues par le
 * visiteur. Par défaut, tout. Stocké sur le compte quand on est connecté
 * (`user_preferences`), sinon dans un cookie, lu au rendu serveur pour que
 * l'accueil s'affiche directement filtré.
 */
export type CommissionFilter = {
  regions: Region[];
  categories: Category[];
};

export const DEFAULT_COMMISSION_FILTER: CommissionFilter = {
  regions: [...REGIONS],
  categories: [...CATEGORIES],
};

/** Cookie du visiteur non connecté (un an, lisible côté client). */
export const COMMISSION_FILTER_COOKIE = "dna-commission-filter";
export const COMMISSION_FILTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Ensembles fermés, au moins une valeur dans chaque liste : un filtre qui ne
 * garde rien n'a pas de sens, l'interface empêche de retirer la dernière.
 */
export const commissionFilterSchema = z.object({
  regions: z.array(z.enum(REGIONS)).min(1).max(REGIONS.length),
  categories: z.array(z.enum(CATEGORIES)).min(1).max(CATEGORIES.length),
});

/** Dédoublonne et remet dans l'ordre d'affichage. */
export function normalizeCommissionFilter(filter: CommissionFilter): CommissionFilter {
  return {
    regions: REGIONS.filter((r) => filter.regions.includes(r)),
    categories: CATEGORIES.filter((c) => filter.categories.includes(c)),
  };
}

/** Valeur inconnue (cookie, base, requête) → filtre valide, ou `null` si illisible. */
export function parseCommissionFilter(value: unknown): CommissionFilter | null {
  const parsed = commissionFilterSchema.safeParse(value);
  return parsed.success ? normalizeCommissionFilter(parsed.data) : null;
}

export function isDefaultCommissionFilter(filter: CommissionFilter): boolean {
  return filter.regions.length === REGIONS.length && filter.categories.length === CATEGORIES.length;
}

/** `EUROPE.ASIA~character.weapon` : compact, sans caractère à encoder dans un cookie. */
export function serializeCommissionFilter(filter: CommissionFilter): string {
  return `${filter.regions.join(".")}~${filter.categories.join(".")}`;
}

export function parseCommissionFilterCookie(raw: string | undefined | null): CommissionFilter | null {
  if (!raw) return null;
  const [regions = "", categories = ""] = raw.split("~");
  return parseCommissionFilter({
    regions: regions.split(".").filter(Boolean),
    categories: categories.split(".").filter(Boolean),
  });
}
