import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { CONTACT_INFO, FAQ_ITEMS, SUPPORT_QUICK_LINKS } from "@/lib/constants";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaDivider } from "@/components/dna/Divider";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";
import { DISCORD_BUTTON_CLASS, DiscordIcon } from "@/components/icons/BrandIcons";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.support, parent, locale);
}

export default async function SupportPage() {
  const tSupport = await getTranslations("support");
  const tNav = await getTranslations("nav");

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold">{tNav("support")}</p>
          <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">{tSupport("title")}</h1>
          <DnaDivider className="mx-auto mt-5 max-w-[14rem]" />
          <p className="mt-5 text-lg text-parch/80">{tSupport("subtitle")}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Discord */}
          <DnaPanel className="relative p-7 md:p-8">
            <DnaCornerBrackets size={16} className="opacity-30" />
            <span className="mb-6 grid h-14 w-14 place-items-center border border-[#5865F2]/45 bg-[#5865F2]/15 text-[#8f9aff]">
              <DiscordIcon className="h-7 w-7" />
            </span>
            <h2 className="mb-3 font-display text-2xl text-parch">{tSupport("discordTitle")}</h2>
            <p className="mb-6 leading-relaxed text-muted">{tSupport("discordDescription")}</p>
            <a
              href={CONTACT_INFO.discord.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`dna-shine inline-flex w-full items-center justify-center gap-2 rounded-sm border px-6 py-3 font-medium transition-all duration-200 hover:-translate-y-px ${DISCORD_BUTTON_CLASS}`}
            >
              <DiscordIcon className="h-5 w-5" />
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
              <h4 className="font-display text-lg text-parch transition-colors group-hover:text-gold">
                {tSupport(`quickLink${link.key}`)}
              </h4>
              <p className="mt-1 text-sm text-muted">{tSupport(`quickLink${link.key}Desc`)}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
