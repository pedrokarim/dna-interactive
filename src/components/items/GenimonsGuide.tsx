import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, Layers, Sparkles, Swords, TrendingUp } from "lucide-react";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { GuideImageSlot } from "@/components/items/GuideImageSlot";
import { getItemTranslation, getItemsByCategoryId } from "@/lib/items/catalog";
import {
  TRAIT_CATEGORIES,
  categoryIconSrc,
  countTraitsByCategory,
  formatTraitEffect,
  fusionCostFromLowest,
  getTraitsByCategory,
  pickTraitText,
  traitIconSrc,
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

/**
 * Glyphe d'un Trait : celui du jeu, dans la couleur de sa rareté.
 *
 * Le texte alternatif porte la rareté plutôt qu'un intitulé, parce que c'est la
 * seule chose que l'image ajoute au nom du Trait écrit juste à côté.
 */
function TraitGlyph({ category, rarity, size = 26 }: { category: TraitCategory | "unknown"; rarity: number; size?: number }) {
  const src = traitIconSrc(category, rarity);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`${rarity}★`} width={size} height={size} loading="lazy" className="shrink-0" style={{ width: size, height: size }} />
  );
}

/** Glyphe neutre d'une catégorie. Décoratif : le titre à côté dit déjà laquelle. */
function CategoryGlyph({ category }: { category: TraitCategory }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={categoryIconSrc(category)} alt="" width={28} height={28} className="h-7 w-7 shrink-0 opacity-90" />
  );
}

/** Nombre d'emplacements qu'un Géniemon peut ouvrir, la quatrième ascension comprise. */
const MAX_TRAIT_SLOTS = 4;

/**
 * Trois Géniemons équipables, pris dans les données plutôt que cités en dur :
 * le schéma illustre un principe, pas une espèce en particulier, et figer des
 * identifiants le ferait mentir à la première mise à jour.
 */
function pickShowcaseGenimons(gameLang: string) {
  const seen = new Set<number>();
  const out: { id: string; name: string; icon: string }[] = [];
  for (const item of getItemsByCategoryId("genimons")) {
    const species = item.variants?.speciesId;
    const icon = item.icon?.publicPath;
    // Une seule variante par espèce : deux visuels identiques côte à côte
    // laisseraient croire qu'il faut des doublons.
    if (item.stats?.maxLevel !== 60 || !icon || !species || seen.has(species)) continue;
    seen.add(species);
    out.push({ id: item.id, name: getItemTranslation(item, gameLang, ["EN"]).modName ?? "", icon });
    if (out.length === 4) break;
  }
  return out;
}

/**
 * Actif / inactif : d'où viennent les Traits et où ils vont.
 *
 * Dessiné avec les vrais visuels du jeu – têtes de Géniemon et glyphes de Trait –
 * plutôt qu'avec des formes inventées, pour que le lecteur reconnaisse à l'écran
 * ce qu'il a sous les yeux dans le jeu.
 */
async function TraitFlowDiagram({ gameLang, locale }: { gameLang: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: "genimonGuide" });
  const showcase = pickShowcaseGenimons(gameLang);
  if (showcase.length < MAX_TRAIT_SLOTS) return null;

  const donors = showcase.slice(0, 3);
  const host = showcase[3]!;
  const donorCategories: TraitCategory[] = ["battle", "speed", "world"];

  return (
    <div className="border border-white/10 bg-ink/45 p-4 md:p-5">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-6">
        {/* ------------------------------------------------ les inactifs */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-muted-2">{t("flowInactive")}</span>
          <div className="flex gap-2">
            {donors.map((genimon, i) => (
              <div key={genimon.id} className="flex w-20 flex-col items-center gap-1 border border-white/10 bg-panel/40 px-2 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={genimon.icon}
                  alt={genimon.name}
                  width={44}
                  height={44}
                  loading="lazy"
                  className="h-11 w-11 opacity-45 grayscale"
                />
                <TraitGlyph category={donorCategories[i]!} rarity={4} size={22} />
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="h-5 w-5 shrink-0 rotate-90 md:rotate-0" style={{ color: GENIMON_ACCENT }} aria-hidden />

        {/* --------------------------------------------------- l'actif */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-caps text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: GENIMON_ACCENT }}>
            {t("flowActive")}
          </span>
          <div className="flex w-36 flex-col items-center gap-2 border border-anemo/30 bg-panel/60 px-3 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={host.icon} alt={host.name} width={60} height={60} loading="lazy" className="h-15 w-15" />
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_TRAIT_SLOTS }, (_, i) =>
                donorCategories[i] ? (
                  <TraitGlyph key={i} category={donorCategories[i]!} rarity={4} size={22} />
                ) : (
                  // Le quatrième reste vide : seule une variante scintillante l'ouvre.
                  <span key={i} className="h-[22px] w-[22px] border border-dashed border-white/25" />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted">{t("flowCaption")}</p>
    </div>
  );
}

async function TraitTable({ category, gameLang, locale }: { category: TraitCategory; gameLang: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: "genimonGuide" });
  const traits = getTraitsByCategory(category, gameLang);
  if (traits.length === 0) return null;

  return (
    <div className="border border-white/10 bg-panel/55">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h3 className="flex items-center gap-2.5 font-display text-lg text-parch">
          <CategoryGlyph category={category} />
          {t(`category_${category}`)}
        </h3>
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
            <li key={trait.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span className="flex w-[5.4rem] shrink-0 items-center gap-1">
                {rarities.map((r) => <TraitGlyph key={r} category={trait.category} rarity={r} />)}
              </span>
              <span className="min-w-[7rem] text-sm font-medium text-parch">{pickTraitText(trait.name, gameLang)}</span>
              <span className="flex-1 text-sm text-parch/85">{formatTraitEffect(pickTraitText(trait.effect, gameLang))}</span>
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
        <div className="mt-5">
          <TraitFlowDiagram gameLang={gameLang} locale={locale} />
        </div>
      </section>

      {/* --------------------------------------- l'Entraînement de Géniemon */}
      <section>
        <DnaSectionLabel>{t("trainingTitle")}</DnaSectionLabel>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-parch/85">{t("trainingBody")}</p>
            <p className="border-l-2 pl-3 text-sm text-parch/85" style={{ borderColor: GENIMON_ACCENT }}>
              {t("trainingLevel")}
            </p>
          </div>
          <GuideImageSlot slot="training" family="genimons" caption={t("imageTraining")} ratio="4 / 3" />
        </div>
      </section>

      {/* -------------------------------------------------- fusion, rareté */}
      <section>
        <DnaSectionLabel>{t("fusionTitle")}</DnaSectionLabel>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-parch/85">{t("fusionBody")}</p>
            {/*
              La chaîne garde la même catégorie d'un bout à l'autre : la fusion
              ne change pas le Trait, seulement sa rareté. Montrer trois glyphes
              différents laisserait croire le contraire.
            */}
            <div className="flex flex-wrap items-center gap-2 border border-white/10 bg-ink/55 px-3 py-3 text-sm text-parch/85">
              <TraitGlyph category="battle" rarity={3} size={30} /> <span className="text-muted">×3</span>
              <ArrowRight className="h-4 w-4" style={{ color: GENIMON_ACCENT }} />
              <TraitGlyph category="battle" rarity={4} size={30} /> <span className="text-muted">×3</span>
              <ArrowRight className="h-4 w-4" style={{ color: GENIMON_ACCENT }} />
              <TraitGlyph category="battle" rarity={5} size={30} />
              <span className="ml-2 text-xs text-muted-2">{t("fusionChainNote")}</span>
            </div>
            <p className="text-sm leading-relaxed text-parch/85">{t("goldOnlyNote")}</p>
          </div>
          <GuideImageSlot slot="fusion" family="genimons" caption={t("imageFusion")} ratio="4 / 3" />
        </div>
      </section>

      {/* ----------------------------------------------- la liste complète */}
      <section>
        <DnaSectionLabel>{t("listTitle")}</DnaSectionLabel>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-parch/85">{t("listBody")}</p>
        <p className="mt-2 max-w-3xl text-xs text-muted-2">{t("listValueNote")}</p>
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
