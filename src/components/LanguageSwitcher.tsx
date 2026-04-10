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
        className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200"
      >
        <ActiveFlag className="h-4 w-6 rounded-sm shadow-sm" title={LANGUAGE_LABELS[locale.toUpperCase()] ?? locale} />
        <span className="uppercase font-medium">{locale}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === "start" ? "left-0" : "right-0"} ${
            direction === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } bg-slate-900 border border-indigo-500/20 rounded-lg shadow-xl overflow-hidden z-50 min-w-[180px]`}
        >
          {locales.map((l) => {
            const Flag = LOCALE_FLAGS[l] ?? FR;
            return (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  l === locale
                    ? "bg-indigo-500/20 text-indigo-300 font-medium"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
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
