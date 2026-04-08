"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, LANGUAGE_LABELS } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function LanguageSwitcher() {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200"
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase font-medium">{locale}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-indigo-500/20 rounded-lg shadow-xl overflow-hidden z-50 min-w-[160px]">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                l === locale
                  ? "bg-indigo-500/20 text-indigo-300 font-medium"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="uppercase font-mono text-xs w-5">{l}</span>
              <span>{LANGUAGE_LABELS[l.toUpperCase()]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
