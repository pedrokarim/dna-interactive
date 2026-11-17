/**
 * Types partagés des notifications, importables côté client : pas d'accès base
 * ici, ni de `server-only`.
 */

/** Catégorie visuelle d'une notification (pastille + icône). */
export type NotificationKind = "info" | "release" | "event" | "maintenance" | "warning" | "moderation" | "report";

/** Qui a le droit de voir une annonce. */
export type AnnouncementAudience = "everyone" | "authenticated" | "admins";


// Tuples `as const` : zod les prend tels quels (`z.enum`), et les types en
// dérivent. On ne déclare les valeurs qu'à un endroit.
export const ANNOUNCEMENT_KINDS = ["info", "release", "event", "maintenance", "warning"] as const;
export const ANNOUNCEMENT_AUDIENCES = ["everyone", "authenticated", "admins"] as const;

export type AnnouncementKind = (typeof ANNOUNCEMENT_KINDS)[number];

/**
 * Une entrée du fil de notifications, quelle que soit son origine.
 *
 * `source` sépare les annonces (lignes de `announcements`, gérées dans l'admin)
 * des notifications tirées de l'activité du compte (modération d'un build,
 * signalements à traiter). Dans les deux cas, l'`id` sert de clé dans
 * `notification_reads`.
 */
export type AppNotification = {
  id: string;
  source: "announcement" | "derived";
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  image?: string;
  pinned?: boolean;
  /** ISO. Date de publication pour une annonce, d'événement pour une dérivée. */
  createdAt: string;
  /** Vrai si l'utilisateur connecté a déjà lu. Les anonymes s'appuient sur le stockage local. */
  read?: boolean;
};

export type NotificationFeed = {
  notifications: AppNotification[];
  /** Nombre de non-lues côté serveur (0 pour un visiteur anonyme : c'est le client qui tranche). */
  unread: number;
  /** Vrai si l'état de lecture est persisté côté serveur (donc utilisateur connecté). */
  persisted: boolean;
};

export const KIND_LABELS: Record<NotificationKind, string> = {
  info: "Information",
  release: "Sortie",
  event: "Événement",
  maintenance: "Maintenance",
  warning: "Avertissement",
  moderation: "Modération",
  report: "Signalement",
};
