import { resolveBreadcrumb } from "@/lib/shell";
import { DnaPageMark } from "@/components/dna/PageMark";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TheatreTracker } from "@/components/theatre/TheatreTracker";
import { getTheatreSnapshot } from "@/lib/theatre/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("theatreTitle"), description: t("theatreDescription") };
}

export default async function TheatrePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "theatre" });

  // Les noms et les visuels sont résolus ici : le composant client ne reçoit
  // que ce qu'il affiche, pas les catalogues de personnages et d'armes.
  const { rotations, serverNow } = await getTheatreSnapshot(locale);

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <DnaPageMark>{resolveBreadcrumb("/theatre")}</DnaPageMark>
        <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">{t("heading")}</h1>
        <p className="mt-3 max-w-2xl text-sm text-parch/75">{t("intro")}</p>
      </div>
      <TheatreTracker rotations={rotations} serverNow={serverNow} />
    </div>
  );
}
