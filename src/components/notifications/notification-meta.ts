import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  Flag,
  Info,
  ShieldAlert,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { NotificationKind } from "@/lib/notifications/types";

/**
 * Habillage d'une catégorie de notification : icône et teinte.
 *
 * Les teintes reprennent le vocabulaire du site – or pour l'information, or vif
 * pour une sortie, cramoisi pour ce qui exige une action. Aucune nouvelle
 * couleur n'est introduite ici.
 */
export const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  info: Info,
  release: Sparkles,
  event: CalendarDays,
  maintenance: Wrench,
  warning: AlertTriangle,
  moderation: ShieldAlert,
  report: Flag,
};

export const KIND_TONE: Record<NotificationKind, string> = {
  info: "border-line/30 bg-white/[0.04] text-parch/70",
  release: "border-gold/40 bg-gold/10 text-gold-bright",
  event: "border-gold/30 bg-gold/8 text-gold",
  maintenance: "border-line/30 bg-white/[0.04] text-muted",
  warning: "border-crimson/40 bg-crimson/10 text-crimson-bright",
  moderation: "border-crimson/35 bg-crimson/8 text-crimson-bright",
  report: "border-crimson/35 bg-crimson/8 text-crimson-bright",
};

export const FALLBACK_ICON = BellRing;
