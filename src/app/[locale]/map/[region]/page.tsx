import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";
import {
  getAllRegions,
  getOtherRegions,
  getRegionBySlug,
} from "@/lib/map/regions";
import { NAVIGATION, SITE_CONFIG } from "@/lib/constants";
import { resourceName } from "@/lib/map/taxonomy";
import { localized } from "@/lib/map/world";

/**
 * Page d'une région de la carte.
 *
 * Existe pour le référencement autant que pour le confort : `/map` est une
 * application plein écran non défilante, elle n'a pas la place d'accueillir du
 * texte. Ces pages-ci sont des pages normales, elles portent le contenu que
 * `/map` ne peut pas porter, et renvoient vers la carte préfiltrée.
 *
 * Tout est rendu côté serveur, sans le moindre `use client` : c'est le point
 * qui manquait, `/map` ne servait aucun titre ni aucune phrase à un robot.
 */

export const dynamicParams = false;

export async function generateStaticParams() {
  // Le segment `[locale]` parent a déjà son `generateStaticParams` : Next
  // compose les deux, on ne renvoie donc que le paramètre de ce segment.
  return getAllRegions().map((region) => ({ region: region.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}): Promise<Metadata> {
  const { locale, region: slug } = await params;
  const region = await getRegionBySlug(slug);
  if (!region) return {};

  const t = await getTranslations({ locale, namespace: "mapRegion" });
  const regionName = localized(region.names, locale);
  const baseUrl = "https://dna.ascencia.re";
  const path = `${NAVIGATION.map}/${region.slug}`;

  // Le template `%s | DNA Interactive` de la racine ne s'applique qu'aux
  // segments enfants, et `map/layout.tsx` l'a déjà consommé pour son propre
  // titre. On suffixe donc à la main, comme le fait `generatePageMetadata`.
  const brandedTitle = `${t("metaTitle", { region: regionName })} | ${SITE_CONFIG.name}`;
  const description = t("metaDescription", {
    region: regionName,
    points: region.pointCount,
    categories: region.categoryCount,
  });

  return {
    title: { absolute: brandedTitle },
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}${path}`,
      languages: {
        fr: `${baseUrl}/fr${path}`,
        en: `${baseUrl}/en${path}`,
        de: `${baseUrl}/de${path}`,
        es: `${baseUrl}/es${path}`,
        ja: `${baseUrl}/jp${path}`,
        ko: `${baseUrl}/kr${path}`,
        "zh-Hant": `${baseUrl}/tc${path}`,
        "x-default": `${baseUrl}/en${path}`,
      },
    },
    openGraph: {
      type: "article",
      url: `${baseUrl}/${locale}${path}`,
      title: brandedTitle,
      description,
    },
  };
}

/** Chiffre + libellé, pour la ligne de statistiques sous le titre. */
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border border-gold/25 bg-gold/5 px-4 py-3 text-center">
      <div className="font-display text-2xl text-gold">{value}</div>
      <div className="font-caps text-[0.55rem] uppercase tracking-[0.18em] text-parch/70">
        {label}
      </div>
    </div>
  );
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}) {
  const { locale, region: slug } = await params;
  const region = await getRegionBySlug(slug);
  if (!region) notFound();

  const t = await getTranslations("mapRegion");
  const tCategories = await getTranslations("mapCategories");
  const tTypes = await getTranslations("mapTypes");
  const regionName = localized(region.names, locale);
  // Même résolution de nom que la carte : ressource officielle, type traduit, sinon nom relevé.
  const typeName = (m: (typeof region.categories)[number]["markerTypes"][number]) =>
    m.resourceIds?.length
      ? resourceName(m.resourceIds, locale)
      : m.messageKey && tTypes.has(m.messageKey)
        ? tTypes(m.messageKey)
        : m.rawName;
  const others = getOtherRegions(slug);
  const mapHref = `${NAVIGATION.map}?mapId=${region.id}`;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Fil d'Ariane : rattache la page à la carte pour le maillage interne. */}
        <nav className="mb-6 font-caps text-[0.6rem] uppercase tracking-[0.18em] text-parch/50">
          <Link href={NAVIGATION.map} className="transition-colors hover:text-gold">
            {t("breadcrumbMap")}
          </Link>
          <span className="mx-2 text-gold/40">/</span>
          <span className="text-parch/80">{regionName}</span>
        </nav>

        <header className="mb-10">
          <h1 className="font-display text-3xl text-parch md:text-4xl">
            {t("title", { region: regionName })}
          </h1>
          <p className="mt-4 font-sans text-parch/80 leading-relaxed">
            {t("lead", {
              region: regionName,
              points: region.pointCount,
              categories: region.categoryCount,
              types: region.markerTypeCount,
            })}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat value={region.categoryCount} label={t("statCategories")} />
            <Stat value={region.markerTypeCount} label={t("statTypes")} />
            <Stat value={region.pointCount} label={t("statPoints")} />
          </div>
        </header>

        {/* Aperçu cliquable : l'image reste statique, la carte interactive
            vit sur `/map`. Inutile d'embarquer Leaflet ici pour un aperçu. */}
        <Link
          href={mapHref}
          className="group relative mb-4 block overflow-hidden border border-line/30"
        >
          <DnaCornerBrackets size={16} />
          <Image
            src={region.image}
            alt={t("previewAlt", { region: regionName })}
            width={region.imageSize.width}
            height={region.imageSize.height}
            sizes="(max-width: 768px) 100vw, 768px"
            quality={70}
            // Aperçu au-dessus de la ligne de flottaison : c'est le LCP de la
            // page, il ne doit pas être différé.
            priority
            // Les fonds de carte sont carrés et en 4096 px : sans plafond, le
            // seul aperçu occupait toute la hauteur de l'écran et repoussait le
            // contenu hors de vue.
            className="max-h-[480px] w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent p-4 text-center font-caps text-[0.65rem] uppercase tracking-[0.2em] text-gold">
            {t("openInMap")}
          </span>
        </Link>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-parch">
            {t("whatToFind", { region: regionName })}
          </h2>

          <div className="mt-6 space-y-4">
            {region.categories.map((category) => (
              <DnaPanel key={category.id} className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-gold/30 bg-gold/10">
                    {/* ==Passer par `next/image`, meme pour une icone de 20 px==.
                        Ces icones viennent du CDN du jeu, en PNG bruts et non
                        redimensionnes : l'une d'elles pese 1,4 Mo pour un rendu
                        en 20 px, et la page en affiche des dizaines. Servies via
                        l'optimiseur, elles tombent a quelques kilo-octets et en
                        AVIF. L'hote est deja autorise dans `next.config.ts`. */}
                    <Image
                      src={category.markerTypes[0].icon}
                      alt=""
                      aria-hidden="true"
                      width={40}
                      height={40}
                      className="max-h-5 max-w-5 object-contain"
                    />
                  </span>
                  <div>
                    <h3 className="font-display text-lg text-parch">
                      {tCategories(category.id)}
                    </h3>
                    <p className="font-caps text-[0.55rem] uppercase tracking-[0.18em] text-gold/70">
                      {t("categoryMeta", {
                        types: category.markerTypes.length,
                        points: category.pointCount,
                      })}
                    </p>
                  </div>
                </div>

                <ul className="flex flex-wrap gap-2">
                  {category.markerTypes.map((markerType) => (
                    <li
                      key={markerType.id}
                      className="flex items-center gap-2 border border-line/25 bg-panel/40 px-3 py-1.5"
                    >
                      <Image
                        src={markerType.icon}
                        alt=""
                        aria-hidden="true"
                        width={32}
                        height={32}
                        className="h-4 w-4 object-contain"
                      />
                      <span className="font-sans text-sm text-parch/90">
                        {typeName(markerType)}
                      </span>
                      <span className="font-mono text-xs text-gold/70">
                        {markerType.pointCount}
                      </span>
                    </li>
                  ))}
                </ul>
              </DnaPanel>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-parch">{t("howToUse")}</h2>
          <p className="mt-3 font-sans text-parch/80 leading-relaxed">
            {t("howToUseBody")}
          </p>
          <Link
            href={mapHref}
            className="mt-5 inline-block border border-gold/40 bg-gold/10 px-5 py-2.5 font-caps text-[0.65rem] uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold/20"
          >
            {t("openInMap")}
          </Link>
        </section>

        {/* Maillage interne : chaque région pointe vers les quinze autres. */}
        <section className="mt-12">
          <h2 className="font-display text-2xl text-parch">{t("allRegions")}</h2>
          <p className="mt-2 font-sans text-sm text-parch/70">
            {t("allRegionsLead")}
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`${NAVIGATION.map}/${other.slug}`}
                  className="block border border-line/25 bg-panel/30 px-4 py-3 transition-colors hover:border-gold/40 hover:bg-gold/5"
                >
                  <span className="block font-display text-base text-parch">
                    {localized(other.names, locale)}
                  </span>
                  <span className="font-caps text-[0.55rem] uppercase tracking-[0.18em] text-parch/55">
                    {t("regionCardMeta", {
                      categories: other.categoryCount,
                      types: other.markerTypeCount,
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={NAVIGATION.map}
            className="mt-6 inline-block font-caps text-[0.65rem] uppercase tracking-[0.2em] text-gold transition-colors hover:text-gold-bright"
          >
            {t("backToMap")}
          </Link>
        </section>
      </div>
    </div>
  );
}
