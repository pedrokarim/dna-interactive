"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ChevronDown, LogIn, LogOut, Shield, UserRound } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { DnaAvatar, DnaProgress, cn } from "@/components/dna";
import { NAVIGATION } from "@/lib/constants";

type LevelData = { level: number; title: string; ratio: number; xp: number; nextLevelAtXp: number };

/* --------------------------------------------------------- progression XP */

// Cache module : `SidebarProfile` est monté deux fois sur mobile (barre desktop
// en `display:none` + tiroir). Sans ce cache partagé, chaque montage relançait
// son propre appel à /api/account/level.
let levelCache: LevelData | null = null;
let levelInflight: Promise<LevelData | null> | null = null;

function fetchLevel(): Promise<LevelData | null> {
  if (!levelInflight) {
    levelInflight = fetch("/api/account/level")
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        levelCache = (json?.progress as LevelData | undefined) ?? null;
        return levelCache;
      })
      .catch(() => null);
  }
  return levelInflight;
}

/** Récupère la progression (XP/niveau) du compte connecté. */
function useLevelProgress(enabled: boolean): LevelData | null {
  // `levelCache` n'est écrit que dans le navigateur (l'appel part d'un effet),
  // il ne peut donc pas fuiter d'un utilisateur à l'autre côté serveur.
  const [data, setData] = useState<LevelData | null>(levelCache);

  useEffect(() => {
    if (!enabled) {
      // Déconnexion : on repart d'une ardoise vierge pour le prochain compte.
      levelCache = null;
      levelInflight = null;
      return;
    }
    let alive = true;
    void fetchLevel().then((value) => {
      if (alive) setData(value);
    });
    return () => {
      alive = false;
    };
  }, [enabled]);

  return enabled ? data : null;
}

/* ------------------------------------------------------------ menu déroulant */

/** Ferme un panneau au clic extérieur et à Échap. */
function useDismissable(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return ref;
}

/* ------------------------------------------------------------------ topbar */

/** Menu compte de la topbar : avatar + panneau (Profil, Admin, Déconnexion) ou connexion. */
export function TopbarAccount() {
  const t = useTranslations("account");
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const panelId = useId();
  // Le menu mémorise la route où il a été ouvert : naviguer le referme.
  const [menu, setMenu] = useState({ open: false, at: pathname });
  const open = menu.open && menu.at === pathname;
  const close = useCallback(() => setMenu((state) => ({ ...state, open: false })), []);
  const ref = useDismissable(open, close);
  const user = session?.user;

  if (status === "loading") {
    return <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/10" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        href={NAVIGATION.login}
        className="dna-shine inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-3 py-1.5 font-caps text-[0.6rem] uppercase tracking-[0.14em] text-gold-bright transition-colors hover:border-gold-bright hover:text-[#fff6e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <LogIn aria-hidden className="h-4 w-4" />
        <span className="hidden sm:inline">{t("signIn")}</span>
      </Link>
    );
  }

  const fallback = (user.name ?? "D").charAt(0).toUpperCase();
  const isAdmin = user.role === "admin";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t("menuLabel")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setMenu({ open: !open, at: pathname })}
        className="flex items-center gap-2 rounded-sm border border-line/20 bg-white/5 px-2 py-1.5 text-parch/90 transition-colors hover:border-gold/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <DnaAvatar src={user.image} fallback={fallback} round size={28} />
        <span className="hidden max-w-32 truncate font-sans text-sm sm:block">{user.name ?? "Discord"}</span>
        <ChevronDown aria-hidden className={cn("h-3.5 w-3.5 text-gold transition-transform", open && "rotate-180")} />
      </button>
      {open ? <AccountMenuPanel id={panelId} name={user.name} isAdmin={isAdmin} onNavigate={close} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ sidebar */

/**
 * Profil de la barre latérale. Les deux états (déployé / replié) sont rendus
 * puis départagés en CSS via `dna-when-*` : l'état de la barre est connu avant
 * l'hydratation, donc rien ne saute au chargement.
 */
export function SidebarProfile() {
  const t = useTranslations("account");
  const { data: session, status } = useSession();
  const user = session?.user;
  const level = useLevelProgress(Boolean(user));

  if (status === "loading") {
    return (
      <>
        <div className="flex items-center gap-3 rounded-sm border border-line/20 bg-panel/70 p-3 dna-when-expanded">
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/10" />
          <span className="h-3 w-24 animate-pulse rounded bg-white/10" />
        </div>
        <div className="dna-when-collapsed justify-center p-2">
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/10" />
        </div>
      </>
    );
  }

  const fallback = (user?.name ?? "D").charAt(0).toUpperCase();
  const isAdmin = user?.role === "admin";

  if (!user) {
    return (
      <>
        <div className="rounded-sm border border-line/20 bg-panel/70 p-3 dna-when-expanded">
          <p className="mb-2 font-caps text-[0.55rem] uppercase tracking-[0.2em] text-muted">{t("guest")}</p>
          <Link
            href={NAVIGATION.login}
            className="dna-shine flex w-full items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-3 py-2.5 font-caps text-[0.62rem] uppercase tracking-[0.14em] text-gold-bright transition-colors hover:border-gold-bright hover:text-[#fff6e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <LogIn aria-hidden className="h-4 w-4" />
            {t("signIn")}
          </Link>
        </div>
        <div className="dna-when-collapsed justify-center">
          <Link
            href={NAVIGATION.login}
            title={t("signIn")}
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 text-gold-bright transition-colors hover:border-gold hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <LogIn aria-hidden className="h-4 w-4" />
            <span className="sr-only">{t("signIn")}</span>
          </Link>
        </div>
      </>
    );
  }

  const roleLabel = isAdmin ? t("administrator") : t("traveler");

  return (
    <>
      {/* Déployé : identité + niveau + actions */}
      <div className="rounded-sm border border-line/20 bg-panel/70 p-3 dna-when-expanded">
        <div className="flex items-center gap-3">
          <DnaAvatar src={user.image} fallback={fallback} round size={36} />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm text-parch">{user.name ?? "Discord"}</span>
            <span className="block font-caps text-[0.55rem] uppercase tracking-[0.2em] text-muted">
              {level ? t("levelLine", { level: level.level, title: level.title }) : roleLabel}
            </span>
          </span>
        </div>
        {level ? (
          <DnaProgress
            value={Math.round(level.ratio * 100)}
            className="mt-2.5"
            label={t("levelProgress", { xp: level.xp, next: level.nextLevelAtXp })}
          />
        ) : null}
        <div className="mt-2.5 flex items-center gap-2">
          <Link
            href={NAVIGATION.profile}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-line/20 px-2 py-1.5 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-parch/80 transition-colors hover:border-gold/45 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <UserRound aria-hidden className="h-3.5 w-3.5" />
            {t("title")}
          </Link>
          {isAdmin ? (
            <Link
              href={NAVIGATION.admin}
              title={t("navAdmin")}
              className="flex items-center justify-center rounded-sm border border-line/20 px-2.5 py-1.5 text-parch/80 transition-colors hover:border-gold/45 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <Shield aria-hidden className="h-3.5 w-3.5" />
              <span className="sr-only">{t("navAdmin")}</span>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => signOut()}
            title={t("signOut")}
            className="flex items-center justify-center rounded-sm border border-line/20 px-2.5 py-1.5 text-parch/80 transition-colors hover:border-crimson-bright/50 hover:text-[#ffb3a6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <LogOut aria-hidden className="h-3.5 w-3.5" />
            <span className="sr-only">{t("signOut")}</span>
          </button>
        </div>
      </div>

      {/* Replié : avatar cliquable → profil */}
      <div className="dna-when-collapsed justify-center">
        <Link href={NAVIGATION.profile} title={user.name ?? t("title")} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
          <DnaAvatar src={user.image} fallback={fallback} round size={34} />
          <span className="sr-only">{user.name ?? t("title")}</span>
        </Link>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- panneau menu */

/**
 * Panneau du compte. Volontairement SANS `role="menu"` : ce sont des liens et un
 * bouton ordinaires, et le rôle menu promettrait une navigation aux flèches
 * (roving focus) qui n'est pas implémentée. Simple zone révélée par
 * `aria-expanded`/`aria-controls`, entièrement parcourable au Tab.
 */
function AccountMenuPanel({
  id,
  name,
  isAdmin,
  onNavigate,
}: {
  id: string;
  name?: string | null;
  isAdmin: boolean;
  onNavigate: () => void;
}) {
  const t = useTranslations("account");
  const itemClass =
    "flex w-full items-center gap-2 rounded-sm px-3 py-2 font-sans text-sm text-parch/85 transition-colors hover:bg-white/5 hover:text-parch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60";

  return (
    <div
      id={id}
      className="absolute right-0 top-full z-[90] mt-2 w-56 overflow-hidden border border-line/25 bg-panel shadow-[0_18px_44px_rgba(0,0,0,0.65)]"
    >
      <div className="border-b border-line/20 px-3 py-3">
        <p className="truncate font-sans text-sm text-parch">{name ?? "Discord"}</p>
        <p className="mt-0.5 truncate font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted">
          {isAdmin ? t("administrator") : t("member")}
        </p>
      </div>
      <div className="p-1.5">
        <Link href={NAVIGATION.profile} onClick={onNavigate} className={itemClass}>
          <UserRound aria-hidden className="h-4 w-4 text-gold" />
          {t("title")}
        </Link>
        {isAdmin ? (
          <Link href={NAVIGATION.admin} onClick={onNavigate} className={itemClass}>
            <Shield aria-hidden className="h-4 w-4 text-gold" />
            {t("navAdmin")}
          </Link>
        ) : null}
        <button
          type="button"
         
          onClick={() => signOut()}
          className={cn(itemClass, "hover:bg-crimson-bright/10 hover:text-[#ffb3a6]")}
        >
          <LogOut aria-hidden className="h-4 w-4 text-crimson-bright" />
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}
