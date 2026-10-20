import theatreRotationsJson from "@/data/theatre/rotations.json";

/**
 * Objets présents dans les données du jeu mais pas encore obtenables.
 *
 * Une version livre souvent d'un coup des objets qui n'ouvriront que plus
 * tard : Énigme insoluble arrive avec la 1.7 mais ne s'obtient qu'à partir de
 * sa rotation du théâtre immersif. Le site la montre quand même, étiquetée, et
 * prévient que ses informations peuvent encore changer.
 *
 * Deux sources, jamais devinées :
 * - `theatre` : le début de la première rotation du théâtre qui met l'objet en
 *   avant (`src/data/theatre/rotations.json`) ;
 * - `announced` : une date publiée par le studio, notée ci-dessous avec sa source.
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
 * Passé cet instant, l'objet redevient un objet ordinaire, sans rien à retoucher.
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
 * Jour d'ouverture au fuseau du serveur de jeu (UTC+8), celui des annonces
 * officielles. Fuseau fixe : le rendu serveur et le navigateur écrivent la même
 * chose, pas d'écart d'hydratation.
 */
export function formatAvailabilityDate(availableAt: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long", timeZone: "Asia/Shanghai" }).format(
    new Date(availableAt),
  );
}
