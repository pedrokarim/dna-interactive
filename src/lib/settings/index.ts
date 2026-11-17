/**
 * Réglages de l'appli modifiables dans l'admin (table `app_settings`, 1 ligne JSON).
 * Type + valeurs par défaut, partagés client/serveur. Rien de secret (booléens et
 * textes d'annonce), on peut l'exposer au client.
 */

export type AppSettings = {
  /** Bannière d'annonce affichée à tous. */
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  /** Mode maintenance (bandeau + blocage des mutations). */
  maintenanceMode: boolean;
  maintenanceMessage: string;
  /** Création de compte autorisée. */
  signupEnabled: boolean;
  /** Publication de nouveaux builds autorisée. */
  buildCreationEnabled: boolean;
  /** Affichage des commissions (home, page, sidebar). */
  commissionsVisible: boolean;
  /** Connexion Google proposée. */
  googleAuthEnabled: boolean;
  /**
   * Date de référence forcée du calendrier (AAAA-MM-JJ).
   * `""` : normal, le curseur suit l'horloge du visiteur.
   * Une valeur fige la frise pour tout le monde (test, capture).
   */
  calendarToday: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  announcementEnabled: false,
  announcementText: "",
  announcementLink: "",
  maintenanceMode: false,
  maintenanceMessage: "",
  signupEnabled: true,
  buildCreationEnabled: true,
  commissionsVisible: true,
  googleAuthEnabled: true,
  calendarToday: "",
};

/** Fusionne un objet partiel (base) sur les défauts ; clés manquantes ou en trop tolérées. */
export function mergeSettings(partial: Partial<AppSettings> | null | undefined): AppSettings {
  const p = (partial ?? {}) as Partial<AppSettings>;
  const out = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]) {
    const v = p[key];
    if (v !== undefined && typeof v === typeof DEFAULT_SETTINGS[key]) {
      // @ts-expect-error assignation homogène garantie par le typeof check
      out[key] = v;
    }
  }
  return out;
}
