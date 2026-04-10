"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X, Map, Gift, Info, HelpCircle, Mail, Boxes, Users } from "lucide-react";
import { NAV_LINKS, NAVIGATION, SITE_CONFIG, ASSETS_PATHS } from "@/lib/constants";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const navIcons = {
  [NAVIGATION.map]: Map,
  [NAVIGATION.items]: Boxes,
  [NAVIGATION.characters]: Users,
  [NAVIGATION.codes]: Gift,
  [NAVIGATION.about]: Info,
  [NAVIGATION.support]: HelpCircle,
  [NAVIGATION.contact]: Mail,
};

const navTranslationKeys: Record<string, string> = {
  [NAVIGATION.map]: "map",
  [NAVIGATION.items]: "items",
  [NAVIGATION.characters]: "characters",
  [NAVIGATION.codes]: "codes",
  [NAVIGATION.about]: "about",
  [NAVIGATION.support]: "support",
  [NAVIGATION.contact]: "contact",
};

export default function MobileMenu() {
  const tNav = useTranslations("nav");
  const openLabel = "Menu";
  const closeLabel = "Fermer";
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on escape key + body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/30 bg-slate-900/60 text-slate-200 transition-colors hover:border-indigo-400/60 hover:bg-slate-800 hover:text-white md:hidden"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-drawer"
        aria-label={openLabel}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        id="mobile-menu-drawer"
        className={`fixed inset-y-0 right-0 z-[70] flex w-[85%] max-w-sm flex-col border-l border-indigo-500/25 bg-slate-950 shadow-[0_0_60px_rgba(15,23,42,0.8)] transition-transform duration-300 ease-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={openLabel}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-indigo-500/20 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src={ASSETS_PATHS.logo}
              alt={`${SITE_CONFIG.name} logo`}
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-base font-semibold text-white">
              {SITE_CONFIG.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = navIcons[link.href];
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors ${
                      active
                        ? "bg-indigo-500/15 text-indigo-100 border border-indigo-400/30"
                        : "text-slate-200 hover:bg-slate-800/70 hover:text-white border border-transparent"
                    }`}
                  >
                    {Icon && <Icon className="h-5 w-5 shrink-0" />}
                    <span>{tNav(navTranslationKeys[link.href] ?? "home")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with language switcher */}
        <div className="border-t border-indigo-500/20 px-4 py-4">
          <LanguageSwitcher />
        </div>
      </aside>
    </>
  );
}
