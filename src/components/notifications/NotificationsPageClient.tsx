"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BellOff, BellRing, Check, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaPanel, DnaSegmented, DnaTag, cn } from "@/components/dna";
import { KIND_LABELS } from "@/lib/notifications/types";
import { FALLBACK_ICON, KIND_ICON, KIND_TONE } from "./notification-meta";
import { formatAge } from "./NotificationBell";
import { useNotifications } from "./useNotifications";
import { usePushNotifications } from "./usePushNotifications";

type Filter = "all" | "unread";

export function NotificationsPageClient() {
  const t = useTranslations("notificationsPage");
  const tn = useTranslations("notificationsPanel");
  const locale = useLocale();
  const { items, unread, loading, persisted, markRead, markAllRead } = useNotifications();
  const push = usePushNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const relative = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale]);
  const absolute = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
    [locale],
  );

  const shown = filter === "unread" ? items.filter((n) => !n.read) : items;

  return (
    <div className="flex flex-col gap-4">
      <PushCard push={push} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DnaSegmented<Filter>
          value={filter}
          onChange={setFilter}
          ariaLabel={t("filterLabel")}
          options={[
            { value: "all", label: t("filterAll") },
            { value: "unread", label: `${t("filterUnread")}${unread > 0 ? ` (${unread})` : ""}` },
          ]}
        />
        {unread > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1.5 border border-line/25 px-3 py-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold hover:text-gold"
          >
            <Check className="h-3.5 w-3.5" />
            {tn("markAllRead")}
          </button>
        ) : null}
      </div>

      {/* Hors connexion, l'état de lecture ne suit pas d'un appareil à l'autre :
          on le dit plutôt que de laisser croire à un bug. */}
      {!loading && !persisted ? (
        <p className="font-sans text-xs text-muted-2">{t("localOnlyNotice")}</p>
      ) : null}

      {loading ? (
        <DnaPanel className="flex items-center justify-center gap-2 p-10 text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-sans text-sm">{t("loading")}</span>
        </DnaPanel>
      ) : shown.length === 0 ? (
        <DnaPanel className="p-10 text-center">
          <Bell aria-hidden className="mx-auto h-8 w-8 text-muted-2" />
          <p className="mt-3 font-sans text-sm text-muted">
            {filter === "unread" ? t("emptyUnread") : t("empty")}
          </p>
        </DnaPanel>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((n) => {
            const Icon = KIND_ICON[n.kind] ?? FALLBACK_ICON;
            const date = new Date(n.createdAt);
            const body = (
              <div className="flex gap-4">
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border",
                    KIND_TONE[n.kind],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={cn("font-sans text-[0.95rem]", n.read ? "text-parch/70" : "text-parch")}>
                      {n.title}
                    </h2>
                    {n.pinned ? <DnaTag tone="gold">{t("pinned")}</DnaTag> : null}
                    {!n.read ? <span className="h-1.5 w-1.5 rounded-full bg-crimson-bright" /> : null}
                  </div>
                  {n.body ? (
                    <p className="mt-1 whitespace-pre-line font-sans text-sm text-muted">{n.body}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted-2">
                      {KIND_LABELS[n.kind]}
                    </span>
                    <time dateTime={n.createdAt} className="font-mono text-[0.62rem] text-muted-2">
                      {formatAge(date, relative, absolute)}
                    </time>
                  </div>
                </div>
              </div>
            );

            return (
              <li key={n.id}>
                <DnaPanel className={cn("p-4 transition-colors", !n.read && "border-gold/25 bg-gold/[0.04]")}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => markRead([n.id])} className="block">
                      {body}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => markRead([n.id])} className="block w-full text-left">
                      {body}
                    </button>
                  )}
                </DnaPanel>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Encart d'activation du push.
 *
 * Il n'apparaît que si le navigateur ET le serveur savent faire. Il ne demande
 * jamais la permission de lui-même : c'est le bouton qui la déclenche.
 */
function PushCard({ push }: { push: ReturnType<typeof usePushNotifications> }) {
  const t = useTranslations("notificationsPage");
  if (push.state === "unsupported") return null;

  const subscribed = push.state === "subscribed";
  const denied = push.state === "denied";

  return (
    <DnaPanel className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border",
            subscribed ? "border-gold/40 bg-gold/10 text-gold-bright" : "border-line/30 bg-white/[0.04] text-muted",
          )}
        >
          {denied ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="font-sans text-sm text-parch">
            {denied ? t("pushDeniedTitle") : subscribed ? t("pushOnTitle") : t("pushOffTitle")}
          </p>
          <p className="mt-0.5 max-w-xl font-sans text-xs text-muted">
            {denied ? t("pushDeniedHelp") : subscribed ? t("pushOnHelp") : t("pushOffHelp")}
          </p>
          {push.error ? <p className="mt-1 font-sans text-xs text-crimson-bright">{push.error}</p> : null}
        </div>
      </div>

      {denied ? null : (
        <button
          type="button"
          onClick={() => (subscribed ? push.disable() : push.enable())}
          disabled={push.state === "subscribing"}
          className={cn(
            "flex shrink-0 items-center gap-2 border px-4 py-2 font-caps text-[0.58rem] uppercase tracking-[0.14em] transition-colors disabled:opacity-50",
            subscribed
              ? "border-line/25 text-muted hover:border-crimson/50 hover:text-crimson-bright"
              : "border-gold/40 text-gold hover:border-gold hover:bg-gold/10",
          )}
        >
          {push.state === "subscribing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {subscribed ? t("pushDisable") : t("pushEnable")}
        </button>
      )}
    </DnaPanel>
  );
}
