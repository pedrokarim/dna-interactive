import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Boxes, Hammer, Shield } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { DiscordAuthButton } from "@/components/auth/DiscordAuthButton";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { DnaAvatar, DnaPanel, DnaSectionLabel, DnaTag } from "@/components/dna";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserProgress } from "@/lib/leveling/user";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ProfilePage() {
  const t = await getTranslations("account");
  const user = await getCurrentUser();
  const progress = user ? await getUserProgress(user.id) : null;

  return (
    <AppShell breadcrumb="//ACCOUNT.PROFILE">
      <section className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-4xl">
          <DnaSectionLabel>{t("account")}</DnaSectionLabel>
          <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">{t("title")}</h1>

          {!user ? (
            <DnaPanel className="mt-6 p-5">
              <p className="font-sans text-sm text-muted">{t("loginPrompt")}</p>
              <div className="mt-4">
                <DiscordAuthButton />
              </div>
            </DnaPanel>
          ) : (
            <>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <DnaPanel className="p-5">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  <DnaAvatar src={user.image} fallback={(user.name ?? "D").charAt(0).toUpperCase()} round size={76} />
                  <div className="min-w-0 flex-1">
                    <p className="font-caps text-[0.62rem] uppercase tracking-[0.18em] text-gold">{t("connectedWith")}</p>
                    <h2 className="mt-1 truncate font-display text-3xl text-parch">{user.name ?? "Discord"}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <DnaTag tone={user.role === "admin" ? "gold" : "crimson"}>
                        {user.role === "admin" ? t("roleAdmin") : t("roleUser")}
                      </DnaTag>
                      {user.discordId ? (
                        <span className="font-mono text-xs text-muted">{t("discordId")}: {user.discordId}</span>
                      ) : null}
                    </div>
                    {progress ? (
                      <div className="mt-4" title={`${progress.contributions.buildsPublished} builds · ${progress.contributions.likesReceived} likes · ${progress.contributions.votesGiven} votes`}>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-lg text-gold-bright">Lv.{progress.level}</span>
                          <span className="font-caps text-[0.6rem] uppercase tracking-[0.18em] text-muted">{progress.title}</span>
                          <span className="ml-auto font-mono text-xs text-muted">{progress.xp} XP</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/60">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-bright"
                            style={{ width: `${Math.round(progress.ratio * 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 font-mono text-[0.6rem] text-muted-2">
                          {progress.xpIntoLevel} / {progress.xpForLevelSpan} → Lv.{progress.level + 1}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </DnaPanel>

              <DnaPanel className="p-4">
                <DnaSectionLabel>{t("quickAccess")}</DnaSectionLabel>
                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    href="/builder"
                    className="flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 font-sans text-sm text-parch transition-colors hover:border-gold/45 hover:text-gold-bright"
                  >
                    <Hammer className="h-4 w-4 text-gold" />
                    {t("navBuilder")}
                  </Link>
                  <Link
                    href="/items"
                    className="flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 font-sans text-sm text-parch transition-colors hover:border-gold/45 hover:text-gold-bright"
                  >
                    <Boxes className="h-4 w-4 text-gold" />
                    {t("navItems")}
                  </Link>
                  {user.role === "admin" ? (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 border border-gold/35 bg-gold/10 px-3 py-2 font-sans text-sm text-gold transition-colors hover:border-gold hover:text-gold-bright"
                    >
                      <Shield className="h-4 w-4" />
                      {t("navAdmin")}
                    </Link>
                  ) : null}
                </div>
              </DnaPanel>
            </div>

            <DnaPanel className="mt-4 p-5">
              <DnaSectionLabel>{t("privacyBox")}</DnaSectionLabel>
              <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">
                {t.rich("privacyText", {
                  link: (chunks) => (
                    <Link href="/confidentialite" className="text-gold underline underline-offset-2 hover:text-gold-bright">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
              <div className="mt-4">
                <DeleteAccountButton />
              </div>
            </DnaPanel>
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}
