import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Layers, Sparkles, Swords, TrendingUp } from "lucide-react";
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

/**
 * Une espèce et sa variante scintillante, prises dans les données.
 *
 * Les deux partagent le passif et ses valeurs : seul le nombre d'emplacements
 * de Trait les sépare. Le couple se lit dans `variants` (`isPremium`,
 * `premiumGuid`) plutôt que d'être cité en dur.
 */
function pickVariantPair(gameLang: string) {
  const all = getItemsByCategoryId("genimons");
  for (const premium of all) {
    if (!premium.variants?.isPremium || premium.stats?.maxLevel !== 60 || !premium.icon?.publicPath) continue;
    const ordinary = all.find(
      (i) => i.variants?.premiumGuid === premium.variants?.guid && !i.variants?.isPremium && i.icon?.publicPath,
    );
    if (!ordinary) continue;
    const name = (item: typeof premium) => getItemTranslation(item, gameLang, ["EN"]).modName ?? "";
    return {
      ordinary: { name: name(ordinary), icon: ordinary.icon!.publicPath! },
      premium: { name: name(premium), icon: premium.icon!.publicPath! },
    };
  }
  return null;
}

/** Une carte du comparatif : la créature, son nom, sa rangée d'emplacements. */
function VariantCard({
  icon,
  name,
  label,
  slots,
  accent,
}: {
  icon: string;
  name: string;
  label: string;
  slots: number;
  accent: boolean;
}) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-2 border px-4 py-4 ${accent ? "border-anemo/30 bg-panel/60" : "border-white/10 bg-panel/35"}`}>
      <span className="font-caps text-[0.6rem] uppercase tracking-[0.2em]" style={accent ? { color: GENIMON_ACCENT } : undefined}>
        {label}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt={name} width={64} height={64} loading="lazy" className="h-16 w-16" />
      <span className="text-center text-sm text-parch">{name}</span>
      <div className="mt-1 flex gap-1.5">
        {Array.from({ length: 4 }, (_, i) =>
          i < slots ? (
            <span key={i} className="h-5 w-5 border border-white/35 bg-white/10" />
          ) : (
            // Le quatrième carré reste vide sur l'ordinaire : c'est tout l'écart.
            <span key={i} className="h-5 w-5 border border-dashed border-white/15" />
          ),
        )}
      </div>
      <span className="font-caps text-[0.62rem] tracking-[0.15em] text-muted">{slots} / 4</span>
    </div>
  );
}

/** Ordinaire contre scintillante : le même passif, un emplacement de plus. */
async function VariantCompare({ gameLang, locale }: { gameLang: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: "genimonGuide" });
  const pair = pickVariantPair(gameLang);
  if (!pair) return null;

  return (
    <div className="border border-white/10 bg-ink/45 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <VariantCard icon={pair.ordinary.icon} name={pair.ordinary.name} label={t("variantOrdinary")} slots={3} accent={false} />
        <VariantCard icon={pair.premium.icon} name={pair.premium.name} label={t("variantShiny")} slots={4} accent />
      </div>
      <p className="mt-4 text-center text-xs text-muted">{t("variantShinyTell")}</p>
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

/**
 * Les repères du chapô : ce que le guide couvre, et une première image.
 * Rendu par le sommaire, sous l'introduction.
 */
export async function GenimonsGuideIntro({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "genimonGuide" });
  const total = countTraitsByCategory().reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge icon={<TrendingUp className="h-3.5 w-3.5 text-gold" />} label={t("badgeLevels")} />
        <Badge icon={<Layers className="h-3.5 w-3.5 text-gold" />} label={t("badgeTraits", { count: total })} />
        <Badge icon={<Sparkles className="h-3.5 w-3.5 text-anemo" />} label={t("badgeFusion")} />
      </div>
      <div className="mt-6">
        <GuideImageSlot slot="overview" family="genimons" caption={t("imageOverview")} className="max-w-3xl" />
      </div>
    </>
  );
}

/**
 * Un chapitre du guide.
 *
 * Le titre n'est pas posé ici : la page de chapitre le rend en `h1`, pour que
 * chaque adresse porte un vrai titre plutôt qu'un intertitre perdu dans un mur.
 */
export async function GenimonsGuideChapter({
  chapter,
  categorySlug,
  gameLang,
  locale,
}: {
  chapter: string;
  categorySlug: string;
  /** Code langue des données de jeu (EN, FR, JP…). */
  gameLang: string;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "genimonGuide" });

  switch (chapter) {
    // ──────────────────────────────────────────────────────────── élevage
    case "raise":
      return (
        <div>
          <div className="space-y-4">
            <div className="max-w-3xl space-y-3">
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
            <GuideImageSlot slot="levelUp" family="genimons" caption={t("imageLevelUp")} ratio="16 / 9" className="max-w-4xl" />
          </div>

          <div className="mt-5 space-y-4">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm leading-relaxed text-parch/85">{t("ascensionBody")}</p>
              <p className="border-l-2 pl-3 text-sm text-parch/85" style={{ borderColor: GENIMON_ACCENT }}>
                {t("ascensionOpensSlots")}
              </p>
            </div>
            <GuideImageSlot slot="ascension" family="genimons" caption={t("imageAscension")} ratio="5 / 3" className="max-w-4xl" />
          </div>
        </div>
      );

    // ────────────────────────────────────────────────────── passif propre
    case "passive":
      return (
        <div className="space-y-4">
          <p className="max-w-3xl text-sm leading-relaxed text-parch/85">{t("passiveBody")}</p>
          <p className="max-w-3xl border-l-2 pl-3 text-sm text-parch/85" style={{ borderColor: GENIMON_ACCENT }}>
            {t("passiveShiny")}
          </p>
          {/*
            Les deux captures portent exactement le même cadrage : la comparaison
            doit sauter aux yeux sur le nombre de sphères, pas sur le cadre.
          */}
          <div className="grid gap-5 lg:grid-cols-2">
            <GuideImageSlot slot="variantOrdinary" family="genimons" caption={t("imageVariantOrdinary")} ratio="3 / 2" />
            <GuideImageSlot slot="variantShiny" family="genimons" caption={t("imageVariantShiny")} ratio="3 / 2" />
          </div>
          <VariantCompare gameLang={gameLang} locale={locale} />
        </div>
      );

    // ────────────────────────────────────────────────── traits : principe
    case "traits":
      return (
        <div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-parch/85">{t("traitsBody")}</p>
              <p className="text-sm leading-relaxed text-parch/85">{t("traitsActiveInactive")}</p>
            </div>
            <GuideImageSlot slot="traitSlots" family="genimons" caption={t("imageTraitSlots")} ratio="3 / 2" />
          </div>
          <div className="mt-5">
            <TraitFlowDiagram gameLang={gameLang} locale={locale} />
          </div>
        </div>
      );

    // ─────────────────────────────────────── l'Entraînement de Géniemon
    case "training":
      return (
        <div className="space-y-5">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm leading-relaxed text-parch/85">{t("trainingBody")}</p>
            <p className="border-l-2 pl-3 text-sm text-parch/85" style={{ borderColor: GENIMON_ACCENT }}>
              {t("trainingLevel")}
            </p>
          </div>
          <GuideImageSlot slot="training" family="genimons" caption={t("imageTraining")} ratio="2 / 1" className="max-w-4xl" />
        </div>
      );

    // ──────────────────────────────────────────────────── fusion, rareté
    case "fusion":
      return (
        <div className="space-y-5">
          <div className="max-w-3xl space-y-3">
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
          {/* Un écran entier dans une demi-colonne devient illisible. */}
          <GuideImageSlot slot="fusion" family="genimons" caption={t("imageFusion")} ratio="16 / 9" className="max-w-4xl" />
        </div>
      );

    // ─────────────────────────────────────────────────────── la boutique
    case "shop":
      return (
        <div>
          <p className="max-w-3xl text-sm leading-relaxed text-parch/85">{t("shopBody")}</p>

          {/*
            La boucle en trois temps. Les deux monnaies se ressemblent à l'écran,
            et c'est l'ordre qui les distingue : l'une vient des missions, l'autre
            ne s'obtient qu'en ouvrant ce que la première a payé.
          */}
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {(t.raw("shopSteps") as string[]).map((step, i) => (
              <li key={i} className="flex items-start gap-3 border border-white/10 bg-ink/55 px-3 py-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border text-xs"
                  style={{ borderColor: GENIMON_ACCENT, color: GENIMON_ACCENT }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-parch/85">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-5 space-y-5">
            <GuideImageSlot slot="shopPath" family="genimons" caption={t("imageShopPath")} ratio="3 / 2" className="max-w-4xl" />
            <GuideImageSlot slot="shopChests" family="genimons" caption={t("imageShopChests")} ratio="16 / 9" className="max-w-4xl" />
          </div>

          <div className="mt-5 space-y-4">
            <p
              className="max-w-3xl border-l-2 pl-3 text-sm leading-relaxed text-parch/85"
              style={{ borderColor: GENIMON_ACCENT }}
            >
              {t("shopGoldTraits")}
            </p>
            <GuideImageSlot slot="shopSelection" family="genimons" caption={t("imageShopSelection")} ratio="16 / 9" className="max-w-4xl" />
          </div>
        </div>
      );

    // ──────────────────────────────────────────────── la liste complète
    case "list":
      return (
        <div>
          <p className="max-w-3xl text-sm leading-relaxed text-parch/85">{t("listBody")}</p>
          <p className="mt-2 max-w-3xl text-xs text-muted-2">{t("listValueNote")}</p>
          <div className="mt-5 space-y-5">
            {TRAIT_CATEGORIES.map((category) => (
              <TraitTable key={category} category={category} gameLang={gameLang} locale={locale} />
            ))}
          </div>

          {/* Dernier chapitre : on referme le guide au lieu de laisser le lecteur en suspens. */}
          <section className="mt-8 border border-anemo/25 bg-linear-to-r from-anemo/10 to-gold/10 p-6">
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

    default:
      return null;
  }
}
