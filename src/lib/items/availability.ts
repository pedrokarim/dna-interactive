import theatreRotationsJson from "@/data/theatre/rotations.json";

/**
 * Objets déjà dans les données du jeu mais pas encore obtenables.
 *
 * Une version livre souvent des objets qui n'ouvrent que plus tard (Énigme
 * insoluble arrive avec la 1.7 mais ne s'obtient qu'à sa rotation du théâtre
 * immersif). On les affiche quand même, étiquetés, en prévenant que les infos
 * peuvent changer.
 *
 * La date vient d'une de ces sources, jamais d'une supposition :
 * - `theatre` : début de la première rotation du théâtre qui met l'objet en
 *   avant (src/data/theatre/rotations.json) ;
 * - `announced` : date publiée par le studio, notée plus bas avec sa source.
 */

export type ItemAvailability = {
  /** Instant d'ouverture, ISO UTC. */
  availableAt: string;
  source: "theatre" | "announced";
};

type TheatreRotation = { startsAt: string; featured: { kind: string; id: string } };

const theatreRotations = (theatreRotationsJson as { rotations: TheatreRotation[] }).rotations;

/** Notes de version officielles 1.7 « Towards the Dawn ». */
const SRC_V17 = "https://steamcommunity.com/games/3950020/announcements/detail/692023294602250674";

/** Ouvertures annoncées hors théâtre. */
const ANNOUNCED_AVAILABILITY: Record<string, { availableAt: string; sourceUrl: string }> = {
  // « The Hatter's Banquet – Availability: November 10, 2026, 10:00 (UTC+8) ».
  "weapons-20605": { availableAt: "2026-11-10T02:00:00.000Z", sourceUrl: SRC_V17 },
};

const firstTheatreStartById = new Map<string, string>();
for (const rotation of [...theatreRotations].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
  if (!firstTheatreStartById.has(rotation.featured.id)) firstTheatreStartById.set(rotation.featured.id, rotation.startsAt);
}

/**
 * Date d'ouverture de l'objet si elle est encore à venir, sinon `null`.
 * Une fois la date passée, l'objet redevient normal tout seul.
 */
export function getPendingAvailability(itemId: string, now: Date = new Date()): ItemAvailability | null {
  const announced = ANNOUNCED_AVAILABILITY[itemId];
  const candidate: ItemAvailability | null = announced
    ? { availableAt: announced.availableAt, source: "announced" }
    : firstTheatreStartById.has(itemId)
      ? { availableAt: firstTheatreStartById.get(itemId)!, source: "theatre" }
      : null;
  if (!candidate) return null;
  return Date.parse(candidate.availableAt) > now.getTime() ? candidate : null;
}

/**
 * Jour d'ouverture au fuseau du serveur de jeu (UTC+8), celui des annonces.
 * Fuseau fixe pour que serveur et navigateur écrivent la même date (pas d'écart
 * d'hydratation).
 */
export function formatAvailabilityDate(availableAt: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long", timeZone: "Asia/Shanghai" }).format(
    new Date(availableAt),
  );
}
