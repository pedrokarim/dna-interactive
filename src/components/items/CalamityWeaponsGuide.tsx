import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Hammer,
  Lock,
  ScrollText,
  Sparkles,
  Swords,
  Target,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaDivider } from "@/components/dna/Divider";
import { DnaItemIcon } from "@/components/dna/ItemIcon";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { GuideImageSlot } from "@/components/items/GuideImageSlot";
import { getItemsByCategoryId, getItemTranslation } from "@/lib/items/catalog";
import {
  CALAMITY_ACCENT_HEX,
  formatOpenVersion,
  isCalamityWeapon,
  isUnscheduledVersion,
  potentialNodesTotal,
} from "@/lib/items/calamity-weapons";
import forgeCostsData from "@/data/weapons/calamity-forge-costs.json";
import materialsData from "@/data/weapons/calamity-potential-materials.json";

type ForgeStep = { level: number; materials: { id: number; num: number }[] };
type Material = { itemId: string; icon: string | null; name: Record<string, string> };

const FORGE_COSTS = forgeCostsData as Record<string, ForgeStep[]>;
const MATERIALS = materialsData as Record<string, Material>;

/**
 * Phoxène. Une arme dont chaque palier ne coûte que cette monnaie porte encore
 * le coût bouche-trou du jeu : mieux vaut le dire que d'afficher un tableau faux.
 */
const PHOXENE_ID = 100;

/** Vrai quand la table de coûts n'est qu'un gabarit non renseigné. */
function isPlaceholderCost(steps: ForgeStep[]): boolean {
  return (
    steps.length > 0 &&
    steps.every((step) => step.materials.length === 1 && step.materials[0]?.id === PHOXENE_ID)
  );
}

/** Insignes de faction : la description du jeu dit contre qui les farmer. */
const EMBLEM_IDS = [15026, 15027, 15028, 15029, 15030];
/** Cristaux de Mission abyssale, y compris le cristal radieux universel. */
const CRYSTAL_IDS = [15031, 15035, 15036, 15037];

function pick(map: Record<string, string> | undefined, lang: string): string {
  if (!map) return "";
  return map[lang] ?? map.EN ?? map.FR ?? Object.values(map)[0] ?? "";
}

/**
 * Guide des armes de calamité.
 *
 * Volontairement **un guide**, pas une seconde fiche d'arme : il répond à
 * « comment ça marche et comment j'en obtiens une », et renvoie vers les fiches
 * pour les chiffres. Les coûts, les matériaux et leurs descriptions viennent
 * directement des données du jeu, donc traduits sans réécriture de notre part.
 */

/** Le chapô du guide : le surtitre et la vue d'ensemble, rendus par le sommaire. */
export async function CalamityWeaponsGuideIntro({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "calamityGuide" });
  return (
    <>
      <DnaDivider className="mt-5 max-w-[16rem]" />
      <div className="mt-6">
        <GuideImageSlot slot="overview" caption={t("imageOverview")} className="max-w-4xl" />
      </div>
    </>
  );
}

/**
 * Un chapitre du guide des armes de calamité.
 *
 * Le titre est posé par la page de chapitre, en `h1` : on ne le répète pas ici.
 */
export async function CalamityWeaponsGuideChapter({
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
  const t = await getTranslations({ locale, namespace: "calamityGuide" });

  switch (chapter) {
    // ───────────────────────────────────────────────────── règles de fond
    case "rules":
      return (
        <div className="grid gap-4 md:grid-cols-3">
          <RuleCard icon={<Flame className="h-5 w-5" />} title={t("ruleDamageTitle")} body={t("ruleDamageBody")} />
          <RuleCard icon={<Lock className="h-5 w-5" />} title={t("ruleOneTitle")} body={t("ruleOneBody")} />
          <RuleCard icon={<Target className="h-5 w-5" />} title={t("ruleProficiencyTitle")} body={t("ruleProficiencyBody")} />
        </div>
      );

    // ─────────────────────────────────────────────────────────── obtention
    case "obtain":
      return (
        <div className="space-y-5">
          <DnaPanel className="max-w-4xl p-5">
            <ol className="space-y-4">
              {[1, 2, 3].map((step) => (
                <li key={step} className="flex gap-4">
                  <span
                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border font-caps text-[0.72rem]"
                    style={{ borderColor: `${CALAMITY_ACCENT_HEX}66`, color: CALAMITY_ACCENT_HEX }}
                  >
                    {step}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg text-parch">{t(`obtainStep${step}Title`)}</p>
                    <p className="mt-1 text-sm leading-relaxed text-parch/80">{t(`obtainStep${step}Body`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </DnaPanel>
          {/*
            Une image par étape : la quête ouvre le système, la forge fabrique
            l'arme. Les réunir en une seule aurait obligé à chercher laquelle
            illustre quoi.
          */}
          <GuideImageSlot slot="unlock" caption={t("imageUnlock")} ratio="16 / 9" className="max-w-4xl" />
          <GuideImageSlot slot="forge" caption={t("imageForge")} ratio="16 / 9" className="max-w-4xl" />
        </div>
      );

    // ──────────────────────────────────────────────── fourneau & fusion
    case "furnace":
      return (
        <div className="space-y-5">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm leading-relaxed text-parch/85">{t("furnaceBody")}</p>
            <p className="text-sm leading-relaxed text-parch/85">{t("furnaceGateBody")}</p>
            <div
              className="flex items-start gap-3 border p-3"
              style={{ borderColor: `${CALAMITY_ACCENT_HEX}33`, background: `${CALAMITY_ACCENT_HEX}0f` }}
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CALAMITY_ACCENT_HEX }} />
              <p className="text-sm text-parch/85">{t("furnaceFreeNode")}</p>
            </div>
          </div>
          <GuideImageSlot
            slot="furnace"
            caption={t("imageFurnace")}
            legend={t.raw("legendFurnace") as string[]}
            ratio="16 / 9"
            className="max-w-4xl"
          />
        </div>
      );

    // ─────────────────────────────────────────────── arbre de Potentiel
    case "potential":
      return (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-parch/85">{t("potentialBody")}</p>
              <ul className="space-y-2">
                {["Shape", "Free", "Chain"].map((key) => (
                  <li key={key} className="flex items-start gap-2.5 border border-white/10 bg-ink/55 px-3 py-2">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: CALAMITY_ACCENT_HEX }} />
                    <span className="text-sm text-parch/85">{t(`potentialRule${key}`)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted">{t("potentialSeeSheet")}</p>
            </div>
            <GuideImageSlot slot="potential" caption={t("imagePotential")} />
          </div>

          <div className="max-w-3xl space-y-3">
            <p className="text-sm leading-relaxed text-parch/85">{t("potentialCostBody")}</p>
            <p className="text-sm leading-relaxed text-parch/85">{t("potentialOrderBody")}</p>
          </div>
          <GuideImageSlot
            slot="potentialCost"
            caption={t("imagePotentialCost")}
            legend={t.raw("legendPotentialCost") as string[]}
            ratio="1600 / 1279"
            className="max-w-xl"
          />
        </div>
      );

    // ────────────────────────────────────────────── choisir son chemin
    case "path":
      return (
        <div>
          <p className="max-w-3xl text-sm leading-relaxed text-parch/85">{t("pathBody")}</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ul className="space-y-2">
              {(t.raw("pathTiers") as string[]).map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 border border-white/10 bg-ink/55 px-3 py-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: CALAMITY_ACCENT_HEX }} />
                  <span className="text-sm text-parch/85">{line}</span>
                </li>
              ))}
            </ul>
            <ul className="space-y-2">
              {(t.raw("pathWeapons") as string[]).map((line, i) => (
                <li
                  key={i}
                  className="border-l-2 px-3 py-1.5 text-sm text-parch/85"
                  style={{ borderColor: CALAMITY_ACCENT_HEX }}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-sm text-muted">{t("pathSeeCharacter")}</p>
        </div>
      );

    // ────────────────────────────────────────────────────────── où farmer
    case "materials": {
      const resources = getItemsByCategoryId("resources");
      const describeMaterial = (modId: number) => {
        const record = resources.find((item) => item.modId === modId);
        const translation = record ? getItemTranslation(record, gameLang, [gameLang, "EN"]) : null;
        return {
          name: pick(MATERIALS[String(modId)]?.name, gameLang) || translation?.modName || `#${modId}`,
          icon: MATERIALS[String(modId)]?.icon ?? record?.icon?.publicPath ?? null,
          description: translation?.description ?? null,
        };
      };

      return (
        <div>
          <p className="max-w-3xl text-sm leading-relaxed text-parch/85">{t("materialsBody")}</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
            <GuideImageSlot
              slot="missions"
              caption={t("imageMissions")}
              legend={t.raw("legendMissions") as string[]}
              ratio="1600 / 1150"
            />
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-parch/85">{t("missionsBody")}</p>
              <p className="text-sm leading-relaxed text-parch/85">{t("compassBody")}</p>
            </div>
          </div>

          {/* --- insignes : farm dirigé, une faction par insigne --- */}
          <h2 className="mt-8 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">
            {t("materialsEmblems")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-parch/85">{t("emblemsBody")}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {EMBLEM_IDS.map(describeMaterial).map((material) => (
              <MaterialCard key={material.name} {...material} />
            ))}
          </div>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <GuideImageSlot slot="defense" caption={t("imageDefense")} legend={t.raw("legendDefense") as string[]} />
            <GuideImageSlot slot="emblemTooltip" caption={t("imageEmblemTooltip")} ratio="4 / 3" />
          </div>

          {/* --- cristaux : récompense ciblée d'une Mission abyssale --- */}
          <h2 className="mt-8 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">
            {t("materialsCrystals")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-parch/85">{t("crystalsBody")}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CRYSTAL_IDS.map(describeMaterial).map((material) => (
              <MaterialCard key={material.name} {...material} />
            ))}
          </div>
          <div className="mt-4">
            <GuideImageSlot
              slot="expedition"
              caption={t("imageExpedition")}
              legend={t.raw("legendExpedition") as string[]}
              className="max-w-4xl"
            />
          </div>
        </div>
      );
    }

    // ───────────────────────────────────────────── coûts réels par arme
    case "cost": {
      const weapons = getItemsByCategoryId("weapons")
        .filter((item) => isCalamityWeapon(item))
        .map((item) => {
          const translation = getItemTranslation(item, gameLang, [gameLang, "EN"]);
          return {
            id: item.id,
            name: translation.modName ?? `#${item.modId}`,
            icon: item.icon?.publicPath ?? null,
            // Libellé traduit du sous-type (Lance, Claymore…), sinon la valeur brute.
            weaponType:
              translation.typeCompatibilityNames[1] ??
              (typeof item.fields.ResourceSType === "string" ? item.fields.ResourceSType : null),
            version: formatOpenVersion(item.stats.openVersion),
            // Une arme non programmée porte encore des libellés de travail : son nom
            // vient parfois d'une autre entrée recyclée. À signaler, pas à masquer.
            provisional: isUnscheduledVersion(item.stats.openVersion),
            nodes: potentialNodesTotal(item.id),
            steps: isPlaceholderCost(FORGE_COSTS[item.id] ?? []) ? [] : (FORGE_COSTS[item.id] ?? []),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, locale));

      return (
        <div>
          <p className="max-w-3xl text-sm leading-relaxed text-parch/85">{t("costBody")}</p>

          <div className="mt-4 space-y-5">
            {weapons.map((weapon) => (
              <DnaPanel key={weapon.id} className="p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center border border-crimson-bright/25 bg-ink/60 p-1.5">
                    <DnaItemIcon
                      src={weapon.icon}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-xl text-parch">{weapon.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {[weapon.weaponType, weapon.version ?? t("versionUnscheduled")].filter(Boolean).join(" · ")}
                      {weapon.nodes ? ` · ${t("nodeCount", { count: weapon.nodes })}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/items/weapons/${weapon.id}`}
                    className="ml-auto inline-flex items-center gap-2 rounded-sm border border-crimson-bright/35 px-3 py-1.5 text-xs font-medium text-crimson-bright transition-colors hover:bg-crimson/15"
                  >
                    <Swords className="h-3.5 w-3.5" />
                    {t("openSheet")}
                  </Link>
                </div>

                {weapon.provisional ? (
                  <p className="mt-3 border-l-2 border-crimson-bright/40 pl-3 text-sm text-muted">
                    {t("provisionalNotice")}
                  </p>
                ) : null}

                {weapon.steps.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-2">{t("costUnavailable")}</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {weapon.steps.map((step) => (
                      <div
                        key={step.level}
                        className="flex flex-wrap items-center gap-3 border border-white/10 bg-ink/45 px-3 py-2"
                      >
                        <span className="font-caps text-[0.62rem] uppercase tracking-[0.18em] text-muted">
                          {t("costLevel", { level: step.level })}
                        </span>
                        <ul className="flex flex-wrap items-center gap-2">
                          {step.materials.map((material) => {
                            const entry = MATERIALS[String(material.id)];
                            const label = pick(entry?.name, gameLang) || `#${material.id}`;
                            return (
                              <li
                                key={material.id}
                                title={label}
                                className="inline-flex items-center gap-1.5 border border-white/10 bg-panel/50 px-2 py-1"
                              >
                                <span className="grid h-6 w-6 shrink-0 place-items-center">
                                  <DnaItemIcon
                                    src={entry?.icon ?? null}
                                    alt=""
                                    width={24}
                                    height={24}
                                    loading="lazy"
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </span>
                                <span className="max-w-[11rem] truncate text-[0.72rem] text-parch/80">{label}</span>
                                <span className="font-mono text-[0.68rem] text-gold-bright tabular-nums">
                                  ×{material.num}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </DnaPanel>
            ))}
          </div>

          {/* Dernier chapitre : on referme le guide au lieu de laisser le lecteur en suspens. */}
          <section
            className="mt-8 border p-6"
            style={{ borderColor: `${CALAMITY_ACCENT_HEX}33`, background: `${CALAMITY_ACCENT_HEX}0d` }}
          >
            <h2 className="flex items-center gap-2 font-display text-xl text-parch">
              <Hammer className="h-5 w-5" style={{ color: CALAMITY_ACCENT_HEX }} />
              {t("nextTitle")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-parch/85">{t("nextBody")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/items/${categorySlug}`}
                className="inline-flex items-center gap-2 rounded-sm border border-crimson-bright/35 bg-crimson/10 px-4 py-2 text-sm font-medium text-crimson-bright transition-colors hover:bg-crimson/20"
              >
                {t("nextOpenList")}
              </Link>
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-4 py-2 text-sm text-parch transition-colors hover:border-gold/40 hover:text-gold"
              >
                {t("nextOpenBuilder")}
              </Link>
            </div>
          </section>
        </div>
      );
    }

    default:
      return null;
  }
}


function RuleCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="border border-white/10 bg-panel/55 p-5">
      <span
        className="grid h-10 w-10 place-items-center border"
        style={{
          borderColor: `${CALAMITY_ACCENT_HEX}44`,
          background: `${CALAMITY_ACCENT_HEX}14`,
          color: CALAMITY_ACCENT_HEX,
        }}
      >
        {icon}
      </span>
      <h3 className="mt-3 font-display text-lg text-parch">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-parch/80">{body}</p>
    </article>
  );
}

function MaterialCard({
  name,
  icon,
  description,
}: {
  name: string;
  icon: string | null;
  description: string | null;
}) {
  return (
    <article className="flex gap-3 border border-white/10 bg-panel/55 p-3">
      <span className="grid h-12 w-12 shrink-0 place-items-center border border-gold/20 bg-ink/60 p-1.5">
        <DnaItemIcon
          src={icon}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-parch">{name}</p>
        {description ? <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p> : null}
      </div>
    </article>
  );
}
