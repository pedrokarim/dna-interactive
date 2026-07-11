"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { Bell, Flag, ShieldAlert, ThumbsUp, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/components/dna";

type AppNotification = {
  id: string;
  type: "build_vote" | "build_moderated" | "report_new";
  title: string;
  body?: string;
  href?: string;
  createdAt: string;
};

const TYPE_ICON: Record<AppNotification["type"], LucideIcon> = {
  build_vote: ThumbsUp,
  build_moderated: ShieldAlert,
  report_new: Flag,
};

const STORAGE_KEY = "dna:notif-last-seen";

export function NotificationBell() {
  const { status } = useSession();
  const authed = status === "authenticated";
  const locale = useLocale();
  const fmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    [locale],
  );

  const [items, setItems] = useState<AppNotification[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(0);

  // charge le dernier « vu » (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLastSeen(Number(raw) || 0);
    } catch {
      /* stockage indisponible */
    }
  }, []);

  // récupère les notifications quand connecté
  useEffect(() => {
    if (!authed) {
      setItems([]);
      return;
    }
    let alive = true;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (alive && Array.isArray(json?.notifications)) setItems(json.notifications as AppNotification[]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [authed]);

  const unread = useMemo(() => items.filter((n) => Date.parse(n.createdAt) > lastSeen).length, [items, lastSeen]);

  const markSeen = () => {
    const newest = items.reduce((m, n) => Math.max(m, Date.parse(n.createdAt)), 0);
    if (newest > lastSeen) {
      setLastSeen(newest);
      try {
        localStorage.setItem(STORAGE_KEY, String(newest));
      } catch {
        /* ignore */
      }
    }
  };

  // Déconnecté : simple cloche inactive.
  if (!authed) {
    return (
      <span
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-sm border border-line/25 text-parch/40"
      >
        <Bell className="h-4 w-4" />
      </span>
    );
  }

  return (
    <details
      className="group relative z-[70]"
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) markSeen();
      }}
    >
      <summary
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
        className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-sm border border-line/25 text-parch/70 transition-colors hover:border-gold hover:text-gold [&::-webkit-details-marker]:hidden"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson-bright px-1 font-sans text-[0.6rem] font-semibold text-white shadow-[0_0_6px_rgba(181,48,42,0.8)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </summary>

      <div className="absolute right-0 top-full z-[90] mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden border border-line/25 bg-panel shadow-[0_18px_44px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-line/20 px-3 py-2.5">
          <span className="font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold">Notifications</span>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={markSeen}
              className="font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-gold"
            >
              Tout marquer lu
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <p className="px-3 py-6 text-center font-sans text-sm text-muted">Aucune notification pour l'instant.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto custom-scrollbar">
            {items.map((n) => {
              const Icon = TYPE_ICON[n.type];
              const isUnread = Date.parse(n.createdAt) > lastSeen;
              const inner = (
                <div className={cn("flex gap-3 px-3 py-2.5 transition-colors hover:bg-white/5", isUnread && "bg-gold/5")}>
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-gold/25 bg-gold/8 text-gold">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-sans text-sm text-parch">{n.title}</span>
                      {isUnread ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-crimson-bright" /> : null}
                    </span>
                    {n.body ? <span className="mt-0.5 block truncate font-sans text-xs text-muted">{n.body}</span> : null}
                    <span className="mt-0.5 block font-mono text-[0.6rem] text-muted-2">{fmt.format(new Date(n.createdAt))}</span>
                  </span>
                </div>
              );
              return (
                <li key={n.id} className="border-b border-line/10 last:border-b-0">
                  {n.href ? (
                    <Link href={n.href} className="block">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}
