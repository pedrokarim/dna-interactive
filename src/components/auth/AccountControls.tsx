"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { ChevronDown, LogIn, LogOut, Shield, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaAvatar, cn } from "@/components/dna";

/* ------------------------------------------------------------------ topbar */

/** Menu compte de la topbar : avatar + dropdown (Profil, Admin, Déconnexion) ou connexion. */
export function TopbarAccount() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/10" aria-hidden />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => signIn("discord")}
        className="dna-shine inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-3 py-1.5 font-caps text-[0.6rem] uppercase tracking-[0.14em] text-gold-bright transition-colors hover:border-gold-bright hover:text-[#fff6e6]"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Se connecter</span>
      </button>
    );
  }

  const fallback = (user.name ?? "D").charAt(0).toUpperCase();
  const isAdmin = user.role === "admin";

  return (
    <details className="group relative z-[70]">
      <summary
        aria-label="Menu du compte"
        className="flex cursor-pointer list-none items-center gap-2 rounded-sm border border-line/20 bg-white/5 px-2 py-1.5 text-parch/90 transition-colors hover:border-gold/45 hover:bg-white/10 [&::-webkit-details-marker]:hidden"
      >
        <DnaAvatar src={user.image} fallback={fallback} round size={28} />
        <span className="hidden max-w-32 truncate font-sans text-sm sm:block">{user.name ?? "Discord"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gold transition-transform group-open:rotate-180" />
      </summary>
      <AccountMenuPanel name={user.name} isAdmin={isAdmin} align="end" />
    </details>
  );
}

/* ------------------------------------------------------------------ sidebar */

/** Profil de la sidebar : identité réelle + actions (repli = avatar → /profile). */
export function SidebarProfile({ collapsed = false }: { collapsed?: boolean }) {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return (
      <div className={cn("flex items-center", collapsed ? "justify-center p-2" : "gap-3 rounded-sm border border-line/20 bg-panel/70 p-3")}>
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/10" />
        {!collapsed ? <span className="h-3 w-24 animate-pulse rounded bg-white/10" /> : null}
      </div>
    );
  }

  const fallback = (user?.name ?? "D").charAt(0).toUpperCase();
  const isAdmin = user?.role === "admin";

  // Déconnecté
  if (!user) {
    if (collapsed) {
      return (
        <button
          type="button"
          onClick={() => signIn("discord")}
          aria-label="Se connecter"
          title="Se connecter"
          className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 text-gold-bright transition-colors hover:border-gold hover:bg-gold/15"
        >
          <LogIn className="h-4 w-4" />
        </button>
      );
    }
    return (
      <div className="rounded-sm border border-line/20 bg-panel/70 p-3">
        <p className="mb-2 font-caps text-[0.55rem] uppercase tracking-[0.2em] text-muted">Invité</p>
        <button
          type="button"
          onClick={() => signIn("discord")}
          className="dna-shine flex w-full items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-3 py-2.5 font-caps text-[0.62rem] uppercase tracking-[0.14em] text-gold-bright transition-colors hover:border-gold-bright hover:text-[#fff6e6]"
        >
          <LogIn className="h-4 w-4" />
          Se connecter
        </button>
      </div>
    );
  }

  // Connecté, replié : avatar cliquable → profil
  if (collapsed) {
    return (
      <Link href="/profile" aria-label={user.name ?? "Profil"} title={user.name ?? "Profil"} className="flex justify-center">
        <DnaAvatar src={user.image} fallback={fallback} round size={34} />
      </Link>
    );
  }

  // Connecté, déployé : identité + actions
  return (
    <div className="rounded-sm border border-line/20 bg-panel/70 p-3">
      <div className="flex items-center gap-3">
        <DnaAvatar src={user.image} fallback={fallback} round size={36} />
        <span className="min-w-0">
          <span className="block truncate font-display text-sm text-parch">{user.name ?? "Discord"}</span>
          <span className="block font-caps text-[0.55rem] uppercase tracking-[0.2em] text-muted">
            {isAdmin ? "Administrateur" : "Voyageur · Lv.XX"}
          </span>
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <Link
          href="/profile"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-line/20 px-2 py-1.5 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-parch/80 transition-colors hover:border-gold/45 hover:text-gold"
        >
          <UserRound className="h-3.5 w-3.5" />
          Profil
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            aria-label="Admin"
            title="Admin"
            className="flex items-center justify-center rounded-sm border border-line/20 px-2.5 py-1.5 text-parch/80 transition-colors hover:border-gold/45 hover:text-gold"
          >
            <Shield className="h-3.5 w-3.5" />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => signOut()}
          aria-label="Déconnexion"
          title="Déconnexion"
          className="flex items-center justify-center rounded-sm border border-line/20 px-2.5 py-1.5 text-parch/80 transition-colors hover:border-crimson-bright/50 hover:text-[#ffb3a6]"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- panneau menu */

function AccountMenuPanel({ name, isAdmin, align }: { name?: string | null; isAdmin: boolean; align: "start" | "end" }) {
  return (
    <div
      className={cn(
        "absolute top-full z-[90] mt-2 w-56 overflow-hidden border border-line/25 bg-panel shadow-[0_18px_44px_rgba(0,0,0,0.65)]",
        align === "start" ? "left-0" : "right-0",
      )}
    >
      <div className="border-b border-line/20 px-3 py-3">
        <p className="truncate font-sans text-sm text-parch">{name ?? "Discord"}</p>
        <p className="mt-0.5 truncate font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted">
          {isAdmin ? "Administrateur" : "Compte Discord"}
        </p>
      </div>
      <div className="p-1.5">
        <Link
          href="/profile"
          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 font-sans text-sm text-parch/85 transition-colors hover:bg-white/5 hover:text-parch"
        >
          <UserRound className="h-4 w-4 text-gold" />
          Profil
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 font-sans text-sm text-parch/85 transition-colors hover:bg-white/5 hover:text-parch"
          >
            <Shield className="h-4 w-4 text-gold" />
            Admin
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 font-sans text-sm text-parch/85 transition-colors hover:bg-crimson-bright/10 hover:text-[#ffb3a6]"
        >
          <LogOut className="h-4 w-4 text-crimson-bright" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
