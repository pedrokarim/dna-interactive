import { signIn, signOut } from "@/auth";
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
        <DnaButton variant="gold" className={compact ? "px-3 py-1.5 text-xs" : undefined}>
          Connexion Discord
        </DnaButton>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <DnaAvatar src={user.image} fallback={(user.name ?? "D").charAt(0).toUpperCase()} round size={compact ? 26 : 32} />
      {!compact ? <span className="max-w-36 truncate font-sans text-sm text-parch">{user.name ?? "Discord"}</span> : null}
      <form action={signOutCurrentUser}>
        <DnaButton variant="ghost" className={compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs"}>
          Déconnexion
        </DnaButton>
      </form>
    </div>
  );
}
