import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { Boxes, CalendarDays, Hammer, Shield, Star } from "lucide-react";
import { AuthLinkButton } from "@/components/auth/AuthCard";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { AccountConnections } from "@/components/account/AccountConnections";
import { DnaAvatar, DnaPanel, DnaSectionLabel, DnaTag } from "@/components/dna";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserProgress } from "@/lib/leveling/user";
import { isGoogleEnabled } from "@/lib/auth/site";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const chipClass =
  "inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-3.5 py-2 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-parch/85 transition-colors hover:border-gold/45 hover:text-gold-bright";

export default async function ProfilePage({ searchParams }: Props) {
  const t = await getTranslations("account");
  const locale = await getLocale();
  const user = await getCurrentUser();
  const { error } = await searchParams;
  const progress = user ? await getUserProgress(user.id) : null;

  const db = getDb();
  const [accountRows, userRows] = user
    ? await Promise.all([
        db.select({ provider: schema.accounts.provider }).from(schema.accounts).where(eq(schema.accounts.userId, user.id)),
        db
          .select({ passwordHash: schema.users.passwordHash, createdAt: schema.users.createdAt })
          .from(schema.users)
          .where(eq(schema.users.id, user.id))
          .limit(1),
      ])
    : [[], []];
  const linkedProviders = accountRows
    .map((r) => r.provider)
    .filter((p): p is "discord" | "google" => p === "discord" || p === "google");
  const hasPassword = Boolean(userRows[0]?.passwordHash);
  const joinedOn = userRows[0]?.createdAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(userRows[0].createdAt))
    : null;

  return (
    <section className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Fil d'ariane */}
        <nav className="flex items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.16em]">
          <Link href="/" className="text-gold transition-colors hover:text-gold-bright">
            {t("account")}
          </Link>
          <span className="text-muted-2">/</span>
          <span className="truncate text-muted">{user?.name ?? t("title")}</span>
        </nav>

        <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">{t("title")}</h1>

        {!user ? (
          <DnaPanel className="mt-6 p-6">
            <p className="font-sans text-sm text-muted">{t("loginPrompt")}</p>
            <div className="mt-4">
              <AuthLinkButton href="/login">{t("loginCtaAction")}</AuthLinkButton>
            </div>
          </DnaPanel>
        ) : (
          <>
            {/* En-tête identité */}
            <div className="mt-6">
              <div className="inline-flex max-w-full items-center gap-3 rounded-lg border border-gold/25 bg-panel/70 px-3.5 py-2.5">
                <DnaAvatar src={user.image} fallback={(user.name ?? "D").charAt(0).toUpperCase()} round size={46} />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg leading-tight text-parch">{user.name ?? t("title")}</p>
                  <p className="font-caps text-[0.54rem] uppercase tracking-[0.18em] text-muted">
                    {progress?.title ?? (user.role === "admin" ? t("roleAdmin") : t("roleUser"))}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {joinedOn ? (
                  <span className="inline-flex items-center gap-1.5 font-sans text-sm text-muted">
                    <CalendarDays className="h-4 w-4 text-gold/70" />
                    {t("joinedOn", { date: joinedOn })}
                  </span>
                ) : null}
                <DnaTag tone={user.role === "admin" ? "gold" : "crimson"}>
                  {user.role === "admin" ? t("roleAdmin") : t("roleUser")}
                </DnaTag>
              </div>
            </div>

            {/* Filet doré */}
            <div className="mt-5 h-px bg-gradient-to-r from-gold/40 via-gold/15 to-transparent" />

            {/* Accès rapide */}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/builder" className={chipClass}>
                <Hammer className="h-3.5 w-3.5 text-gold" />
                {t("navBuilder")}
              </Link>
              <Link href="/builds" className={chipClass}>
                <Star className="h-3.5 w-3.5 text-gold" />
                {t("navBuilds")}
              </Link>
              <Link href="/items" className={chipClass}>
                <Boxes className="h-3.5 w-3.5 text-gold" />
                {t("navItems")}
              </Link>
              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 border border-gold/35 bg-gold/10 px-3.5 py-2 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold hover:text-gold-bright"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {t("navAdmin")}
                </Link>
              ) : null}
            </div>

            {/* Progression */}
            {progress ? (
              <section className="mt-8">
                <DnaSectionLabel>{t("progressBox")}</DnaSectionLabel>
                <DnaPanel className="mt-3 p-5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl text-gold-bright">Lv.{progress.level}</span>
                    <span className="font-caps text-[0.6rem] uppercase tracking-[0.18em] text-muted">{progress.title}</span>
                    <span className="ml-auto font-mono text-xs text-muted">{progress.xp} XP</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/60">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-bright"
                      style={{ width: `${Math.round(progress.ratio * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[0.6rem] text-muted-2">
                    {progress.xpIntoLevel} / {progress.xpForLevelSpan} → Lv.{progress.level + 1}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Stat value={progress.contributions.buildsPublished} label={t("statBuilds")} />
                    <Stat value={progress.contributions.likesReceived} label={t("statLikes")} />
                    <Stat
                      value={progress.contributions.buildViews.reduce((a, b) => a + b, 0)}
                      label={t("statViews")}
                    />
                  </div>
                </DnaPanel>
              </section>
            ) : null}

            {/* Connexions */}
            <section className="mt-8">
              <DnaSectionLabel>{t("connectionsBox")}</DnaSectionLabel>
              <p className="mt-2 mb-3 font-sans text-sm text-muted">{t("connectionsHint")}</p>
              <DnaPanel className="p-5">
                <AccountConnections
                  linkedProviders={linkedProviders}
                  hasPassword={hasPassword}
                  googleEnabled={isGoogleEnabled()}
                  linkError={error === "OAuthAccountNotLinked"}
                />
              </DnaPanel>
            </section>

            {/* Confidentialité */}
            <section className="mt-8">
              <DnaSectionLabel>{t("privacyBox")}</DnaSectionLabel>
              <DnaPanel className="mt-3 p-5">
                <p className="font-sans text-sm leading-relaxed text-parch/85">
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
            </section>
          </>
        )}
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <p className="font-display text-2xl leading-none text-parch">{value}</p>
      <p className="mt-1 font-caps text-[0.52rem] uppercase tracking-[0.16em] text-muted">{label}</p>
    </div>
  );
}
