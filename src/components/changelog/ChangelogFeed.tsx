"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronUp, History, Loader2, X } from "lucide-react";
import { cn } from "@/components/dna";
import { typeConfig } from "@/lib/changelogConfig";
import { ChangelogEntryCard } from "./ChangelogEntryCard";
import type { ChangelogPage, ChangelogPublicEntry, ChangelogVersionRef } from "@/lib/changelog/types";

/**
 * Journal des versions, chargé au fil du défilement.
 *
 * Le journal grossit d'une entrée par version : tout afficher d'un coup finit
 * par coûter cher pour un contenu que presque personne ne lit jusqu'en bas. On
 * charge donc par paliers, et on ajoute un sélecteur pour atteindre une version
 * précise sans avoir à dérouler jusqu'à elle.
 *
 * La première page arrive rendue par le serveur : le contenu est visible et
 * indexable sans attendre le JavaScript.
 */
export function ChangelogFeed({
  initial,
  versions,
}: {
  initial: ChangelogPage;
  versions: ChangelogVersionRef[];
}) {
  const t = useTranslations("changelog");
  const locale = useLocale();

  const [entries, setEntries] = useState<ChangelogPublicEntry[]>(initial.entries);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  // Évite qu'un observateur trop zélé déclenche deux chargements pour le même
  // curseur pendant que la requête est en vol.
  const inFlight = useRef(false);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !cursor) return;
    inFlight.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const params = new URLSearchParams({ locale, cursor });
      const response = await fetch(`/api/changelog?${params}`);
      if (!response.ok) throw new Error("réponse invalide");
      const page = (await response.json()) as ChangelogPage;
      setEntries((previous) => {
        // Une même version ne doit jamais apparaître deux fois, même si un
        // curseur est rejoué (retour arrière, double déclenchement).
        const seen = new Set(previous.map((e) => e.version));
        return [...previous, ...page.entries.filter((e) => !seen.has(e.version))];
      });
      setCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [cursor, locale]);

  // Sentinelle de bas de liste. `rootMargin` déclenche le chargement avant
  // d'atteindre le bord, pour que la suite soit déjà là quand on y arrive.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor) return;
    const observer = new IntersectionObserver(
      (observed) => {
        if (observed[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  /**
   * Après un saut, la liste ne contient plus que la version visée et les
   * suivantes : remonter ne suffit pas à retrouver les versions récentes. Le
   * bouton « revenir en haut » doit donc aussi remettre le fil à son début.
   */
  const jumped = entries.length > 0 && initial.entries.length > 0 && entries[0].version !== initial.entries[0].version;

  const backToTop = useCallback(() => {
    if (jumped) {
      setEntries(initial.entries);
      setCursor(initial.nextCursor);
      setFailed(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [jumped, initial]);

  /** Saut rapide : on repart de la version visée et on remonte à sa carte. */
  const jumpTo = useCallback(
    async (version: string) => {
      setPickerOpen(false);
      const already = entries.some((e) => e.version === version);
      if (already) {
        document.getElementById(`v${version}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      setLoading(true);
      setFailed(false);
      try {
        const params = new URLSearchParams({ locale, start: version });
        const response = await fetch(`/api/changelog?${params}`);
        if (!response.ok) throw new Error("réponse invalide");
        const page = (await response.json()) as ChangelogPage;
        setEntries(page.entries);
        setCursor(page.nextCursor);
        // Le rendu doit avoir eu lieu avant de viser l'ancre.
        requestAnimationFrame(() => {
          document.getElementById(`v${version}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [entries, locale],
  );

  return (
    <>
      <div className="space-y-6">
        {entries.map((entry) => (
          <ChangelogEntryCard key={entry.version} entry={entry} />
        ))}
      </div>

      {/* Zone de chargement : sentinelle, état, et reprise manuelle en cas
          d'échec réseau — sans quoi le fil resterait bloqué en silence. */}
      <div ref={sentinelRef} className="flex min-h-16 items-center justify-center py-6">
        {loading ? (
          <span className="inline-flex items-center gap-2 font-sans text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loadingMore")}
          </span>
        ) : failed ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="border border-crimson-bright/40 px-4 py-2 font-sans text-sm text-[#ffb3a6] transition-colors hover:border-crimson-bright"
          >
            {t("loadFailed")}
          </button>
        ) : cursor === null && entries.length > 0 ? (
          <span className="font-caps text-[0.58rem] uppercase tracking-[0.18em] text-muted-2">{t("feedEnd")}</span>
        ) : null}
      </div>

      <VersionPicker
        versions={versions}
        open={pickerOpen}
        jumped={jumped}
        onToggle={() => setPickerOpen((v) => !v)}
        onPick={(version) => void jumpTo(version)}
        onBackToTop={backToTop}
      />
    </>
  );
}

/**
 * Sélecteur de version, flottant en bas à droite.
 *
 * Il double la navigation par défilement : dix-neuf entrées aujourd'hui, mais
 * la liste ne fera que grandir, et chercher « la version où telle chose a
 * changé » en déroulant est vite pénible.
 */
function VersionPicker({
  versions,
  open,
  jumped,
  onToggle,
  onPick,
  onBackToTop,
}: {
  versions: ChangelogVersionRef[];
  open: boolean;
  /** Vrai quand le fil a été déplacé sur une version ancienne. */
  jumped: boolean;
  onToggle: () => void;
  onPick: (version: string) => void;
  onBackToTop: () => void;
}) {
  const t = useTranslations("changelog");
  const locale = useLocale();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) onToggle();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onToggle();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onToggle]);

  if (versions.length === 0) return null;

  // Regroupement par année : c'est le repère naturel pour retrouver une version.
  const byYear = new Map<string, ChangelogVersionRef[]>();
  for (const version of versions) {
    const year = version.date.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(version);
  }

  return (
    <div ref={wrapRef} className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div
          role="dialog"
          aria-label={t("versionPickerTitle")}
          className="max-h-[60vh] w-64 overflow-y-auto border border-line/30 bg-panel shadow-[0_18px_44px_rgba(0,0,0,0.7)] custom-scrollbar"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-line/20 bg-panel px-3 py-2">
            <span className="font-caps text-[0.58rem] uppercase tracking-[0.18em] text-gold">
              {t("versionPickerTitle")}
            </span>
            <button
              type="button"
              onClick={onToggle}
              aria-label={t("versionPickerClose")}
              className="text-muted transition-colors hover:text-gold"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {[...byYear.entries()].map(([year, list]) => (
            <div key={year}>
              <p className="border-b border-line/10 bg-white/[0.02] px-3 py-1 font-mono text-[0.62rem] text-muted-2">
                {year}
              </p>
              {list.map((version) => {
                const config = typeConfig[version.type];
                return (
                  <button
                    key={version.version}
                    type="button"
                    onClick={() => onPick(version.version)}
                    className="flex w-full items-center gap-2.5 border-b border-line/10 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-white/5"
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.bgColor)} aria-hidden />
                    <span className="font-caps text-[0.72rem] text-gold">v{version.version}</span>
                    <span className="ml-auto font-mono text-[0.62rem] text-muted-2">
                      {new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(
                        new Date(`${version.date}T12:00:00Z`),
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBackToTop}
          aria-label={jumped ? t("backToLatest") : t("backToTop")}
          title={jumped ? t("backToLatest") : t("backToTop")}
          className={cn(
            "grid h-10 w-10 place-items-center border shadow-lg transition-colors",
            jumped
              ? "border-gold/50 bg-gold/10 text-gold-bright hover:border-gold"
              : "border-line/30 bg-panel text-parch/70 hover:border-gold hover:text-gold",
          )}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          ref={buttonRef}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={t("versionPickerTitle")}
          className={cn(
            "inline-flex h-10 items-center gap-2 border px-3 shadow-lg transition-colors",
            open
              ? "border-gold bg-gold/15 text-gold-bright"
              : "border-line/30 bg-panel text-parch/80 hover:border-gold hover:text-gold",
          )}
        >
          <History className="h-4 w-4" />
          <span className="font-caps text-[0.6rem] uppercase tracking-[0.16em]">{t("versionPickerButton")}</span>
        </button>
      </div>
    </div>
  );
}
