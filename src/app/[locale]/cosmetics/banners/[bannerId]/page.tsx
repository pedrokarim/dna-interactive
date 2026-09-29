import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import BannerDetailClient from "@/components/cosmetics/BannerDetailClient";
import { getBanners } from "@/lib/cosmetics/catalog";
import { getBannerDetail } from "@/lib/cosmetics/banners";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";

type BannerPageProps = { params: Promise<{ locale: string; bannerId: string }> };

export function generateStaticParams() {
  return getBanners().map((banner) => ({ bannerId: String(banner.id) }));
}

export async function generateMetadata({ params }: BannerPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale, bannerId } = await params;
  const banner = getBannerDetail(Number(bannerId), locale.toUpperCase());
  if (!banner) return generatePageMetadata(pageMetadata.banners, parent, locale);
  const t = await getTranslations({ locale, namespace: "cosmetics" });
  return generatePageMetadata(
    {
      title: t("bannerMetaTitle", { name: banner.name, type: t(`bannerTypes.${banner.type}`) }),
      description: t("bannerMetaDescription", { name: banner.name, featured: banner.featured?.name ?? banner.name }),
      path: `/cosmetics/banners/${banner.id}`,
      image: banner.image ?? undefined,
      keywords: ["Duet Night Abyss", banner.name, banner.featured?.name ?? "", "Myriad"],
    },
    parent,
    locale,
  );
}

export default async function BannerPage({ params }: BannerPageProps) {
  const { locale, bannerId } = await params;
  const banner = getBannerDetail(Number(bannerId), locale.toUpperCase());
  if (!banner) notFound();
  return <BannerDetailClient banner={banner} />;
}
