import { signIn, signOut } from "@/auth";
import { Link } from "@/i18n/navigation";
import { ChevronDown, LogOut, Shield, UserRound } from "lucide-react";
import { DnaAvatar, DnaButton } from "@/components/dna";
import { getCurrentUser } from "@/lib/auth/session";

async function signInWithDiscord() {
  "use server";
  await signIn("discord");
}

async function signOutCurrentUser() {
  "use server";
  await signOut();
}

export async function DiscordAuthButton({
  compact = false,
  direction = "down",
  align = "end",
}: {
  compact?: boolean;
  direction?: "up" | "down";
  align?: "start" | "end";
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <form action={signInWithDiscord}>
        <DnaButton variant="gold" className={compact ? "whitespace-nowrap px-3 py-1.5 text-xs" : undefined}>
          Connexion Discord
        </DnaButton>
      </form>
    );
  }

  const fallback = (user.name ?? "D").charAt(0).toUpperCase();

  return (
    <details className="group relative z-[80]">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-sm border border-line/20 bg-white/5 px-2 py-1.5 text-parch/90 transition-colors hover:border-gold/45 hover:bg-white/10 hover:text-parch [&::-webkit-details-marker]:hidden"
        aria-label="Menu du compte"
      >
        <DnaAvatar src={user.image} fallback={fallback} round size={compact ? 28 : 34} />
        {!compact ? <span className="max-w-36 truncate font-sans text-sm">{user.name ?? "Discord"}</span> : null}
        <ChevronDown className="h-3.5 w-3.5 text-gold transition-transform group-open:rotate-180" />
      </summary>

      <div
        className={`absolute z-[90] w-56 overflow-hidden border border-line/25 bg-panel shadow-[0_18px_44px_rgba(0,0,0,0.65)] ${
          align === "start" ? "left-0" : "right-0"
        } ${direction === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}
      >
        <div className="border-b border-line/20 px-3 py-3">
          <p className="truncate font-sans text-sm text-parch">{user.name ?? "Discord"}</p>
          <p className="mt-0.5 truncate font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted">
            {user.role === "admin" ? "Administrateur" : "Compte Discord"}
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
          {user.role === "admin" ? (
            <Link
              href="/admin"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 font-sans text-sm text-parch/85 transition-colors hover:bg-white/5 hover:text-parch"
            >
              <Shield className="h-4 w-4 text-gold" />
              Admin
            </Link>
          ) : null}
          <form action={signOutCurrentUser}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 font-sans text-sm text-parch/85 transition-colors hover:bg-crimson-bright/10 hover:text-[#ffb3a6]"
            >
              <LogOut className="h-4 w-4 text-crimson-bright" />
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
