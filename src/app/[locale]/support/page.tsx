import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { CONTACT_INFO, FAQ_ITEMS, SUPPORT_QUICK_LINKS } from "@/lib/constants";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import { AppShell } from "@/components/site/AppShell";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaDivider } from "@/components/dna/Divider";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.support, parent, locale);
}

const DISCORD_PATH =
  "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.120.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z";

export default async function SupportPage() {
  const tSupport = await getTranslations("support");
  const tNav = await getTranslations("nav");

  return (
    <AppShell breadcrumb="//SUPPORT.DESK">
      <div className="container mx-auto px-4 py-12 md:px-6 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/80">{tNav("support")}</p>
            <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">{tSupport("title")}</h1>
            <DnaDivider className="mx-auto mt-5 max-w-[14rem]" />
            <p className="mt-5 text-lg text-parch/80">{tSupport("subtitle")}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Discord */}
            <DnaPanel className="relative p-7 md:p-8">
              <DnaCornerBrackets size={16} className="opacity-30" />
              <span className="mb-6 grid h-14 w-14 place-items-center border border-gold/30 bg-gold/10 text-gold">
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d={DISCORD_PATH} />
                </svg>
              </span>
              <h2 className="mb-3 font-display text-2xl text-parch">{tSupport("discordTitle")}</h2>
              <p className="mb-6 leading-relaxed text-muted">{tSupport("discordDescription")}</p>
              <a
                href={CONTACT_INFO.discord.url}
                target="_blank"
                rel="noopener noreferrer"
                className="dna-shine inline-flex w-full items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-3 font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d={DISCORD_PATH} />
                </svg>
                {CONTACT_INFO.discord.label}
              </a>
              <div className="mt-4 space-y-1 text-sm text-muted-2">
                <p>◇ {tSupport("discordBullet1")}</p>
                <p>◇ {tSupport("discordBullet2")}</p>
                <p>◇ {tSupport("discordBullet3")}</p>
              </div>
            </DnaPanel>

            {/* Email */}
            <DnaPanel className="relative p-7 md:p-8">
              <DnaCornerBrackets size={16} className="opacity-30" />
              <span className="mb-6 grid h-14 w-14 place-items-center border border-gold/30 bg-gold/10 text-gold">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <h2 className="mb-3 font-display text-2xl text-parch">{tSupport("emailTitle")}</h2>
              <p className="mb-6 leading-relaxed text-muted">{tSupport("emailDescription")}</p>
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 px-6 py-3 font-medium text-parch transition-all duration-200 hover:-translate-y-px hover:border-white/45 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {CONTACT_INFO.email}
              </a>
              <div className="mt-4 space-y-1 text-sm text-muted-2">
                <p>◇ {tSupport("emailBullet1")}</p>
                <p>◇ {tSupport("emailBullet2")}</p>
                <p>◇ {tSupport("emailBullet3")}</p>
              </div>
            </DnaPanel>
          </div>

          {/* FAQ */}
          <DnaPanel className="mt-12 p-7 md:p-8">
            <h2 className="mb-8 text-center font-display text-2xl text-parch">{tSupport("faqTitle")}</h2>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {FAQ_ITEMS.map((faq, index) => (
                <div key={index}>
                  <h4 className="mb-2 flex items-start gap-2 font-medium text-parch">
                    <span className="mt-0.5 text-gold">◈</span>
                    {faq.question}
                  </h4>
                  <p className="text-sm leading-relaxed text-muted">{faq.answer}</p>
                </div>
              ))}
            </div>
          </DnaPanel>

          {/* Liens rapides */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {SUPPORT_QUICK_LINKS.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative border border-line/25 bg-panel/85 p-6 text-center backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40"
              >
                <DnaCornerBrackets size={12} className="opacity-0 transition-opacity group-hover:opacity-60" />
                <h4 className="font-display text-lg text-parch transition-colors group-hover:text-gold">{link.label}</h4>
                <p className="mt-1 text-sm text-muted">{link.description}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
