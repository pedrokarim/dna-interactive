import type { Metadata, ResolvingMetadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  SITE_CONFIG,
  NAVIGATION,
  GAME_INFO,
  TEAM_INFO,
} from "@/lib/constants";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaDivider } from "@/components/dna/Divider";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.about, parent, locale);
}

/** Cartouche d'icône net (carré, liseré doré). */
function IconFrame({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center border border-gold/30 bg-gold/10 text-gold">
      {children}
    </span>
  );
}

function PanelHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <IconFrame>{icon}</IconFrame>
      <h2 className="font-display text-2xl text-parch">{title}</h2>
    </div>
  );
}

export default async function AboutPage() {
  const tAbout = await getTranslations("about");

  const offerItems = [
    {
      d: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
      title: tAbout("offerMapTitle"),
      desc: tAbout("offerMapDescription"),
    },
    {
      d: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
      title: tAbout("offerMarkersTitle"),
      desc: tAbout("offerMarkersDescription"),
    },
    {
      d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4",
      title: tAbout("offerFiltersTitle"),
      desc: tAbout("offerFiltersDescription"),
    },
    {
      d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9",
      title: tAbout("offerResponsiveTitle"),
      desc: tAbout("offerResponsiveDescription"),
    },
    {
      d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
      title: tAbout("offerPassionTitle"),
      desc: tAbout("offerPassionDescription"),
    },
    {
      d: "M13 10V3L4 14h7v7l9-11h-7z",
      title: tAbout("offerUpdatesTitle"),
      desc: tAbout("offerUpdatesDescription"),
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-ink via-panel to-ink text-parch">
      <SiteHeader active={NAVIGATION.about} />

      <main className="container mx-auto px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12 text-center">
            <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/80">
              {SITE_CONFIG.name}
            </p>
            <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">
              {tAbout("title", { siteName: SITE_CONFIG.name })}
            </h1>
            <DnaDivider className="mx-auto mt-5 max-w-[14rem]" />
            <p className="mt-5 text-lg text-parch/80">
              {tAbout("mission", { gameName: GAME_INFO.name })}
            </p>
          </div>

          <div className="space-y-8">
            {/* Origine */}
            <DnaPanel className="relative p-7 md:p-8">
              <DnaCornerBrackets size={16} className="opacity-30" />
              <PanelHeading
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                title={tAbout("originTitle")}
              />
              <p className="leading-relaxed text-parch/85">
                {tAbout("originParagraph1", { siteName: SITE_CONFIG.name, gameName: GAME_INFO.name })}
              </p>
              <p className="mt-4 leading-relaxed text-parch/85">
                {tAbout("originParagraph2", { gameName: GAME_INFO.name })}
              </p>
            </DnaPanel>

            {/* Ce qu'on offre */}
            <DnaPanel className="relative p-7 md:p-8">
              <DnaCornerBrackets size={16} className="opacity-30" />
              <PanelHeading
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title={tAbout("offerTitle")}
              />
              <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
                {offerItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.d} />
                    </svg>
                    <div>
                      <h4 className="font-medium text-parch">{item.title}</h4>
                      <p className="mt-0.5 text-sm text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DnaPanel>

            {/* Équipe */}
            <DnaPanel className="relative p-7 md:p-8">
              <DnaCornerBrackets size={16} className="opacity-30" />
              <PanelHeading
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                title={tAbout("teamTitle")}
              />
              <div className="text-center">
                {TEAM_INFO.members.map((member, index) => (
                  <div key={index} className="inline-block border border-line/20 bg-ink/40 p-6">
                    <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="font-display text-xl text-parch">{member.name}</h4>
                    <p className="mt-1 font-caps text-[0.62rem] uppercase tracking-[0.2em] text-gold">aka {member.nickname}</p>
                    <p className="mt-2 text-sm text-muted">{member.role}</p>
                  </div>
                ))}
                {TEAM_INFO.members.map((member, index) => (
                  <p key={index} className="mx-auto mt-6 max-w-2xl leading-relaxed text-parch/85">
                    {member.description
                      .replace("DNA Interactive", SITE_CONFIG.name)
                      .replace("Duet Night Abyss", GAME_INFO.name)}
                  </p>
                ))}
              </div>
            </DnaPanel>

            {/* Disclaimer */}
            <DnaPanel className="relative border-crimson-bright/30 bg-crimson/10 p-6 md:p-7">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center border border-crimson-bright/40 bg-crimson/15 text-crimson-bright">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </span>
                <div>
                  <h4 className="font-caps text-sm uppercase tracking-[0.16em] text-crimson-bright">
                    {tAbout("disclaimerTitle")}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-parch/85">
                    {tAbout("disclaimerBody", { siteName: SITE_CONFIG.name, gameName: GAME_INFO.name })}
                  </p>
                  <p className="mt-3 text-sm text-muted">{tAbout("disclaimerOfficialLink")}</p>
                </div>
              </div>
            </DnaPanel>

            {/* Appel à l'action */}
            <div className="text-center">
              <h3 className="font-display text-2xl text-parch">{tAbout("joinCommunityTitle")}</h3>
              <p className="mx-auto mt-3 mb-8 max-w-2xl text-muted">{tAbout("joinCommunityDescription")}</p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href="https://discord.gg/rTd95UpUEb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dna-shine inline-flex items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-3 font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.120.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 px-6 py-3 font-medium text-parch transition-all duration-200 hover:-translate-y-px hover:border-white/45 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter active={NAVIGATION.about} />
    </div>
  );
}
