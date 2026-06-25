"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Home,
  Map,
  LayoutGrid,
  Info,
  Users,
  Boxes,
  Hammer,
  Layers,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { NAVIGATION } from "@/lib/constants";
import { DnaIconWithBadge } from "@/components/dna/Badges";
import { cn } from "@/components/dna/cn";

/** Élément du menu déroulant « Fonctionnalités ». */
type FeatureItem = { href: string; key: string; icon: LucideIcon; isNew?: boolean };

const FEATURE_ITEMS: FeatureItem[] = [
  { href: NAVIGATION.characters, key: "characters", icon: Users },
  { href: NAVIGATION.items, key: "items", icon: Boxes },
  { href: NAVIGATION.builder, key: "builder", icon: Hammer, isNew: true },
  { href: NAVIGATION.builds, key: "builds", icon: Layers },
  { href: NAVIGATION.commissions, key: "commissions", icon: ScrollText, isNew: true },
];

const HAS_NEW = FEATURE_ITEMS.some((i) => i.isNew);

const linkClass = (active: boolean) =>
  cn(
    "relative inline-flex items-center gap-2 whitespace-nowrap font-caps text-[0.72rem] uppercase tracking-[0.18em] transition-colors",
    active ? "text-gold-bright" : "text-parch/80 hover:text-gold",
  );

function ActiveUnderline() {
  return <span aria-hidden className="absolute -bottom-1.5 left-0 right-0 h-px bg-gold-bright/70" />;
}

export default function DesktopNav({ active }: { active?: string }) {
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const menuId = useId();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const featureActive = FEATURE_ITEMS.some((i) => i.href === active);

  // Fermeture au changement de route.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Fermeture au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const openAndFocus = (index: number) => {
    setOpen(true);
    requestAnimationFrame(() => itemsRef.current[index]?.focus());
  };

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAndFocus(0);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const onItemKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemsRef.current[(index + 1) % FEATURE_ITEMS.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemsRef.current[(index - 1 + FEATURE_ITEMS.length) % FEATURE_ITEMS.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      itemsRef.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itemsRef.current[FEATURE_ITEMS.length - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <nav className="flex items-center gap-3 xl:gap-6">
      {/* Accueil */}
      <Link href={NAVIGATION.home} className={linkClass(active === NAVIGATION.home)}>
        <DnaIconWithBadge icon={Home} />
        <span>{tNav("home")}</span>
        {active === NAVIGATION.home ? <ActiveUnderline /> : null}
      </Link>

      {/* Carte interactive */}
      <Link href={NAVIGATION.map} className={linkClass(active === NAVIGATION.map)}>
        <DnaIconWithBadge icon={Map} />
        <span>{tNav("map")}</span>
        {active === NAVIGATION.map ? <ActiveUnderline /> : null}
      </Link>

      {/* Fonctionnalités (dropdown) */}
      <div
        ref={wrapRef}
        className="relative"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        <button
          ref={buttonRef}
          type="button"
          className={linkClass(featureActive)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onButtonKeyDown}
        >
          <DnaIconWithBadge icon={LayoutGrid} isNew={HAS_NEW} />
          <span>{tNav("features")}</span>
          <ChevronDown aria-hidden className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
          {featureActive ? <ActiveUnderline /> : null}
        </button>

        <div
          id={menuId}
          role="menu"
          aria-label={tNav("features")}
          className={cn(
            "absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-60 origin-top-right rounded-sm border border-gold/25 bg-ink/95 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-md transition-[opacity,transform] duration-150",
            open ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1",
          )}
        >
          {/* filet doré supérieur */}
          <span aria-hidden className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          {FEATURE_ITEMS.map((item, index) => {
            const isActive = item.href === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => {
                  itemsRef.current[index] = el;
                }}
                role="menuitem"
                tabIndex={open ? 0 : -1}
                onKeyDown={(e) => onItemKeyDown(e, index)}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-sm border px-3 py-2.5 font-caps text-[0.7rem] uppercase tracking-[0.14em] transition-colors",
                  isActive
                    ? "border-gold/30 bg-gold/15 text-gold-bright"
                    : "border-transparent text-parch/85 hover:bg-panel/70 hover:text-gold",
                )}
              >
                <DnaIconWithBadge icon={item.icon} isNew={item.isNew} className="h-4 w-4 opacity-80" />
                <span className="flex-1">{tNav(item.key)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* À propos */}
      <Link href={NAVIGATION.about} className={linkClass(active === NAVIGATION.about)}>
        <DnaIconWithBadge icon={Info} />
        <span>{tNav("about")}</span>
        {active === NAVIGATION.about ? <ActiveUnderline /> : null}
      </Link>
    </nav>
  );
}
