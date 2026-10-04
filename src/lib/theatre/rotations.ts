/**
 * Rotations du théâtre immersif — données + logique pure.
 *
 * Le théâtre tourne par tranches : pendant quelques semaines, il met en avant
 * un personnage ou une arme de calamité, puis passe à la suite. Depuis la
 * version 1.5, chaque version en compte deux : le personnage d'abord, l'arme
 * ensuite.
 *
 * Contrairement au calendrier, les bornes sont des **instants** et non des
 * jours : une rotation bascule à une heure précise, la même pour tout le monde.
 * On les garde donc en ISO UTC, et c'est l'affichage qui choisit le fuseau.
 *
 * Les fonctions de ce module restent pures : l'instant présent est toujours un
 * paramètre, jamais lu ici (rendu serveur sûr, testable).
 */
import staticData from "@/data/theatre/rotations.json";

export type TheatreFeaturedKind = "character" | "weapon";

export const THEATRE_FEATURED_KINDS: TheatreFeaturedKind[] = ["character", "weapon"];

export type TheatreRotation = {
  id: string;
  /** Numéro de saison du jeu ; absent pour une rotation saisie à la main. */
  seasonId?: number;
  /** Instants ISO UTC. `endsAt` est exclu : c'est le moment de la bascule. */
  startsAt: string;
  endsAt: string;
  featured: { kind: TheatreFeaturedKind; id: string };
  note?: string;
  /** Annonce officielle, quand la rotation en vient. */
  sourceUrl?: string;
};

type StaticRotation = { seasonId: number; startsAt: string; endsAt: string; featured: { kind: string; id: string } };

export function toFeaturedKind(value: string): TheatreFeaturedKind {
  return value === "weapon" ? "weapon" : "character";
}

/** Rotations livrées avec le site : le repli quand la base est vide ou absente. */
export const STATIC_THEATRE_ROTATIONS: TheatreRotation[] = (staticData.rotations as StaticRotation[]).map((r) => ({
  id: `season-${r.seasonId}`,
  seasonId: r.seasonId,
  startsAt: r.startsAt,
  endsAt: r.endsAt,
  featured: { kind: toFeaturedKind(r.featured.kind), id: r.featured.id },
}));

export type TheatreRotationStatus = "past" | "current" | "upcoming";

export function rotationStatus(rotation: Pick<TheatreRotation, "startsAt" | "endsAt">, nowMs: number): TheatreRotationStatus {
  if (nowMs < Date.parse(rotation.startsAt)) return "upcoming";
  if (nowMs >= Date.parse(rotation.endsAt)) return "past";
  return "current";
}

/** De la plus ancienne à la plus récente. */
export function sortRotations<T extends Pick<TheatreRotation, "startsAt" | "id">>(rotations: T[]): T[] {
  return [...rotations].sort((a, b) =>
    a.startsAt === b.startsAt ? a.id.localeCompare(b.id) : Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );
}

export type TheatreOverview<T> = {
  /** Toutes les rotations, de la plus ancienne à la plus récente. */
  rotations: T[];
  current: T | null;
  /** La dernière terminée. */
  previous: T | null;
  /** La prochaine connue ; `null` tant que rien n'est annoncé. */
  next: T | null;
};

/**
 * Situe l'instant présent dans la suite des rotations.
 *
 * Entre deux versions, le théâtre ferme quelques heures : il peut donc n'y
 * avoir aucune rotation en cours, tout en ayant une précédente et une suivante.
 */
export function theatreOverview<T extends Pick<TheatreRotation, "id" | "startsAt" | "endsAt">>(
  rotations: T[],
  nowMs: number,
): TheatreOverview<T> {
  const sorted = sortRotations(rotations);
  const current = sorted.find((r) => rotationStatus(r, nowMs) === "current") ?? null;
  const past = sorted.filter((r) => rotationStatus(r, nowMs) === "past");
  const upcoming = sorted.filter((r) => rotationStatus(r, nowMs) === "upcoming");
  return {
    rotations: sorted,
    current,
    previous: past.length ? past[past.length - 1] : null,
    next: upcoming[0] ?? null,
  };
}

const DAY_MS = 86_400_000;

/** Durée d'une rotation, en jours arrondis. */
export function rotationLengthDays(rotation: Pick<TheatreRotation, "startsAt" | "endsAt">): number {
  return Math.max(1, Math.round((Date.parse(rotation.endsAt) - Date.parse(rotation.startsAt)) / DAY_MS));
}

/** Part écoulée d'une rotation, entre 0 et 1. */
export function rotationProgress(rotation: Pick<TheatreRotation, "startsAt" | "endsAt">, nowMs: number): number {
  const start = Date.parse(rotation.startsAt);
  const end = Date.parse(rotation.endsAt);
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (nowMs - start) / (end - start)));
}
