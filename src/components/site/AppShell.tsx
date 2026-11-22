"use client";

import { useCallback, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronsLeft, ChevronsRight, ClipboardList, Drama, Info, Menu, X, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import { DnaAmbientBackdrop, DnaNewTab, DnaPill, DnaSectionMark, cn, useDialogA11y } from "@/components/dna";
import { SidebarProfile, TopbarAccount } from "@/components/auth/AccountControls";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/site/ThemeSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SiteBanner } from "@/components/site/SiteBanner";
import { useAppSettings } from "@/lib/settings/useAppSettings";
import { ASSETS_PATHS, GAME_INFO, GAME_VERSION, NAVIGATION, SITE_CONFIG } from "@/lib/constants";
import { DISCORD_BUTTON_CLASS, DiscordIcon, X_BUTTON_CLASS, XIcon } from "@/components/icons/BrandIcons";
import { GameGlyph, isGameGlyph } from "@/components/icons/GameGlyph";
import {
  SHELL_NAV_EXTERNAL,
  SHELL_NAV_PRIMARY,
  SHELL_NAV_SECONDARY,
  resolveBreadcrumb,
  shellAppliesTo,
  type ShellBadge,
  type ShellNavEntry,
} from "@/lib/shell";

/* ------------------------------------------------------------------ icônes */

/**
 * Icône par clé de navigation. Hors de `lib/shell`, pour que la config des
 * routes s'importe côté serveur sans tirer de composant.
 */
const NAV_ICONS: Record<string, LucideIcon | typeof DiscordIcon | typeof XIcon> = {
  discord: DiscordIcon,
  twitter: XIcon,
  // Pas encore de glyphe du jeu pour le théâtre : une icône Lucide en attendant.
  theatre: Drama,
  // Idem pour le planificateur de farm.
  planner: ClipboardList,
};

/**
 * Les entrées internes prennent le glyphe du jeu qui porte le nom de leur clé
 * (`GameGlyph`). Les liens de marque (Discord, X) gardent leur logo.
 */

/* ------------------------------------------------------- fond atmosphérique */

/**
 * Visuels du fond, dans leur ordre de passage : les panoramiques officiels du
 * jeu (worldview), les plus récents d'abord. Même liste que
 * `ASSETS_PATHS.worldview`, sans le fond de la 1.3 qui n'en est pas un.
 *
 * Constante de module : la liste sert de dépendance à l'horloge du composant
 * et doit garder la même identité d'un rendu à l'autre.
 */
const AMBIENT_FRAMES = ASSETS_PATHS.worldview.filter((src) => src.startsWith("/assets/worldview/"));

/* --------------------------------------------------- persistance état sidebar */

const STORAGE_KEY = "dna:sidebar-collapsed";

/**
 * État replié de la barre latérale.
 *
 * L'état vit dans `data-sidebar` sur <html>, posé par le script inline du
 * layout avant la première peinture (voir globals.css) : la mise en page est
 * juste dès le premier rendu, sans saut après hydratation. React lit cet
 * attribut avec `useSyncExternalStore`, seulement pour aria-expanded et les
 * infobulles : le visuel est déjà géré par le CSS.
 */
const sidebarListeners = new Set<() => void>();

function subscribeSidebar(listener: () => void) {
  sidebarListeners.add(listener);
  return () => {
    sidebarListeners.delete(listener);
  };
}

function isSidebarCollapsed() {
  return document.documentElement.dataset.sidebar === "collapsed";
}

/** Côté serveur, l'attribut n'existe pas encore : barre déployée. */
function isSidebarCollapsedOnServer() {
  return false;
}

function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribeSidebar, isSidebarCollapsed, isSidebarCollapsedOnServer);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = !isSidebarCollapsed();
    if (next) root.dataset.sidebar = "collapsed";
    else delete root.dataset.sidebar;
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* stockage indisponible : le repli tient quand même jusqu'au rechargement */
    }
    for (const listener of sidebarListeners) listener();
  }, []);

  return [collapsed, toggle] as const;
}

/* ----------------------------------------------------------------- primitives */

/** `/items` couvre `/items` et `/items/…` ; `/` n'est actif que sur `/`. */
function isActive(pathname: string, href: string) {
  if (href === NAVIGATION.home) return pathname === NAVIGATION.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Marque, en tête de la barre latérale.
 *
 * Le nom passe par `dna-sidebar-label` : replié, il est caché à l'écran mais
 * reste dans l'arbre d'accessibilité. Sinon le lien vers l'accueil n'aurait
 * plus de nom (le logo est décoratif, `alt=""`).
 */
function SidebarBrand() {
  const t = useTranslations("shell");
  return (
    <Link
      href={NAVIGATION.home}
      className="dna-sidebar-brand group flex items-center gap-3 rounded-sm px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60"
      title={t("backHome")}
    >
      <Image
        src={ASSETS_PATHS.logo}
        alt=""
        width={36}
        height={36}
        priority
        className="h-9 w-9 shrink-0 rounded-sm object-contain"
      />
      <span className="dna-sidebar-label flex min-w-0 flex-col">
        <span className="truncate font-display text-lg leading-tight text-parch transition-colors group-hover:text-gold-bright">
          {SITE_CONFIG.name}
        </span>
        <span className="truncate font-caps text-[0.5rem] uppercase tracking-[0.22em] text-muted">
          {GAME_INFO.name}
        </span>
      </span>
    </Link>
  );
}

function SidebarBadge({ kind, label }: { kind: ShellBadge; label: string }) {
  return (
    <>
      <span className="dna-when-expanded ml-auto shrink-0">
        {kind === "new" ? (
          <DnaNewTab>{label}</DnaNewTab>
        ) : (
          <span className="rounded-sm border border-hydro/40 bg-hydro/10 px-1.5 py-0.5 font-caps text-[0.5rem] uppercase tracking-[0.16em] text-hydro">
            {label}
          </span>
        )}
      </span>
      {/* Barre repliée : la pastille devient un point. Le libellé reste dans le
          texte du lien, caché à l'écran mais lu par les lecteurs d'écran. */}
      <span
        aria-hidden
        className={cn(
          "dna-when-collapsed absolute right-1 top-1 h-1.5 w-1.5 rounded-full",
          kind === "new" ? "bg-gold-bright shadow-[0_0_6px_#e3cd95]" : "bg-hydro shadow-[0_0_6px_#5fa8ff]",
        )}
      />
    </>
  );
}

function SidebarLink({
  entry,
  label,
  badge,
  badgeLabel,
  active,
  collapsed,
  newTabHint,
  onNavigate,
}: {
  entry: ShellNavEntry;
  label: string;
  badge?: ShellBadge;
  badgeLabel: string;
  active: boolean;
  collapsed: boolean;
  newTabHint: string;
  onNavigate?: () => void;
}) {
  const Icon = NAV_ICONS[entry.key] ?? Info;
  const glyph = !entry.external && isGameGlyph(entry.key) ? entry.key : null;
  const brandButtonClass =
    entry.key === "discord" ? DISCORD_BUTTON_CLASS : entry.key === "twitter" ? X_BUTTON_CLASS : null;
  const className = cn(
    "dna-sidebar-link group relative flex items-center gap-3 rounded-sm border px-3 py-2 font-caps text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
    // Anneau `inset` : replié, le lien fait 40px dans un conteneur qui défile,
    // un anneau extérieur serait rogné.
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60",
    brandButtonClass
      ? brandButtonClass
      : active
      ? "border-gold/35 bg-gold/12 text-gold-bright"
      : "border-transparent text-parch/75 hover:border-line/25 hover:bg-panel/60 hover:text-gold",
  );
  const inner = (
    <>
      {glyph ? (
        // Un peu plus grand qu'une icône au trait : en silhouette pleine, il paraît plus petit à taille égale.
        <GameGlyph name={glyph} className="h-[18px] w-[18px] opacity-90" />
      ) : (
        <Icon aria-hidden className="h-4 w-4 shrink-0 opacity-90" />
      )}
      <span className="dna-sidebar-label min-w-0 flex-1 truncate">{label}</span>
      {entry.external ? (
        <>
          <ArrowUpRight aria-hidden className="dna-when-expanded h-3 w-3 shrink-0 opacity-50" />
          <span className="sr-only">{newTabHint}</span>
        </>
      ) : null}
      {badge ? <SidebarBadge kind={badge} label={badgeLabel} /> : null}
    </>
  );
  // Replié, le libellé est caché à l'écran : une infobulle native le rappelle
  // à la souris. Le nom accessible, lui, reste dans le DOM.
  const title = collapsed ? label : undefined;

  if (entry.external) {
    return (
      <a href={entry.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate} title={title}>
        {inner}
      </a>
    );
  }
  return (
    <Link
      href={entry.href}
      className={className}
      onClick={onNavigate}
      title={title}
      aria-current={active ? "page" : undefined}
    >
      {inner}
    </Link>
  );
}

function Sidebar({
  pathname,
  collapsed,
  badges,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  badges: Record<string, ShellBadge>;
  onNavigate?: () => void;
}) {
  const t = useTranslations("shell");
  const tNav = useTranslations("nav");
  const { commissionsVisible } = useAppSettings();

  const primaryNav = commissionsVisible
    ? SHELL_NAV_PRIMARY
    : SHELL_NAV_PRIMARY.filter((entry) => entry.href !== NAVIGATION.commissions);

  const badgeLabels: Record<ShellBadge, string> = { new: t("badgeNew"), beta: t("badgeBeta") };

  const renderGroup = (entries: ShellNavEntry[], label: string, className?: string) => (
    <nav aria-label={label} className={cn("flex flex-col gap-1", className)}>
      {entries.map((entry) => {
        const badge = badges[entry.key];
        return (
          <SidebarLink
            key={entry.key}
            entry={entry}
            label={tNav(entry.key)}
            badge={badge}
            badgeLabel={badge ? badgeLabels[badge] : ""}
            // Un lien externe n'est jamais la route courante.
            active={!entry.external && isActive(pathname, entry.href)}
            collapsed={collapsed}
            newTabHint={t("newTab")}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );

  const separator = <span aria-hidden className="h-px bg-gradient-to-r from-line/25 via-line/10 to-transparent" />;

  return (
    <div className="custom-scrollbar flex h-full flex-col gap-4 overflow-y-auto overscroll-contain px-3 py-4">
      <SidebarBrand />
      {renderGroup(primaryNav, t("navSections"))}
      {separator}
      {renderGroup(SHELL_NAV_SECONDARY, t("navSite"))}
      {separator}
      {/* `mt-auto` sur les liens communautaires pousse la suite en bas de la
          barre : le compte termine la colonne, sous le dernier séparateur. */}
      {renderGroup(SHELL_NAV_EXTERNAL, t("navCommunity"), "mt-auto")}
      {separator}
      <SidebarProfile />
    </div>
  );
}

/* ------------------------------------------------------------ drawer mobile */

/**
 * Tiroir de navigation mobile, en modale : défilement du body bloqué, focus
 * piégé dans le panneau, Échap pour fermer, focus rendu au bouton d'origine
 * (`useDialogA11y`, comme `DnaDialog`).
 */
function MobileDrawer({
  open,
  onClose,
  pathname,
  badges,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  badges: Record<string, ShellBadge>;
}) {
  const t = useTranslations("shell");
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, { open, onClose });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div aria-hidden className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("sidebarLabel")}
        tabIndex={-1}
        className="absolute inset-y-0 left-0 w-72 overscroll-contain border-r border-line/25 bg-ink pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] shadow-[0_0_60px_rgba(0,0,0,0.7)] outline-none"
      >
        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={onClose}
          className="absolute right-3 top-4 z-10 rounded-sm p-1 text-parch/70 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <X aria-hidden className="h-5 w-5" />
        </button>
        <Sidebar pathname={pathname} collapsed={false} badges={badges} onNavigate={onClose} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- AppShell */

export type AppShellProps = {
  children: ReactNode;
  /** Pastilles « nouveau/bêta » encore valides, résolues côté serveur. */
  badges?: Record<string, ShellBadge>;
  /** Plage d'années du copyright, calculée côté serveur (« 2025-2026 »). */
  copyrightYears?: string;
};

/**
 * Coquille du hub DNA : barre latérale repliable, topbar, pied de page, et le
 * contenu en pleine largeur.
 *
 * Montée une seule fois dans `app/[locale]/layout.tsx`, pour que la barre
 * latérale reste en place d'une page à l'autre. Les routes sans coquille
 * (carte plein écran, admin, page marketing) sont listées dans `lib/shell`.
 */
export function AppShell({ children, badges = {}, copyrightYears = "2025" }: AppShellProps) {
  const t = useTranslations("shell");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  // Le tiroir retient la route où il a été ouvert : naviguer le referme, sans
  // effet ni rendu en cascade.
  const [drawer, setDrawer] = useState({ open: false, at: pathname });
  const drawerOpen = drawer.open && drawer.at === pathname;
  const openDrawer = () => setDrawer({ open: true, at: pathname });
  const closeDrawer = useCallback(() => setDrawer((state) => ({ ...state, open: false })), []);

  // Les hooks restent au-dessus de cette sortie anticipée.
  if (!shellAppliesTo(pathname)) return <>{children}</>;

  return (
    <div className="relative min-h-screen bg-linear-to-br from-ink via-panel to-ink text-parch">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:border focus:border-gold focus:bg-ink focus:px-4 focus:py-2 focus:font-caps focus:text-[0.7rem] focus:uppercase focus:tracking-[0.14em] focus:text-gold-bright"
      >
        {t("skipToContent")}
      </a>

      {/* ---------------------------------------------------------- FOND ANIMÉ */}
      {/* Sous toute la coquille et monté une seule fois : le fond continue
          d'une page à l'autre au lieu de repartir de zéro. */}
      <DnaAmbientBackdrop frames={AMBIENT_FRAMES} intensity="normal" />

      {/* ---------------------------------------------------------- SIDEBAR desktop */}
      <aside
        id="app-sidebar"
        aria-label={t("sidebarLabel")}
        className="hidden border-r border-line/15 bg-ink/70 backdrop-blur-sm transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-[var(--dna-sidebar-w)]"
      >
        <Sidebar pathname={pathname} collapsed={collapsed} badges={badges} />
      </aside>

      {/* ---------------------------------------------------------- SIDEBAR mobile */}
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} pathname={pathname} badges={badges} />

      {/* ---------------------------------------------------------- CONTENU */}
      {/* `relative z-10` : le fond est en `position: fixed`, sans ça il serait
          peint par-dessus le contenu resté dans le flux. */}
      <div className="relative z-10 flex min-h-screen flex-col transition-[padding] duration-200 lg:pl-[var(--dna-sidebar-w)]">
        {/* -------------------------------------------------------- TOPBAR */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line/15 bg-ink/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            type="button"
            aria-label={t("openMenu")}
            // Ouvre une modale : ni `aria-expanded` ni `aria-controls`. Ce
            // dernier pointait sur la barre desktop, en `display:none` à cette
            // taille d'écran.
            aria-haspopup="dialog"
            onClick={openDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-line/25 text-parch/80 hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 lg:hidden"
          >
            <Menu aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
            onClick={toggleCollapsed}
            className="hidden h-9 w-9 items-center justify-center rounded-sm border border-line/25 text-parch/70 hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 lg:flex"
          >
            {/* On rend les deux icônes et le CSS choisit. Avec un rendu
                conditionnel React, l'icône clignoterait avant l'hydratation. */}
            <ChevronsRight aria-hidden className="dna-when-collapsed h-4 w-4" />
            <ChevronsLeft aria-hidden className="dna-when-expanded h-4 w-4" />
          </button>

          <div className="flex min-w-0 items-baseline gap-3">
            <span className="font-caps text-sm uppercase tracking-[0.28em] text-gold-bright">DNA</span>
            {/* Repère décoratif, en simple texte : un `aria-label` sur un span
                sans rôle n'est pas exposé.

                `top-[1.5px]` : correction optique mesurée sur le rendu réel
                (Playwright, zoom x8, fond aplati). Le centre d'encre des
                capitales du repère tombait 1,44 px au-dessus de celui de
                « DNA ». L'écart vient du couple de tailles (14 px et 9,6 px) et
                pas de l'alignement : `items-center` n'y change rien. D'où une
                valeur en px, locale à la topbar, qui ne vaut que pour ce
                couple. Ailleurs le repère est bien placé. */}
            <DnaSectionMark size="sm" className="relative top-[1.5px] hidden max-w-[16rem] sm:inline-flex">
              {t(`breadcrumbs.${resolveBreadcrumb(pathname)}`)}
            </DnaSectionMark>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <DnaPill>{t("gameVersion", { version: GAME_VERSION })}</DnaPill>
            <LanguageSwitcher />
            <ThemeSwitcher />
            <NotificationBell />
            <TopbarAccount />
          </div>
        </header>

        {/* -------------------------------------------------------- CONTENU PAGE */}
        <SiteBanner />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>

        {/* -------------------------------------------------------- FOOTER */}
        <footer className="mt-8 border-t border-line/15 bg-ink/60 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1720px] flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-gold">DNA Interactive</span>
              <span className="text-muted-2">·</span>
              <span>{t("copyright", { years: copyrightYears })}</span>
              <span className="text-muted-2">·</span>
              <span>{t("tagline")}</span>
            </div>
            {/* Seulement les liens légaux : le reste est dans la barre
                latérale, présente sur toutes les pages de la coquille. */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={NAVIGATION.privacy}
                className="rounded-sm hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                {t("privacy")}
              </Link>
              <Link
                href={NAVIGATION.contact}
                className="rounded-sm hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                {tNav("contact")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
