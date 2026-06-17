"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X, Map, Gift, Info, HelpCircle, Mail, Boxes, Users, ScrollText, Hammer } from "lucide-react";
import { NAV_LINKS, NAVIGATION, SITE_CONFIG, ASSETS_PATHS } from "@/lib/constants";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { DnaNouveau } from "@/components/dna/Badges";

const navIcons = {
  [NAVIGATION.map]: Map,
  [NAVIGATION.items]: Boxes,
  [NAVIGATION.characters]: Users,
  [NAVIGATION.builder]: Hammer,
  [NAVIGATION.commissions]: ScrollText,
  [NAVIGATION.codes]: Gift,
  [NAVIGATION.about]: Info,
  [NAVIGATION.support]: HelpCircle,
  [NAVIGATION.contact]: Mail,
};

const navTranslationKeys: Record<string, string> = {
  [NAVIGATION.map]: "map",
  [NAVIGATION.items]: "items",
  [NAVIGATION.characters]: "characters",
  [NAVIGATION.builder]: "builder",
  [NAVIGATION.commissions]: "commissions",
  [NAVIGATION.codes]: "codes",
  [NAVIGATION.about]: "about",
  [NAVIGATION.support]: "support",
  [NAVIGATION.contact]: "contact",
};

function subscribeMounted() {
  return () => undefined;
}

export default function MobileMenu() {
  const tNav = useTranslations("nav");
  const openLabel = "Menu";
  const closeLabel = "Fermer";
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const pathname = usePathname();

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

  // The drawer + backdrop must be rendered into document.body via a portal,
  // otherwise the surrounding `<header>` (which uses `backdrop-blur`) creates
  // a containing block that traps `position: fixed` descendants and shrinks
  // the drawer to the header's height.
  const overlay = (
    <div className="md:hidden">
      <div
        className={`fixed inset-0 z-[60] bg-ink/80 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-menu-drawer"
        className={`fixed inset-y-0 right-0 z-[70] flex w-[85%] max-w-sm flex-col border-l border-gold/25 bg-ink shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={openLabel}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gold/20 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src={ASSETS_PATHS.logo}
              alt={`${SITE_CONFIG.name} logo`}
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="font-display text-lg text-parch">
              {SITE_CONFIG.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-parch/85 transition-colors hover:bg-panel hover:text-parch"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = navIcons[link.href];
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-sm px-3 py-3 text-base transition-colors ${
                      active
                        ? "bg-gold/15 text-gold border border-gold/30"
                        : "text-parch hover:bg-panel/70 hover:text-parch border border-transparent"
                    }`}
                  >
                    {Icon && <Icon className="h-5 w-5 shrink-0" />}
                    <span>{tNav(navTranslationKeys[link.href] ?? "home")}</span>
                    {link.href === NAVIGATION.commissions ? (
                      <DnaNouveau className="ml-auto" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gold/20 px-4 py-4">
          <LanguageSwitcher direction="up" align="start" />
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/30 bg-panel/60 text-parch transition-colors hover:border-gold/60 hover:bg-panel hover:text-parch md:hidden"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-drawer"
        aria-label={openLabel}
      >
        <Menu className="h-5 w-5" />
      </button>
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
