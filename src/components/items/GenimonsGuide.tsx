import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, Layers, Sparkles, Swords, TrendingUp } from "lucide-react";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { GuideImageSlot } from "@/components/items/GuideImageSlot";
import {
  TRAIT_CATEGORIES,
  countTraitsByCategory,
  fusionCostFromLowest,
  getTraitsByCategory,
  pickTraitText,
  traitRarities,
  type TraitCategory,
} from "@/lib/genimons/traits";

/**
 * Guide des Géniemons.
 *
 * Deux moitiés qui se répondent, d'où une seule page : élever la créature
 * (niveaux, ascensions, passif), puis greffer et fusionner ses **Traits** —
 * parce que ce sont les ascensions qui ouvrent les emplacements de Trait, et
 * que séparer les deux obligerait le lecteur à faire l'aller-retour.
 *
 * Les noms et les effets des Traits viennent des données du jeu, déjà
 * traduits : rien n'est réécrit ici, et les catégories sont celles du jeu.
 */

/** Couleur d'accent du guide, alignée sur la catégorie Géniemon du site. */
const GENIMON_ACCENT = "var(--color-anemo)";

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 px-3 py-1 text-xs text-parch">
      {icon}
      {label}
    </span>
  );
}

/** Pastille de rareté : la couleur est celle du jeu, pas une invention. */
function RarityDot({ rarity }: { rarity: number }) {
  const tone =
    rarity >= 5 ? "border-gold/50 bg-gold/15 text-gold"
      : rarity === 4 ? "border-[#a78bfa]/50 bg-[#a78bfa]/15 text-[#c4b5fd]"
        : "border-hydro/50 bg-hydro/15 text-hydro";
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-sm border text-[0.62rem] font-semibold ${tone}`}>
      {rarity}
    </span>
  );
}

async function TraitTable({ category, gameLang, locale }: { category: TraitCategory; gameLang: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: "genimonGuide" });
  const traits = getTraitsByCategory(category, gameLang);
  if (traits.length === 0) return null;

  return (
    <div className="border border-white/10 bg-panel/55">
      <div className="flex items-baseline justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h3 className="font-display text-lg text-parch">{t(`category_${category}`)}</h3>
        <span className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-muted">
          {t("traitCount", { count: traits.length })}
        </span>
      </div>
      <p className="px-4 pt-3 text-xs text-muted">{t(`categoryHint_${category}`)}</p>
      <ul className="divide-y divide-white/8">
        {traits.map((trait) => {
          const rarities = traitRarities(trait);
          const fusion = fusionCostFromLowest(trait);
          return (
            <li key={trait.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
              <span className="flex shrink-0 items-center gap-1">
                {rarities.map((r) => <RarityDot key={r} rarity={r} />)}
              </span>
              <span className="min-w-[7rem] text-sm font-medium text-parch">{pickTraitText(trait.name, gameLang)}</span>
              <span className="flex-1 text-sm text-parch/85">{pickTraitText(trait.effect, gameLang)}</span>
              {trait.goldOnly ? (
                <span className="shrink-0 rounded-sm border border-gold/35 px-2 py-0.5 text-[0.62rem] text-gold">
                  {t("goldOnly")}
                </span>
              ) : fusion ? (
                <span className="shrink-0 text-[0.68rem] text-muted-2">{t("fusionFromLowest", { count: fusion })}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export async function GenimonsGuide({
  categorySlug,
  gameLang,
  locale,
}: {
  categorySlug: string;
  /** Code langue des données de jeu (EN, FR, JP…). */
  gameLang: string;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "genimonGuide" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const counts = countTraitsByCategory();
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------ chapô */}
      <section className="border border-anemo/25 bg-panel/65 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/items/${categorySlug}`}
            className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-sm text-parch transition-colors hover:border-anemo/40"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("backToList")}
          </Link>
          <Badge icon={<BookOpenText className="h-3.5 w-3.5 text-anemo" />} label={t("badge")} />
        </div>

        <h1 className="mt-5 font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-parch/85">{t("intro")}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge icon={<TrendingUp className="h-3.5 w-3.5 text-gold" />} label={t("badgeLevels")} />
          <Badge icon={<Layers className="h-3.5 w-3.5 text-gold" />} label={t("badgeTraits", { count: total })} />
          <Badge icon={<Sparkles className="h-3.5 w-3.5 text-anemo" />} label={t("badgeFusion")} />
        </div>

        <div className="mt-6">
          <GuideImageSlot slot="overview" family="genimons" caption={t("imageOverview")} className="max-w-3xl" />
        </div>
      </section>

      {/* -------------------------------------------------------- élevage */}
      <section>
        <DnaSectionLabel>{t("raiseTitle")}</DnaSectionLabel>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-parch/85">{t("raiseBody")}</p>
            <ul className="space-y-2">
              {(t.raw("raiseSteps") as string[]).map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 border border-white/10 bg-ink/55 px-3 py-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: GENIMON_ACCENT }} />
                  <span className="text-sm text-parch/85">{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <GuideImageSlot slot="levelUp" family="genimons" caption={t("imageLevelUp")} ratio="4 / 3" />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <GuideImageSlot slot="ascension" family="genimons" caption={t("imageAscension")} ratio="4 / 3" />
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-parch/85">{t("ascensionBody")}</p>
            <p className="border-l-2 pl-3 text-sm text-parch/85" style={{ borderColor: GENIMON_ACCENT }}>
              {t("ascensionOpensSlots")}
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- passif propre */}
      <section>
        <DnaSectionLabel>{t("passiveTitle")}</DnaSectionLabel>
        <div className="mt-4 space-y-3">
          <p className="max-w-3xl text-sm leading-relaxed text-parch/85">{t("passiveBody")}</p>
          <p className="max-w-3xl border-l-2 pl-3 text-sm text-parch/85" style={{ borderColor: GENIMON_ACCENT }}>
            {t("passiveShiny")}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ traits : principe */}
      <section>
        <DnaSectionLabel>{t("traitsTitle")}</DnaSectionLabel>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-parch/85">{t("traitsBody")}</p>
            <p className="text-sm leading-relaxed text-parch/85">{t("traitsActiveInactive")}</p>
          </div>
          <GuideImageSlot slot="traitSlots" family="genimons" caption={t("imageTraitSlots")} ratio="4 / 3" />
        </div>
      </section>

      {/* -------------------------------------------------- fusion, rareté */}
      <section>
        <DnaSectionLabel>{t("fusionTitle")}</DnaSectionLabel>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-parch/85">{t("fusionBody")}</p>
            <div className="flex flex-wrap items-center gap-2 border border-white/10 bg-ink/55 px-3 py-3 text-sm text-parch/85">
              <RarityDot rarity={3} /> <span className="text-muted">×3</span>
              <ArrowRight className="h-3.5 w-3.5" style={{ color: GENIMON_ACCENT }} />
              <RarityDot rarity={4} /> <span className="text-muted">×3</span>
              <ArrowRight className="h-3.5 w-3.5" style={{ color: GENIMON_ACCENT }} />
              <RarityDot rarity={5} />
              <span className="ml-2 text-xs text-muted-2">{t("fusionChainNote")}</span>
            </div>
            <p className="text-sm leading-relaxed text-parch/85">{t("rerollBody")}</p>
          </div>
          <GuideImageSlot slot="fusion" family="genimons" caption={t("imageFusion")} ratio="4 / 3" />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <GuideImageSlot slot="reroll" family="genimons" caption={t("imageReroll")} ratio="16 / 9" />
          <p className="self-center text-sm text-muted">{t("rerollNote")}</p>
        </div>
      </section>

      {/* ----------------------------------------------- la liste complète */}
      <section>
        <DnaSectionLabel>{t("listTitle")}</DnaSectionLabel>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-parch/85">{t("listBody")}</p>
        <div className="mt-5 space-y-5">
          {TRAIT_CATEGORIES.map((category) => (
            <TraitTable key={category} category={category} gameLang={gameLang} locale={locale} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ suite */}
      <section className="border border-anemo/25 bg-linear-to-r from-anemo/10 to-gold/10 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl text-parch">
          <Swords className="h-5 w-5 text-anemo" />
          {t("nextTitle")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-parch/85">{t("nextBody")}</p>
        <Link
          href={`/items/${categorySlug}`}
          className="mt-4 inline-flex items-center gap-2 rounded-sm border border-anemo/35 bg-anemo/10 px-3 py-2 text-sm font-medium text-anemo transition-colors hover:bg-anemo/20"
        >
          {t("nextLink")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
