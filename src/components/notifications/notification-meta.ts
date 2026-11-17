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
 * Icône et teinte de chaque catégorie de notification. Que des couleurs du
 * site : or vif pour une sortie, or pour un événement, cramoisi pour ce qui
 * demande une action, neutre pour le reste.
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
