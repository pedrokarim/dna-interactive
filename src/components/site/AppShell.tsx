"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AtSign,
  Bell,
  Bot,
  Boxes,
  Hammer,
  Home,
  Info,
  Layers,
  LayoutGrid,
  LifeBuoy,
  Map as MapIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Sparkles,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { DnaCornerBrackets, DnaNotifDot, DnaNouveau, DnaPill, cn } from "@/components/dna";

/* ------------------------------------------------------------------ nav data */

type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "new" | "beta";
  external?: boolean;
};

const NAV_PRIMARY: NavEntry[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/map", label: "Carte interactive", icon: MapIcon },
  { href: "/characters", label: "Personnages", icon: Users },
  { href: "/items", label: "Base de données", icon: Boxes },
  { href: "/builder", label: "Builder", icon: Hammer, badge: "new" },
  { href: "/builds", label: "Builds communauté", icon: Layers },
  { href: "/commissions", label: "Commissions", icon: ScrollText, badge: "beta" },
  { href: "/codes", label: "Codes de rédemption", icon: Ticket },
];

const NAV_SECONDARY: NavEntry[] = [
  { href: "/features", label: "Fonctionnalités", icon: LayoutGrid },
  { href: "/changelog", label: "Changelog", icon: Sparkles },
  { href: "/about", label: "À propos", icon: Info },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

const NAV_EXTERNAL: NavEntry[] = [
  { href: "https://discord.gg", label: "Discord", icon: Bot, external: true },
  { href: "https://x.com/ascencia64", label: "Twitter / X", icon: AtSign, external: true },
];

/* --------------------------------------------------- persistance état sidebar */

const STORAGE_KEY = "dna:sidebar-collapsed";

/** État booléen persistant en localStorage, sûr côté SSR (applique après montage). */
function usePersistentBool(key: string, initial: boolean) {
  const [value, setValue] = useState(initial);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(raw === "1");
    } catch {
      /* stockage indisponible : on garde la valeur par défaut */
    }
  }, [key]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(key, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [key, value, mounted]);

  return [value, setValue, mounted] as const;
}

/* ----------------------------------------------------------------- primitives */

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarBadge({ kind, collapsed }: { kind: "new" | "beta"; collapsed: boolean }) {
  if (collapsed) {
    return (
      <span
        aria-hidden
        className={cn(
          "absolute right-1 top-1 h-1.5 w-1.5 rounded-full",
          kind === "new" ? "bg-gold-bright shadow-[0_0_6px_#e3cd95]" : "bg-hydro shadow-[0_0_6px_#5fa8ff]",
        )}
      />
    );
  }
  if (kind === "new") return <DnaNouveau className="ml-auto shrink-0">Nouveau</DnaNouveau>;
  return (
    <span className="ml-auto shrink-0 rounded-sm border border-hydro/40 bg-hydro/10 px-1.5 py-0.5 font-caps text-[0.5rem] uppercase tracking-[0.16em] text-hydro">
      Bêta
    </span>
  );
}

function SidebarLink({
  entry,
  active,
  collapsed,
  onNavigate,
}: {
  entry: NavEntry;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = entry.icon;
  const className = cn(
    "group relative flex items-center rounded-sm border font-caps text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
    collapsed ? "h-10 w-10 justify-center" : "gap-3 px-3 py-2",
    active
      ? "border-gold/35 bg-gold/12 text-gold-bright"
      : "border-transparent text-parch/75 hover:border-line/25 hover:bg-panel/60 hover:text-gold",
  );
  const inner = (
    <>
      <Icon aria-hidden className="h-4 w-4 shrink-0 opacity-90" />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{entry.label}</span>}
      {entry.badge ? <SidebarBadge kind={entry.badge} collapsed={collapsed} /> : null}
    </>
  );
  const title = collapsed ? entry.label : undefined;

  if (entry.external) {
    return (
      <a href={entry.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate} title={title}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={entry.href} className={className} onClick={onNavigate} title={title}>
      {inner}
    </Link>
  );
}

function Sidebar({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const sep = <span aria-hidden className="h-px bg-gradient-to-r from-line/25 via-line/10 to-transparent" />;
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-4 custom-scrollbar">
      {/* profil */}
      <div
        className={cn(
          "relative flex items-center rounded-sm border border-line/20 bg-panel/70",
          collapsed ? "justify-center p-2" : "gap-3 p-3",
        )}
      >
        {!collapsed && <DnaCornerBrackets size={10} />}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-display text-sm text-gold-bright">
          K
        </span>
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate font-display text-sm text-parch">pedrokarim</span>
            <span className="block font-caps text-[0.55rem] uppercase tracking-[0.2em] text-muted">Voyageur · Lv.XX</span>
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_PRIMARY.map((e) => (
          <SidebarLink key={e.href + e.label} entry={e} active={isActive(pathname, e.href)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      {sep}

      <nav className="flex flex-col gap-1">
        {NAV_SECONDARY.map((e) => (
          <SidebarLink key={e.href + e.label} entry={e} active={isActive(pathname, e.href)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      {sep}

      <nav className="mt-auto flex flex-col gap-1">
        {NAV_EXTERNAL.map((e) => (
          <SidebarLink key={e.href + e.label} entry={e} active={isActive(pathname, e.href)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}

/* --------------------------------------------------------------- AppShell */

export type AppShellProps = {
  children: ReactNode;
  /** Fil d'ariane mono dans la topbar (ex. "//OPERATOR.DATABASE"). */
  breadcrumb?: string;
};

/**
 * Coquille applicative du hub DNA : barre latérale persistante (repliable) +
 * topbar + footer, contenu pleine largeur. Enveloppe le contenu de chaque page.
 */
export function AppShell({ children, breadcrumb = "//COMMUNITY.HUB" }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed, mounted] = usePersistentBool(STORAGE_KEY, false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  // Ferme le drawer mobile au changement de route.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-linear-to-br from-ink via-panel to-ink text-parch">
      {/* ---------------------------------------------------------- SIDEBAR desktop */}
      <aside
        className={cn(
          "hidden border-r border-line/15 bg-ink/70 backdrop-blur-sm lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block",
          mounted && "transition-[width] duration-200",
          collapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        <Sidebar pathname={pathname} collapsed={collapsed} />
      </aside>

      {/* ---------------------------------------------------------- SIDEBAR mobile (drawer) */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-line/25 bg-ink shadow-[0_0_60px_rgba(0,0,0,0.7)]">
            <button
              type="button"
              aria-label="Fermer"
              onClick={closeDrawer}
              className="absolute right-3 top-4 z-10 text-parch/70 hover:text-gold"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar pathname={pathname} collapsed={false} onNavigate={closeDrawer} />
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- CONTENU */}
      <div
        className={cn(
          "flex min-h-screen flex-col",
          mounted && "transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        {/* -------------------------------------------------------- TOPBAR */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line/15 bg-ink/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-line/25 text-parch/80 hover:border-gold hover:text-gold lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          {/* Toggle repli de la barre latérale (desktop) — dans le header, façon réf */}
          <button
            type="button"
            aria-label={collapsed ? "Déployer la barre latérale" : "Replier la barre latérale"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((v) => !v)}
            className="hidden h-9 w-9 items-center justify-center rounded-sm border border-line/25 text-parch/70 hover:border-gold hover:text-gold lg:flex"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          <div className="flex min-w-0 items-baseline gap-3">
            <span className="font-caps text-sm uppercase tracking-[0.28em] text-gold-bright">DNA</span>
            <span className="hidden truncate font-mono text-[0.7rem] text-muted sm:inline">{breadcrumb}</span>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <DnaPill>DNA v1.4</DnaPill>
            <span className="hidden items-center gap-1.5 rounded-sm border border-line/25 px-2.5 py-1.5 font-caps text-[0.6rem] uppercase tracking-[0.16em] text-parch/80 sm:inline-flex">
              🌐 FR
            </span>
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-sm border border-line/25 text-parch/70 hover:border-gold hover:text-gold"
            >
              <Bell className="h-4 w-4" />
              <DnaNotifDot className="absolute right-2 top-2" />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-display text-sm text-gold-bright">
              K
            </span>
          </div>
        </header>

        {/* -------------------------------------------------------- CONTENU PAGE */}
        <main className="flex-1">{children}</main>

        {/* -------------------------------------------------------- FOOTER */}
        <footer className="mt-8 border-t border-line/15 bg-ink/60 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1720px] flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-gold">DNA Interactive</span>
              <span className="text-muted-2">·</span>
              <span>© 2025-2026</span>
              <span className="text-muted-2">·</span>
              <span>Companion communautaire non officiel — Duet Night Abyss</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/about" className="hover:text-gold">À propos</Link>
              <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="hover:text-gold">Discord</a>
              <Link href="/confidentialite" className="hover:text-gold">Confidentialité</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
