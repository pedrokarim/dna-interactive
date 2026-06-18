import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Boxes, Hammer, Shield } from "lucide-react";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { DiscordAuthButton } from "@/components/auth/DiscordAuthButton";
import { DnaAvatar, DnaPanel, DnaSectionLabel, DnaTag } from "@/components/dna";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil - DNA Interactive",
  description: "Profil utilisateur DNA Interactive.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-ink text-parch">
      <SiteHeader />
      <section className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-4xl">
          <DnaSectionLabel>Compte</DnaSectionLabel>
          <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">Profil</h1>

          {!user ? (
            <DnaPanel className="mt-6 p-5">
              <p className="font-sans text-sm text-muted">Connecte-toi avec Discord pour afficher ton profil.</p>
              <div className="mt-4">
                <DiscordAuthButton />
              </div>
            </DnaPanel>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <DnaPanel className="p-5">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  <DnaAvatar src={user.image} fallback={(user.name ?? "D").charAt(0).toUpperCase()} round size={76} />
                  <div className="min-w-0 flex-1">
                    <p className="font-caps text-[0.62rem] uppercase tracking-[0.18em] text-gold">Connecte avec Discord</p>
                    <h2 className="mt-1 truncate font-display text-3xl text-parch">{user.name ?? "Discord"}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <DnaTag tone={user.role === "admin" ? "gold" : "crimson"}>{user.role}</DnaTag>
                      {user.discordId ? (
                        <span className="font-mono text-xs text-muted">Discord ID: {user.discordId}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </DnaPanel>

              <DnaPanel className="p-4">
                <DnaSectionLabel>Acces rapides</DnaSectionLabel>
                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    href="/builder"
                    className="flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 font-sans text-sm text-parch transition-colors hover:border-gold/45 hover:text-gold-bright"
                  >
                    <Hammer className="h-4 w-4 text-gold" />
                    Builder
                  </Link>
                  <Link
                    href="/items"
                    className="flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 font-sans text-sm text-parch transition-colors hover:border-gold/45 hover:text-gold-bright"
                  >
                    <Boxes className="h-4 w-4 text-gold" />
                    Items
                  </Link>
                  {user.role === "admin" ? (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 border border-gold/35 bg-gold/10 px-3 py-2 font-sans text-sm text-gold transition-colors hover:border-gold hover:text-gold-bright"
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  ) : null}
                </div>
              </DnaPanel>
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
