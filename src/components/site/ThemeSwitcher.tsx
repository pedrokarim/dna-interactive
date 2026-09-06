"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/components/dna";
import {
  LIGHT_MEDIA_QUERY,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  readThemePreference,
  resolveTheme,
  type ThemePreference,
} from "@/lib/theme";

const PREFERENCE_ICONS: Record<ThemePreference, LucideIcon> = {
  auto: Monitor,
  light: Sun,
  dark: Moon,
};

/**
 * Bascule clair / sombre, à côté du sélecteur de langue.
 *
 * L'icône du bouton n'est pas choisie par React : les deux sont rendues et le
 * CSS n'en montre qu'une selon `data-theme` (cf. `.dna-when-light` /
 * `.dna-when-dark`). Le bouton est donc juste dès la première peinture, sans
 * attendre l'hydratation — le serveur, lui, ne peut pas connaître le thème.
 */
export function ThemeSwitcher({ align = "end" }: { align?: "start" | "end" } = {}) {
  const t = useTranslations("shell");
  const [open, setOpen] = useState(false);
  // `null` tant que l'hydratation n'a pas eu lieu : le stockage local n'existe
  // pas côté serveur, et afficher une préférence fausse cocherait la mauvaise
  // ligne du menu.
  const [preference, setPreference] = useState<ThemePreference | null>(null);
  const panelId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreference(readThemePreference());
  }, []);

  // Le choix « auto » doit suivre le système en direct, sans rechargement.
  useEffect(() => {
    if (preference !== "auto") return;
    const media = window.matchMedia(LIGHT_MEDIA_QUERY);
    const sync = () => applyResolvedTheme(media.matches ? "light" : "dark");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [preference]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: ThemePreference) {
    setPreference(next);
    setOpen(false);
    applyResolvedTheme(resolveTheme(next));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* stockage indisponible : le choix reste valable pour la session */
    }
  }

  const labels: Record<ThemePreference, string> = {
    auto: t("themeAuto"),
    light: t("themeLight"),
    dark: t("themeDark"),
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("theme")}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-sm border border-line/25 text-parch/80 transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <Sun aria-hidden className="dna-when-light h-4 w-4" />
        <Moon aria-hidden className="dna-when-dark h-4 w-4" />
      </button>

      {open ? (
        <div
          id={panelId}
          role="menu"
          aria-label={t("theme")}
          className={cn(
            "absolute top-full z-50 mt-2 min-w-44 overflow-hidden rounded-sm border border-line/25 bg-panel shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {THEME_PREFERENCES.map((value) => {
            const Icon = PREFERENCE_ICONS[value];
            const active = preference === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(value)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left font-caps text-[0.62rem] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60",
                  active ? "bg-gold/12 text-gold-bright" : "text-parch/75 hover:bg-ink-2/60 hover:text-gold",
                )}
              >
                <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 opacity-90" />
                <span className="flex-1">{labels[value]}</span>
                {active ? <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-gold-bright" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
