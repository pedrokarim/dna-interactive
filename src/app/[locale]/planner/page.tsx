import { resolveBreadcrumb } from "@/lib/shell";
import { DnaPageMark } from "@/components/dna/PageMark";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlannerClient } from "@/components/planner/PlannerClient";
import { resolvePlannerBuild } from "@/lib/planner/build-source";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("plannerTitle"), description: t("plannerDescription") };
}

/** Cible passée par un bouton « Planifier » d'une fiche : id du site uniquement. */
const ADD_TARGET = /^(char-[a-z0-9-]{1,60}|weapons-\d{1,9}|mods-\d{1,9})$/;

export default async function PlannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ build?: string | string[]; add?: string | string[] }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations({ locale, namespace: "planner" });

  const buildParam = typeof query.build === "string" ? query.build : undefined;
  const addParam = typeof query.add === "string" && ADD_TARGET.test(query.add) ? query.add : null;
  // Le plan lui-même vit chez le visiteur : le serveur ne résout que le build
  // à importer, pour que le client n'ait pas à charger les builds ni la base.
  const pendingBuild = await resolvePlannerBuild(buildParam, locale);

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <DnaPageMark>{(await getTranslations("shell"))(`breadcrumbs.${resolveBreadcrumb("/planner")}`)}</DnaPageMark>
        <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">{t("heading")}</h1>
        <p className="mt-3 max-w-2xl text-sm text-parch/75">{t("intro")}</p>
      </div>
      <PlannerClient pendingBuild={pendingBuild} addTarget={addParam} />
    </div>
  );
}
