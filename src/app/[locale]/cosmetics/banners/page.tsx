import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import BannerCard from "@/components/cosmetics/BannerCard";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { getBannerSummaries } from "@/lib/cosmetics/banners";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import type { BannerType } from "@/lib/cosmetics/types";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.banners, parent, locale);
}

const TYPE_ORDER: BannerType[] = ["limited", "rerun", "standard"];

export default async function BannersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("cosmetics");
  const banners = getBannerSummaries(locale.toUpperCase());

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/cosmetics"
            className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-gold transition-colors hover:text-gold-bright"
          >
            {`// ${t("headerLabel")}`}
          </Link>
          <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">{t("bannersTitle")}</h1>
          <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
          <p className="mt-3 max-w-2xl text-sm text-parch/75">{t("bannersDescription")}</p>
        </div>
        <div className="relative shrink-0 px-5 py-3">
          <DnaCornerBrackets size={16} />
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-semibold tabular-nums text-parch">{banners.length}</span>
            <span className="font-caps text-[0.55rem] uppercase leading-tight tracking-[0.2em] text-muted">{t("bannersCountLabel")}</span>
          </div>
        </div>
      </div>

      {TYPE_ORDER.map((type) => {
        const list = banners.filter((banner) => banner.type === type);
        if (list.length === 0) return null;
        return (
          <section key={type} className="space-y-4">
            <DnaSectionLabel>{t(`bannerTypes.${type}`)}</DnaSectionLabel>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((banner) => (
                <BannerCard key={banner.id} banner={banner} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
