import { signIn, signOut } from "@/auth";
import { Link } from "@/i18n/navigation";
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

export async function DiscordAuthButton({ compact = false }: { compact?: boolean }) {
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DnaAvatar src={user.image} fallback={(user.name ?? "D").charAt(0).toUpperCase()} round size={compact ? 26 : 32} />
      {!compact ? <span className="max-w-36 truncate font-sans text-sm text-parch">{user.name ?? "Discord"}</span> : null}
      {user.role === "admin" ? (
        <Link
          href="/admin"
          className={compact ? "whitespace-nowrap border border-gold/45 bg-gold/10 px-3 py-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold hover:text-gold-bright" : "whitespace-nowrap border border-gold/45 bg-gold/10 px-4 py-2 font-caps text-[0.62rem] uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold hover:text-gold-bright"}
        >
          Admin
        </Link>
      ) : null}
      <form action={signOutCurrentUser}>
        <DnaButton variant="ghost" className={compact ? "whitespace-nowrap px-3 py-1.5 text-xs" : "whitespace-nowrap px-4 py-2 text-xs"}>
          Déconnexion
        </DnaButton>
      </form>
    </div>
  );
}
