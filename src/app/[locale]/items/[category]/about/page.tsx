import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeInfo,
  BookOpenText,
  Calculator,
  Database,
  ImageIcon,
  Languages,
  Layers,
  SlidersHorizontal,
  Sparkles,
  Target,
  Zap,
  Wrench,
} from "lucide-react";
import { CalamityWeaponsGuide } from "@/components/items/CalamityWeaponsGuide";
import { GenimonsGuide } from "@/components/items/GenimonsGuide";
import { GuideImageSlot } from "@/components/items/GuideImageSlot";
import {
  getItemCatalog,
  getItemCategoryBySlug,
} from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";
import { toGameDataLangCode, toLocale } from "@/i18n/config";

type CategoryAboutPageProps = {
  params: Promise<{ locale: string; category: string }>;
};

function GuideBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 px-3 py-1 text-xs text-parch">
      {icon}
      {label}
    </span>
  );
}

function GuideIconCard({
  src,
  label,
  sublabel,
}: {
  src: string;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-sm border border-white/10 bg-ink/65 p-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-gold/20 bg-panel/70 p-2">
        <img src={src} alt={label} width={56} height={56} loading="lazy" className="max-h-full max-w-full object-contain" />
      </div>
      <p className="mt-2 text-sm font-medium text-parch">{label}</p>
      {sublabel ? <p className="text-xs text-muted">{sublabel}</p> : null}
    </div>
  );
}

// Noms propres de Demon Wedges : non traduits, ils portent le nom du jeu.
const DEMON_WEDGE_EXAMPLES = [
  { src: "/assets/items/mods/T_Mod_Phoenix01.png", label: "Phoenix" },
  { src: "/assets/items/mods/T_Mod_Ifrit01.png", label: "Ifrit" },
  { src: "/assets/items/mods/T_Mod_Fenrir01.png", label: "Fenrir" },
  { src: "/assets/items/mods/T_Mod_Sphinx01.png", label: "Sphinx" },
  { src: "/assets/items/mods/T_Mod_Bahamut01.png", label: "Bahamut" },
  { src: "/assets/items/mods/T_Mod_Yatagarasu01.png", label: "Yatagarasu" },
  { src: "/assets/items/mods/T_Mod_Hastur01.png", label: "Hastur" },
  { src: "/assets/items/mods/T_Mod_Lilith01.png", label: "Lilith" },
];

const AFFINITY_EXAMPLES = [
  { src: "/assets/items/mods/T_Armory_Dark.png", key: "dark" },
  { src: "/assets/items/mods/T_Armory_Fire.png", key: "fire" },
  { src: "/assets/items/mods/T_Armory_Water.png", key: "water" },
  { src: "/assets/items/mods/T_Armory_Thunder.png", key: "thunder" },
  { src: "/assets/items/mods/T_Armory_Wind.png", key: "wind" },
  { src: "/assets/items/mods/T_Armory_Light.png", key: "light" },
] as const;

const TYPE_COMPAT_EXAMPLES = [
  { src: "/assets/items/mods/T_Armory_RoleType_01.png", key: "character" },
  { src: "/assets/items/mods/T_Armory_RoleType_02.png", key: "melee" },
  { src: "/assets/items/mods/T_Armory_RoleType_03.png", key: "ranged" },
  { src: "/assets/items/mods/T_Armory_RoleType_04.png", key: "meleeUltra" },
  { src: "/assets/items/mods/T_Armory_RoleType_05.png", key: "rangedUltra" },
] as const;

const POLARITY_ICONS = [
  "/assets/items/mods/T_Armory_Polarity01.png",
  "/assets/items/mods/T_Armory_Polarity02.png",
  "/assets/items/mods/T_Armory_Polarity03.png",
  "/assets/items/mods/T_Armory_Polarity04.png",
];

async function ModsAboutContent({ categorySlug }: { categorySlug: string }) {
  const t = await getTranslations("itemsAbout");
  const tCommon = await getTranslations("common");
  const tElement = await getTranslations("common.elements");
  const code = (chunks: React.ReactNode) => <code>{chunks}</code>;

  return (
    <div className="space-y-8">
      <section className="border border-hydro/25 bg-panel/65 p-8 shadow-[0_24px_55px_rgba(8,47,73,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/items/${categorySlug}`}
            className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-sm text-parch transition-colors hover:border-hydro/40 hover:text-parch"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("backToList")}
          </Link>
          <GuideBadge icon={<BookOpenText className="h-3.5 w-3.5 text-hydro" />} label={t("guideBadge")} />
        </div>

        <h1 className="mt-5 font-display text-4xl text-parch">{t("title")}</h1>
        <p className="mt-3 max-w-3xl text-parch/85">
          {t.rich("intro", {
            mod: (chunks) => <span className="text-hydro">{chunks}</span>,
          })}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <GuideBadge icon={<Layers className="h-3.5 w-3.5 text-gold" />} label={t("badgeLevels")} />
          <GuideBadge icon={<Calculator className="h-3.5 w-3.5 text-gold" />} label={t("badgeTolerance")} />
          <GuideBadge icon={<Languages className="h-3.5 w-3.5 text-anemo" />} label={t("badgeTranslations")} />
          <GuideBadge icon={<Database className="h-3.5 w-3.5 text-electro" />} label={t("badgeReference")} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="border border-white/10 bg-panel/55 p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-display text-xl text-parch">
            <ImageIcon className="h-5 w-5 text-electro" />
            {t("showcaseTitle")}
          </h2>
          <p className="mt-3 text-sm text-parch/85">{t("showcaseDescription")}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {DEMON_WEDGE_EXAMPLES.map((entry) => (
              <GuideIconCard
                key={entry.src}
                src={entry.src}
                label={entry.label}
                sublabel={t("showcaseIconSublabel")}
              />
            ))}
          </div>
        </article>

        <article className="border border-white/10 bg-panel/55 p-6">
          <h2 className="font-display text-lg text-parch">{t("readTitle")}</h2>
          <div className="mt-4 space-y-3 text-sm text-parch/85">
            <div className="rounded-sm border border-white/10 bg-ink/60 p-3">
              <p className="font-medium text-parch">{t("readStep1Title")}</p>
              <p className="mt-1 text-xs text-muted">{t("readStep1Text")}</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-ink/60 p-3">
              <p className="font-medium text-parch">{t("readStep2Title")}</p>
              <p className="mt-1 text-xs text-muted">{t("readStep2Text")}</p>
            </div>
            <div className="rounded-sm border border-white/10 bg-ink/60 p-3">
              <p className="font-medium text-parch">{t("readStep3Title")}</p>
              <p className="mt-1 text-xs text-muted">{t("readStep3Text")}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {POLARITY_ICONS.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={t("polarityItem", { num: index + 1 })}
                width={36}
                height={36}
                loading="lazy"
                className="h-9 w-9 rounded-sm border border-white/10 bg-ink/70 p-1 object-contain"
              />
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="border border-white/10 bg-panel/55 p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-display text-xl text-parch">
            <BadgeInfo className="h-5 w-5 text-hydro" />
            {t("structureTitle")}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-parch/85">
            <li>{t("structureItem1")}</li>
            <li>{t.rich("structureItem2", { c: code })}</li>
            <li>{t("structureItem3")}</li>
            <li>{t("structureItem4")}</li>
          </ul>
        </article>

        <article className="border border-white/10 bg-panel/55 p-5">
          <h2 className="font-display text-lg text-parch">{t("affinityTitle")}</h2>
          <p className="mt-3 text-sm text-parch/85">{t("affinityDescription")}</p>

          <div className="mt-4">
            <p className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">
              {t("polarityLabel")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {POLARITY_ICONS.map((src, index) => (
                <div
                  key={src}
                  className="flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 p-2 text-xs text-parch"
                >
                  <img
                    src={src}
                    alt={t("polarityItem", { num: index + 1 })}
                    width={24}
                    height={24}
                    loading="lazy"
                    className="h-6 w-6 object-contain"
                  />
                  {t("polarityItem", { num: index + 1 })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">
              {t("affinityElementalLabel")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {AFFINITY_EXAMPLES.map((entry) => (
                <div
                  key={entry.src}
                  className="flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 p-2 text-xs text-parch"
                >
                  <img src={entry.src} alt={tElement(entry.key)} width={20} height={20} loading="lazy" className="h-5 w-5 object-contain" />
                  {tElement(entry.key)}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">
              {t("typeCompatLabel")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_COMPAT_EXAMPLES.map((entry) => (
                <div
                  key={entry.src}
                  className="flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 p-2 text-xs text-parch"
                >
                  <img
                    src={entry.src}
                    alt={t(`typeCompat.${entry.key}`)}
                    width={20}
                    height={20}
                    loading="lazy"
                    className="h-5 w-5 object-contain"
                  />
                  {t(`typeCompat.${entry.key}`)}
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="border border-white/10 bg-panel/55 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl text-parch">
            <SlidersHorizontal className="h-5 w-5 text-gold" />
            {t("levelsTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-parch/85">{t.rich("levelsText", { c: code })}</p>
          <div className="mt-4 rounded-sm border border-gold/25 bg-gold/10 p-4 text-sm text-gold">
            {t.rich("levelsDefault", { c: code })}
            <br />
            {t.rich("levelsMax", { c: code })}
          </div>
        </article>

        <article className="border border-white/10 bg-panel/55 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl text-parch">
            <Calculator className="h-5 w-5 text-gold" />
            {t("toleranceTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-parch/85">{t("toleranceText")}</p>
          <div className="mt-4 rounded-sm border border-gold/25 bg-gold/10 p-4 font-mono text-sm text-gold">
            tolerance(level) = Cost + level * CostChange
          </div>
          <p className="mt-3 text-xs text-muted">{t.rich("toleranceNote", { c: code })}</p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="border border-white/10 bg-panel/55 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl text-parch">
            <Languages className="h-5 w-5 text-anemo" />
            {t("multilangTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-parch/85">{t("multilangText")}</p>
          <p className="mt-3 text-xs text-muted">{t("multilangNote")}</p>
        </article>

        <article className="border border-white/10 bg-panel/55 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl text-parch">
            <Wrench className="h-5 w-5 text-electro" />
            {t("displayTitle")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-parch/85">
            <li>{t("displayItem1")}</li>
            <li>{t("displayItem2")}</li>
            <li>{t("displayItem3")}</li>
            <li>{t("displayItem4")}</li>
            <li>{t("displayItem5")}</li>
          </ul>
        </article>
      </section>

      <section className="border border-gold/25 bg-linear-to-r from-gold/10 via-panel/40 to-electro/10 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl text-parch">
          <Zap className="h-5 w-5 text-gold" />
          {t("quickTitle")}
        </h2>
        <p className="mt-3 text-sm text-parch">{t("quickText")}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-sm border border-white/10 bg-ink/60 p-4">
            <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">
              {t("stepLabel", { num: 1 })}
            </p>
            <p className="mt-1 text-sm font-medium text-parch">{t("step1Title")}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-white/10 bg-panel/70 p-2">
                <img src="/assets/items/mods/T_Mod_Phoenix01.png" alt={t("altPhoenixExample")} width={48} height={48} loading="lazy" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="text-xs text-muted">
                {t("step1Line1")}
                <br />
                {t("step1Line2")}
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-white/10 bg-ink/60 p-4">
            <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">
              {t("stepLabel", { num: 2 })}
            </p>
            <p className="mt-1 text-sm font-medium text-parch">{t("step2Title")}</p>
            <div className="mt-3 flex items-center gap-2">
              <img src="/assets/items/mods/T_Armory_Fire.png" alt={t("altAffinityFire")} width={28} height={28} loading="lazy" className="h-7 w-7 rounded-sm border border-white/10 bg-panel/70 p-1 object-contain" />
              <img src="/assets/items/mods/T_Armory_Polarity02.png" alt={t("polarityItem", { num: 2 })} width={28} height={28} loading="lazy" className="h-7 w-7 rounded-sm border border-white/10 bg-panel/70 p-1 object-contain" />
              <img src="/assets/items/mods/T_Armory_RoleType_03.png" alt={t("altCompatRanged")} width={28} height={28} loading="lazy" className="h-7 w-7 rounded-sm border border-white/10 bg-panel/70 p-1 object-contain" />
            </div>
          </div>

          <div className="rounded-sm border border-white/10 bg-ink/60 p-4">
            <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">
              {t("stepLabel", { num: 3 })}
            </p>
            <p className="mt-1 text-sm font-medium text-parch">{t("step3Title")}</p>
            <div className="mt-3 rounded-sm border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
              {t("step3Line1")}
              <br />
              {t("step3Line2")}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <Target className="h-3.5 w-3.5 text-gold" />
              {t("step3Note")}
            </div>
          </div>
        </div>
      </section>

      {/* Les trois sujets qui manquaient au guide, et qui sont exactement ceux
          sur lesquels on s'est trompé : les pistes, le centre, l'empilement. */}
      <section className="border border-white/10 bg-panel/55 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl text-parch">
          <SlidersHorizontal className="h-5 w-5 text-gold" />
          {t("trackTitle")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-parch/85">{t("trackIntro")}</p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-parch">{t("trackBadgeTitle")}</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-parch/85">
              <li>{t("trackBadgeCost")}</li>
              <li>{t("trackBadgeGlyph")}</li>
              <li>{t("trackBadgeCrown")}</li>
              <li>{t("trackBadgeGreen")}</li>
            </ul>
            <p className="mt-4 border-l-2 border-gold/50 pl-3 text-sm text-parch/85">{t("trackRule")}</p>
            <p className="mt-3 text-sm text-muted">{t("trackCostRule")}</p>
          </div>
          <GuideImageSlot slot="trackBadge" family="mods" caption={t("captionBadge")} ratio="4 / 3" />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <GuideImageSlot slot="board" family="mods" caption={t("captionBoard")} />
          <GuideImageSlot slot="trackShiftApply" family="mods" caption={t("captionApply")} />
        </div>
      </section>

      <section className="border border-white/10 bg-panel/55 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl text-parch">
          <Target className="h-5 w-5 text-electro" />
          {t("centerTitle")}
        </h2>
        <div className="mt-3 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 text-sm text-parch/85">
            <p>{t("centerIntro")}</p>
            <p>{t("centerAffinity")}</p>
            <p>{t("centerTiers")}</p>
          </div>
          <GuideImageSlot slot="center" family="mods" caption={t("captionCenter")} ratio="4 / 3" />
        </div>
      </section>

      <section className="border border-white/10 bg-panel/55 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl text-parch">
          <Layers className="h-5 w-5 text-anemo" />
          {t("stackTitle")}
        </h2>
        <div className="mt-3 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 text-sm text-parch/85">
            <p>{t("stackIntro")}</p>
            <p className="border-l-2 border-anemo/50 pl-3">{t("stackRule")}</p>
            <p className="text-muted">{t("stackTrap")}</p>
          </div>
          <GuideImageSlot slot="stacking" family="mods" caption={t("captionStacking")} ratio="4 / 3" />
        </div>
      </section>

      <section className="border border-hydro/25 bg-linear-to-r from-hydro/10 to-gold/10 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl text-parch">
          <Sparkles className="h-5 w-5 text-hydro" />
          {t("nextTitle")}
        </h2>
        <p className="mt-3 text-sm text-parch">{t("nextText")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/items/${categorySlug}`}
            className="inline-flex items-center gap-2 rounded-sm border border-hydro/35 bg-hydro/10 px-4 py-2 text-sm font-medium text-hydro transition-colors hover:bg-hydro/20"
          >
            {t("nextOpenGrid")}
          </Link>
          <Link
            href="/items/favoris"
            className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-4 py-2 text-sm text-parch transition-colors hover:border-hydro/40 hover:text-parch"
          >
            {t("nextFavorites")}
          </Link>
        </div>
      </section>
    </div>
  );
}

async function GenericCategoryAboutContent({
  categoryTitle,
  categorySlug,
}: {
  categoryTitle: string;
  categorySlug: string;
}) {
  const t = await getTranslations("itemsAbout");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-8">
      <section className="border border-gold/25 bg-panel/65 p-8">
        <Link
          href={`/items/${categorySlug}`}
          className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-sm text-parch transition-colors hover:border-gold/40 hover:text-parch"
        >
          <ArrowLeft className="h-4 w-4" />
          {tCommon("backToList")}
        </Link>
        <h1 className="mt-5 font-display text-4xl text-parch">
          {t("genericTitle", { category: categoryTitle })}
        </h1>
        <p className="mt-3 max-w-3xl text-parch/85">{t("genericText")}</p>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  const catalog = getItemCatalog();
  return catalog.categories.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata(
  { params }: CategoryAboutPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale, category: categorySlug } = await params;
  const category = getItemCategoryBySlug(categorySlug);
  const t = await getTranslations({ locale, namespace: "itemsAbout" });

  if (!category) {
    return generatePageMetadata(
      {
        title: t("metaFallbackTitle"),
        description: t("metaFallbackDescription"),
        path: "/items",
      },
      parent,
      locale,
    );
  }

  const tCalamity = await getTranslations({ locale, namespace: "calamityGuide" });
  const isWeapons = category.id === "weapons";
  const isMods = category.id === "mods";

  return generatePageMetadata(
    {
      title: isWeapons
        ? tCalamity("metaTitle")
        : isMods
          ? t("guideBadge")
          : t("genericTitle", { category: category.title }),
      description: isWeapons
        ? tCalamity("metaDescription")
        : isMods
          ? t("metaModsDescription")
          : t("metaGenericDescription", { category: category.title }),
      path: `/items/${category.slug}/about`,
      keywords: [
        "Duet Night Abyss",
        "items guide",
        "demon wedge",
        "calamity weapons",
        "armes de calamité",
        "fusion de calamité",
        "mods",
        "affinite",
        "tolerance",
        category.title,
      ],
    },
    parent,
    locale,
  );
}

export default async function CategoryAboutPage({ params }: CategoryAboutPageProps) {
  const { locale, category: categorySlug } = await params;
  const category = getItemCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  if (category.id === "mods") {
    return <ModsAboutContent categorySlug={category.slug} />;
  }

  if (category.id === "genimons") {
    return (
      <GenimonsGuide
        categorySlug={category.slug}
        gameLang={toGameDataLangCode(toLocale(locale))}
        locale={locale}
      />
    );
  }

  if (category.id === "weapons") {
    // Les libellés issus des données de jeu suivent la locale de la page.
    return (
      <CalamityWeaponsGuide
        categorySlug={category.slug}
        gameLang={toGameDataLangCode(toLocale(locale))}
        locale={locale}
      />
    );
  }

  return <GenericCategoryAboutContent categoryTitle={category.title} categorySlug={category.slug} />;
}
