/**
 * Réglages applicatifs pilotables via l'admin (table `app_settings`, 1 ligne JSON).
 * Type pur + valeurs par défaut, partageable client/serveur. Aucune valeur n'est
 * secrète (booléens + textes d'annonce) → exposable côté client.
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
  /** Date de référence du calendrier (ISO AAAA-MM-JJ ; "" = défaut du code). */
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

/** Fusionne un objet partiel (BDD) au-dessus des défauts (tolérant aux clés manquantes/en trop). */
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
