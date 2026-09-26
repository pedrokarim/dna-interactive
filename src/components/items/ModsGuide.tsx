import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  BadgeInfo,
  Calculator,
  Database,
  ImageIcon,
  Languages,
  Layers,
  SlidersHorizontal,
  Sparkles,
  Target,
  Wrench,
  Zap,
} from "lucide-react";
import { GuideImageSlot } from "@/components/items/GuideImageSlot";

/**
 * Guide des **Demon Wedges**, servi en chapitres.
 *
 * Il vivait auparavant en dur dans la route `about`, d'un seul tenant. Le
 * contenu est le même ; seul le découpage change, pour que chaque sujet ait sa
 * page et son adresse. Voir `lib/items/guide-chapters.ts`.
 */

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

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 px-3 py-1 text-xs text-parch">
      {icon}
      {label}
    </span>
  );
}

function IconCard({ src, label, sublabel }: { src: string; label: string; sublabel?: string }) {
  return (
    <div className="rounded-sm border border-white/10 bg-ink/65 p-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-gold/20 bg-panel/70 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} width={56} height={56} loading="lazy" className="max-h-full max-w-full object-contain" />
      </div>
      <p className="mt-2 text-sm font-medium text-parch">{label}</p>
      {sublabel ? <p className="text-xs text-muted">{sublabel}</p> : null}
    </div>
  );
}

/** Les repères du chapô, rendus par le sommaire sous l'introduction. */
export async function ModsGuideIntro({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "itemsAbout" });
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Badge icon={<Layers className="h-3.5 w-3.5 text-gold" />} label={t("badgeLevels")} />
      <Badge icon={<Calculator className="h-3.5 w-3.5 text-gold" />} label={t("badgeTolerance")} />
      <Badge icon={<Languages className="h-3.5 w-3.5 text-anemo" />} label={t("badgeTranslations")} />
      <Badge icon={<Database className="h-3.5 w-3.5 text-electro" />} label={t("badgeReference")} />
    </div>
  );
}

/** Un chapitre du guide. Le titre est posé en `h1` par la page de chapitre. */
export async function ModsGuideChapter({
  chapter,
  categorySlug,
  locale,
}: {
  chapter: string;
  categorySlug: string;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "itemsAbout" });
  const tElement = await getTranslations({ locale, namespace: "common.elements" });
  const code = (chunks: React.ReactNode) => <code>{chunks}</code>;

  switch (chapter) {
    // ──────────────────────────────────────── ce qu'est une pièce
    case "structure":
      return (
        <div className="space-y-6">
          <div className="max-w-3xl space-y-3 text-sm text-parch/85">
            <p>{t("structureItem1")}</p>
            <p>{t.rich("structureItem2", { c: code })}</p>
            <p>{t("structureItem3")}</p>
            <p>{t("structureItem4")}</p>
          </div>

          <section className="border border-white/10 bg-panel/55 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl text-parch">
              <ImageIcon className="h-5 w-5 text-electro" />
              {t("showcaseTitle")}
            </h2>
            <p className="mt-3 text-sm text-parch/85">{t("showcaseDescription")}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {DEMON_WEDGE_EXAMPLES.map((entry) => (
                <IconCard key={entry.src} src={entry.src} label={entry.label} sublabel={t("showcaseIconSublabel")} />
              ))}
            </div>
          </section>

          <section className="border border-white/10 bg-panel/55 p-6">
            <h2 className="font-display text-lg text-parch">{t("readTitle")}</h2>
            <div className="mt-4 grid gap-3 text-sm text-parch/85 md:grid-cols-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className="rounded-sm border border-white/10 bg-ink/60 p-3">
                  <p className="font-medium text-parch">{t(`readStep${step}Title`)}</p>
                  <p className="mt-1 text-xs text-muted">{t(`readStep${step}Text`)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      );

    // ──────────────────────────────── affinités, polarités, compatibilités
    case "affinity":
      return (
        <div className="space-y-5">
          <p className="max-w-3xl text-sm leading-relaxed text-parch/85">{t("affinityDescription")}</p>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">{t("polarityLabel")}</p>
              <div className="grid gap-2">
                {POLARITY_ICONS.map((src, index) => (
                  <div
                    key={src}
                    className="flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 p-2 text-xs text-parch"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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

            <div>
              <p className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">
                {t("affinityElementalLabel")}
              </p>
              <div className="grid gap-2">
                {AFFINITY_EXAMPLES.map((entry) => (
                  <div
                    key={entry.src}
                    className="flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 p-2 text-xs text-parch"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.src} alt={tElement(entry.key)} width={20} height={20} loading="lazy" className="h-5 w-5 object-contain" />
                    {tElement(entry.key)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">{t("typeCompatLabel")}</p>
              <div className="grid gap-2">
                {TYPE_COMPAT_EXAMPLES.map((entry) => (
                  <div
                    key={entry.src}
                    className="flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 p-2 text-xs text-parch"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
          </div>

          <div className="border border-white/10 bg-panel/55 p-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-parch">
              <BadgeInfo className="h-5 w-5 text-hydro" />
              {t("centerTitle")}
            </h2>
            <p className="mt-2 text-sm text-parch/85">{t("centerAffinity")}</p>
          </div>
        </div>
      );

    // ──────────────────────────────────── niveaux, valeurs et tolérance
    case "numbers":
      return (
        <div className="grid gap-5 lg:grid-cols-2">
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
        </div>
      );

    // ───────────────────────────── pistes et module de transfert
    case "tracks":
      return (
        <div>
          <p className="max-w-3xl text-sm text-parch/85">{t("trackIntro")}</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <h2 className="text-sm font-medium text-parch">{t("trackBadgeTitle")}</h2>
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

          {/*
            Deux écrans entiers : côte à côte ils tombent sous 500 px et
            deviennent illisibles. Empilés et bornés, on y lit les badges.
          */}
          <div className="mt-5 space-y-5">
            <GuideImageSlot slot="board" family="mods" caption={t("captionBoard")} className="max-w-4xl" />
            <GuideImageSlot slot="trackShiftApply" family="mods" caption={t("captionApply")} className="max-w-4xl" />
          </div>
        </div>
      );

    // ────────────────────────────────────────────────────────── le centre
    case "center":
      return (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 text-sm text-parch/85">
            <p>{t("centerIntro")}</p>
            <p>{t("centerAffinity")}</p>
            <p>{t("centerTiers")}</p>
          </div>
          <GuideImageSlot slot="center" family="mods" caption={t("captionCenter")} ratio="4 / 3" />
        </div>
      );

    // ──────────────────────────────────────────────────────── l'empilement
    case "stacking":
      return (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 text-sm text-parch/85">
            <p>{t("stackIntro")}</p>
            <p className="border-l-2 border-anemo/50 pl-3">{t("stackRule")}</p>
            <p className="text-muted">{t("stackTrap")}</p>
          </div>
          <GuideImageSlot slot="stacking" family="mods" caption={t("captionStacking")} ratio="4 / 3" />
        </div>
      );

    // ───────────────────────────────── lire une pièce sur le site
    case "reading":
      return (
        <div className="space-y-6">
          <p className="max-w-3xl text-sm text-parch">{t("quickText")}</p>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-sm border border-white/10 bg-ink/60 p-4">
              <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">{t("stepLabel", { num: 1 })}</p>
              <p className="mt-1 text-sm font-medium text-parch">{t("step1Title")}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-white/10 bg-panel/70 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/items/mods/T_Mod_Phoenix01.png"
                    alt={t("altPhoenixExample")}
                    width={48}
                    height={48}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="text-xs text-muted">
                  {t("step1Line1")}
                  <br />
                  {t("step1Line2")}
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-white/10 bg-ink/60 p-4">
              <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">{t("stepLabel", { num: 2 })}</p>
              <p className="mt-1 text-sm font-medium text-parch">{t("step2Title")}</p>
              <div className="mt-3 flex items-center gap-2">
                {[
                  { src: "/assets/items/mods/T_Armory_Fire.png", alt: t("altAffinityFire") },
                  { src: "/assets/items/mods/T_Armory_Polarity02.png", alt: t("polarityItem", { num: 2 }) },
                  { src: "/assets/items/mods/T_Armory_RoleType_03.png", alt: t("altCompatRanged") },
                ].map((entry) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={entry.src}
                    src={entry.src}
                    alt={entry.alt}
                    width={28}
                    height={28}
                    loading="lazy"
                    className="h-7 w-7 rounded-sm border border-white/10 bg-panel/70 p-1 object-contain"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-sm border border-white/10 bg-ink/60 p-4">
              <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">{t("stepLabel", { num: 3 })}</p>
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

          <div className="grid gap-5 lg:grid-cols-2">
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
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n}>{t(`displayItem${n}`)}</li>
                ))}
              </ul>
            </article>
          </div>

          {/* Dernier chapitre : on referme le guide plutôt que de laisser le lecteur en suspens. */}
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
                className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-4 py-2 text-sm text-parch transition-colors hover:border-hydro/40"
              >
                {t("nextFavorites")}
              </Link>
            </div>
          </section>
        </div>
      );

    default:
      return null;
  }
}
