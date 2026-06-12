"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, LANGUAGE_LABELS } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { useState, useRef, useEffect } from "react";
import FR from "country-flag-icons/react/3x2/FR";
import US from "country-flag-icons/react/3x2/US";
import DE from "country-flag-icons/react/3x2/DE";
import ES from "country-flag-icons/react/3x2/ES";
import JP from "country-flag-icons/react/3x2/JP";
import KR from "country-flag-icons/react/3x2/KR";
import TW from "country-flag-icons/react/3x2/TW";

const LOCALE_FLAGS: Record<Locale, React.ComponentType<{ className?: string; title?: string }>> = {
  fr: FR,
  en: US,
  de: DE,
  es: ES,
  jp: JP,
  kr: KR,
  tc: TW,
};

export default function LanguageSwitcher({
  direction = "down",
  align = "end",
}: {
  direction?: "up" | "down";
  align?: "start" | "end";
} = {}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(newLocale: Locale) {
    setIsOpen(false);
    // Persister le choix — le middleware next-intl lit ce cookie
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    router.replace(pathname, { locale: newLocale });
  }

  const ActiveFlag = LOCALE_FLAGS[locale as Locale] ?? FR;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 text-parch/85 hover:text-parch bg-white/5 hover:bg-white/10 border border-line/15 hover:border-gold/40 transition-all duration-200"
      >
        <ActiveFlag className="h-4 w-6 shadow-sm" title={LANGUAGE_LABELS[locale.toUpperCase()] ?? locale} />
        <span className="font-caps text-[0.7rem] uppercase tracking-[0.12em]">{locale}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === "start" ? "left-0" : "right-0"} ${
            direction === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } bg-panel border border-line/20 shadow-[0_12px_30px_rgba(0,0,0,0.6)] overflow-hidden z-50 min-w-[180px]`}
        >
          {locales.map((l) => {
            const Flag = LOCALE_FLAGS[l] ?? FR;
            return (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  l === locale
                    ? "bg-gold/20 text-gold font-medium"
                    : "text-parch/85 hover:bg-white/5 hover:text-parch"
                }`}
              >
                <Flag className="h-4 w-6 shrink-0 rounded-sm shadow-sm" title={LANGUAGE_LABELS[l.toUpperCase()] ?? l} />
                <span>{LANGUAGE_LABELS[l.toUpperCase()]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
