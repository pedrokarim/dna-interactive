"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BellOff, Check, Settings2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/components/dna";
import type { AppNotification } from "@/lib/notifications/types";
import { FALLBACK_ICON, KIND_ICON, KIND_TONE } from "./notification-meta";
import { useNotifications } from "./useNotifications";
import { usePushNotifications } from "./usePushNotifications";

/** Nombre d'entrées dans le panneau ; le reste se lit sur la page dédiée. */
const PANEL_LIMIT = 8;

export function NotificationBell() {
  const tc = useTranslations("common");
  const tn = useTranslations("notificationsPanel");
  const locale = useLocale();
  const { items, unread, markRead, markAllRead } = useNotifications();
  const push = usePushNotifications();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const relative = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale]);
  const absolute = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    [locale],
  );

  // Fermeture au clic extérieur et à Échap – mêmes règles que le reste de la
  // barre. Le focus revient sur la cloche, jamais perdu dans le document.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = items.slice(0, PANEL_LIMIT);

  return (
    <div ref={wrapRef} className="relative z-[70]">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={unread > 0 ? tn("ariaWithUnread", { count: unread }) : tc("notifications")}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-line/25 text-parch/70 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson-bright px-1 font-sans text-[0.6rem] font-semibold leading-none text-[#fff] shadow-[0_0_6px_rgba(181,48,42,0.8)]">
            <span className="dna-optical-num">{unread > 9 ? "9+" : unread}</span>
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={tc("notifications")}
          className="absolute right-0 top-full z-[90] mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden border border-line/25 bg-panel shadow-[0_18px_44px_rgba(0,0,0,0.65)]"
        >
          <div className="flex items-center justify-between border-b border-line/20 px-3 py-2.5">
            <span className="font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold">{tc("notifications")}</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-gold"
              >
                <Check className="h-3 w-3" />
                {tn("markAllRead")}
              </button>
            ) : null}
          </div>

          {visible.length === 0 ? (
            <p className="px-3 py-8 text-center font-sans text-sm text-muted">{tc("noNotifications")}</p>
          ) : (
            <ul className="max-h-[26rem] overflow-y-auto custom-scrollbar">
              {visible.map((n) => (
                <li key={n.id} className="border-b border-line/10 last:border-b-0">
                  <NotificationRow
                    notification={n}
                    relative={relative}
                    absolute={absolute}
                    onActivate={() => markRead([n.id])}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-line/20 px-3 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-gold"
            >
              {tn("seeAll")}
            </Link>

            {/* L'activation du push vit ici, derrière un geste explicite. Jamais
                de demande de permission au chargement de la page. */}
            {push.state === "unsupported" ? null : push.state === "denied" ? (
              <span className="flex items-center gap-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted-2">
                <BellOff className="h-3 w-3" />
                {tn("pushBlocked")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => (push.state === "subscribed" ? push.disable() : push.enable())}
                disabled={push.state === "subscribing"}
                className="flex items-center gap-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-gold disabled:opacity-50"
              >
                <Settings2 className="h-3 w-3" />
                {push.state === "subscribed" ? tn("pushOn") : tn("pushEnable")}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Une ligne du panneau. Cliquer marque comme lu, puis suit le lien s'il y en a un. */
function NotificationRow({
  notification,
  relative,
  absolute,
  onActivate,
}: {
  notification: AppNotification;
  relative: Intl.RelativeTimeFormat;
  absolute: Intl.DateTimeFormat;
  onActivate: () => void;
}) {
  const Icon = KIND_ICON[notification.kind] ?? FALLBACK_ICON;
  const date = new Date(notification.createdAt);
  const isUnread = !notification.read;

  const inner = (
    <div
      className={cn(
        "flex gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5",
        isUnread && "bg-gold/[0.06]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border",
          KIND_TONE[notification.kind],
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className={cn("min-w-0 flex-1 font-sans text-sm", isUnread ? "text-parch" : "text-parch/70")}>
            {notification.title}
          </span>
          {isUnread ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson-bright" /> : null}
        </span>
        {/* `line-clamp-2` pose déjà `display: -webkit-box` : lui adjoindre
            `block` annule la troncature, et le panneau s'étire sans fin. */}
        {notification.body ? (
          <span className="mt-0.5 line-clamp-2 font-sans text-xs text-muted">{notification.body}</span>
        ) : null}
        <time dateTime={notification.createdAt} className="mt-1 block font-mono text-[0.6rem] text-muted-2">
          {formatAge(date, relative, absolute)}
        </time>
      </span>
    </div>
  );

  if (notification.href) {
    return (
      <Link href={notification.href} onClick={onActivate} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onActivate} className="block w-full">
      {inner}
    </button>
  );
}

/**
 * Âge lisible : relatif tant qu'il reste parlant (« il y a 3 h »), absolu
 * au-delà d'une semaine, où « il y a 23 jours » n'aide plus personne.
 */
export function formatAge(date: Date, relative: Intl.RelativeTimeFormat, absolute: Intl.DateTimeFormat): string {
  const diffMs = date.getTime() - Date.now();
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(diffMs / 3_600_000);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  const days = Math.round(diffMs / 86_400_000);
  if (Math.abs(days) < 7) return relative.format(days, "day");
  return absolute.format(date);
}
