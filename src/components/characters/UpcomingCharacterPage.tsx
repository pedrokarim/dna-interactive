import Image from "next/image";
import { ArrowLeft, FileSearch, Megaphone, ShieldQuestion, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  DnaCornerBrackets,
  DnaDivider,
  DnaElementBadge,
  DnaPanel,
  DnaSectionLabel,
  DnaSectionMark,
  DnaStars,
  DnaTag,
  ELEMENTS,
  cn,
} from "@/components/dna";
import {
  getUpcomingText,
  statAtLevel,
  type UpcomingCharacter,
  type UpcomingConfidence,
  type UpcomingCosmetic,
} from "@/lib/characters/upcoming";
import { getWeaponType, weaponTypeName } from "@/lib/characters/weapon-proficiency";
import { UpcomingCountdown } from "./UpcomingCountdown";

/**
 * Fiche d'un perso annoncé mais pas encore sorti.
 *
 * Le jeu n'a livré aucune texture pour lui : ni portrait, ni icône de
 * compétence, ni illustration de bannière. Au lieu d'images cassées ou d'un
 * placeholder gris, un cartouche teinté par l'élément tient la place du buste.
 *
 * Chaque info affiche son niveau de fiabilité, pour ne pas mélanger les
 * données du jeu et les rumeurs. Textes de l'interface dans `upcomingPage`,
 * textes du personnage dans `UpcomingCharacter.text`, une entrée par langue.
 */

type Translate = Awaited<ReturnType<typeof getTranslations<"upcomingPage">>>;

const CONFIDENCE_META: Record<
  UpcomingConfidence,
  { labelKey: "confidenceDataMined" | "confidenceAnnounced" | "confidenceCommunity"; className: string; icon: typeof FileSearch }
> = {
  dataMined: { labelKey: "confidenceDataMined", className: "border-gold/40 bg-gold/10 text-gold-bright", icon: FileSearch },
  announced: { labelKey: "confidenceAnnounced", className: "border-lumino/40 bg-lumino/10 text-lumino", icon: Megaphone },
  community: { labelKey: "confidenceCommunity", className: "border-line/30 bg-white/[0.04] text-muted", icon: ShieldQuestion },
};

const CONFIDENCE_HINT = {
  dataMined: "confidenceDataMinedHint",
  announced: "confidenceAnnouncedHint",
  community: "confidenceCommunityHint",
} as const;

/** Clés `characterDetail` des attributs conseillés, mêmes libellés que les fiches complètes. */
const ATTR_KEYS: Record<string, string> = {
  ATK_Fire: "statATKFire",
  SkillIntensity: "statSkillIntensity",
  SkillEfficiency: "statSkillEfficiency",
  SkillSustain: "statSkillSustain",
  SkillRange: "statSkillRange",
  SkillSpeed: "statSkillSpeed",
};

const POSITIONING_KEYS: Record<string, string> = {
  DPS: "positionDPS",
  WeaponDPS: "positionWeaponDPS",
  Support: "positionSupport",
  Uweapon: "positionUweapon",
};

function ConfidenceBadge({ level, t }: { level: UpcomingConfidence; t: Translate }) {
  const meta = CONFIDENCE_META[level];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 font-caps text-[0.5rem] uppercase tracking-[0.14em]",
        meta.className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {t(meta.labelKey)}
    </span>
  );
}

export async function UpcomingCharacterPage({
  character,
  curves,
  locale,
}: {
  character: UpcomingCharacter;
  curves: Record<string, Record<string, number>>;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "upcomingPage" });
  const tStrip = await getTranslations({ locale, namespace: "upcomingStrip" });
  const tDetail = await getTranslations({ locale, namespace: "characterDetail" });
  const text = getUpcomingText(character, locale);
  const lang = locale.toUpperCase();
  const element = ELEMENTS[character.element];
  const maxLevel = character.maxLevel;

  const weaponLabel = (tag: string) => {
    const type = getWeaponType(tag);
    return type ? weaponTypeName(type, lang) : tag;
  };
  const detailLabel = (keys: Record<string, string>, value: string) =>
    keys[value] && tDetail.has(keys[value]) ? tDetail(keys[value]) : value;

  const { baseStats, growthCurves } = character;
  const stats =
    baseStats && growthCurves
      ? [
          { label: tDetail("statATK"), base: baseStats.atk, curve: growthCurves.atk },
          { label: tDetail("statDEF"), base: baseStats.def, curve: growthCurves.def },
          { label: tDetail("statMaxHp"), base: baseStats.maxHp, curve: growthCurves.maxHp },
          { label: tDetail("statMaxES"), base: baseStats.maxEs, curve: growthCurves.maxEs },
        ].map((s) => ({
          ...s,
          atMax: statAtLevel(s.base, curves[s.curve], maxLevel),
        }))
      : null;

  return (
    <div className="relative">
      {/* Halo de l'élément derrière toute la fiche. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: `radial-gradient(ellipse 70% 60% at 85% 15%, ${element.hex}14, transparent)` }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link
          href="/characters"
          className="inline-flex items-center gap-1.5 font-caps text-[0.58rem] uppercase tracking-[0.16em] text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("back")}
        </Link>

        {/* ------------------------------------------------------------ en-tête */}
        <header className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {character.portrait ? (
            <OfficialPortrait character={character} name={text.name} src={character.portrait} label={t("officialVisual")} />
          ) : (
            <CrestPlaceholder character={character} name={text.name} t={t} />
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DnaTag tone="crimson">{tStrip("version", { version: character.version })}</DnaTag>
              <DnaTag tone="gold">{t("notReleased")}</DnaTag>
              <span className="font-mono text-[0.62rem] text-muted-2">#{character.charId}</span>
            </div>

            <h1 className="mt-3 font-display text-5xl font-semibold text-parch md:text-6xl">{text.name}</h1>
            <p className="mt-1 font-serif text-lg italic text-gold">{tStrip("quote", { text: text.subtitle })}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <DnaElementBadge element={character.element} showLabel size={28} />
              <DnaStars value={character.rarity} className="text-base" />
              <span className="font-sans text-sm text-parch/80">{text.campLabel}</span>
            </div>

            {character.weaponTags.length > 0 || character.positioning.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {character.weaponTags.map((tag) => (
                  <DnaTag key={tag}>{weaponLabel(tag)}</DnaTag>
                ))}
                {character.positioning.map((pos) => (
                  <DnaTag key={pos} tone="crimson">
                    {detailLabel(POSITIONING_KEYS, pos)}
                  </DnaTag>
                ))}
              </div>
            ) : null}

            {character.releaseDate ? (
              <div className="mt-6">
                <UpcomingCountdown
                  releaseDate={character.releaseDate}
                  versionName={character.versionName}
                  bannerName={character.bannerName}
                />
              </div>
            ) : (
              <p className="mt-6 max-w-prose font-sans text-sm text-muted">
                {t("noDate", { version: character.version, versionName: character.versionName })}
              </p>
            )}
          </div>
        </header>

        <DnaDivider className="my-8" />

        {/* ------------------------------------------------------------ contenu */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="flex flex-col gap-6">
            <section>
              <DnaSectionMark>{t("dossier")}</DnaSectionMark>
              <DnaPanel className="mt-3 p-5">
                <div className="flex flex-col gap-3">
                  {text.lore.map((paragraph, index) => (
                    <p key={index} className="font-serif text-[0.98rem] leading-relaxed text-parch/85">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <p className="mt-4 font-sans text-xs text-muted-2">{text.loreSource ?? t("loreSourceDefault")}</p>
              </DnaPanel>
            </section>

            {character.cosmetics?.length ? (
              <section>
                <DnaSectionMark>{t("cosmeticsTitle")}</DnaSectionMark>
                <DnaPanel className="mt-3 flex flex-col gap-6 p-5">
                  {character.cosmetics.map((cosmetic) => (
                    <CosmeticBlock key={cosmetic.name} cosmetic={cosmetic} t={t} />
                  ))}
                  <p className="font-sans text-xs text-muted-2">{t("cosmeticsSource", { version: character.version })}</p>
                </DnaPanel>
              </section>
            ) : null}

            <section>
              <DnaSectionMark>{t("skillsTitle")}</DnaSectionMark>
              <DnaPanel className="mt-3 p-5">
                <p className="font-sans text-sm text-muted">
                  {t("skillsDeclared", { count: character.skillIds.length })}{" "}
                  {text.skills.length > 0 ? t("skillsCommunity") : t("skillsLater")}
                </p>
                <div className={cn("flex flex-col gap-3", text.skills.length > 0 && "mt-4")}>
                  {text.skills.map((skill) => (
                    <div key={skill.name} className="border-l-2 border-gold/30 pl-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg text-parch">{skill.name}</h3>
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-2">
                          {skill.slot}
                        </span>
                        <ConfidenceBadge level={skill.confidence} t={t} />
                      </div>
                      <p className="mt-1 font-sans text-sm text-parch/80">{skill.description}</p>
                    </div>
                  ))}
                </div>
              </DnaPanel>
            </section>

            <section>
              <DnaSectionMark>{t("statsTitle")}</DnaSectionMark>
              {stats && baseStats ? (
                <DnaPanel className="mt-3 p-5">
                  <p className="font-sans text-sm text-muted">{t("statsIntro", { level: maxLevel, name: text.name })}</p>
                  <div className="mt-4 overflow-x-auto overflow-y-hidden">
                    <table className="w-full min-w-[28rem] text-left text-sm">
                      <thead>
                        <tr className="font-caps text-[0.56rem] uppercase tracking-[0.14em] text-muted">
                          <th className="pb-2 pr-4 font-normal">{t("statHeader")}</th>
                          <th className="pb-2 pr-4 font-normal">{t("level1")}</th>
                          <th className="pb-2 pr-4 font-normal">{t("levelN", { level: maxLevel })}</th>
                          <th className="pb-2 font-normal">{t("curve")}</th>
                        </tr>
                      </thead>
                      <tbody className="text-parch/90">
                        {stats.map((stat) => (
                          <tr key={stat.label} className="border-t border-white/8">
                            <td className="py-2 pr-4">{stat.label}</td>
                            <td className="py-2 pr-4 font-mono">{stat.base}</td>
                            <td className="py-2 pr-4 font-mono text-gold-bright">{stat.atMax}</td>
                            <td className="py-2 font-mono text-xs text-muted-2">{stat.curve}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-white/8">
                          <td className="py-2 pr-4">{tDetail("statMaxSp")}</td>
                          <td className="py-2 pr-4 font-mono">{baseStats.maxSp}</td>
                          <td className="py-2 pr-4 font-mono text-gold-bright">{baseStats.maxSp}</td>
                          <td className="py-2 font-mono text-xs text-muted-2">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 font-sans text-xs text-muted-2">{t("defNote")}</p>
                </DnaPanel>
              ) : (
                <DnaPanel className="mt-3 p-5">
                  <p className="font-sans text-sm text-muted">{t("statsPending", { name: text.name })}</p>
                </DnaPanel>
              )}
            </section>
          </div>

          {/* ------------------------------------------------------- colonne latérale */}
          <aside className="flex flex-col gap-6">
            <section>
              <DnaSectionLabel>{t("sheetTitle")}</DnaSectionLabel>
              <DnaPanel className="mt-3 p-4">
                <dl className="flex flex-col gap-3">
                  <Row label={t("element")} value={element.label} confidence="dataMined" t={t} />
                  <Row label={t("rarity")} value={t("rarityValue", { count: character.rarity })} confidence="dataMined" t={t} />
                  <Row label={t("maxLevel")} value={`${maxLevel}`} confidence="dataMined" t={t} />
                  <Row label={t("faction")} value={text.campLabel} confidence="dataMined" t={t} />
                  {character.weaponTags.length > 0 ? (
                    <Row
                      label={t("weapons")}
                      value={character.weaponTags.map(weaponLabel).join(" · ")}
                      confidence="dataMined"
                      t={t}
                    />
                  ) : null}
                  {character.recommendAttr.length > 0 ? (
                    <Row
                      label={t("recommendedStats")}
                      value={character.recommendAttr.map((a) => detailLabel(ATTR_KEYS, a)).join(" · ")}
                      confidence="dataMined"
                      t={t}
                    />
                  ) : null}
                  {character.skinCount ? (
                    <Row label={t("appearances")} value={`${character.skinCount}`} confidence="dataMined" t={t} />
                  ) : null}
                  {character.skinNames?.length ? (
                    <Row label={t("bannerSkin")} value={character.skinNames.join(", ")} confidence="announced" t={t} />
                  ) : null}
                  {character.voiceActorEn ? (
                    <Row label={t("voiceEn")} value={character.voiceActorEn} confidence="announced" t={t} />
                  ) : null}
                  {text.facts.map((fact) => (
                    <Row key={fact.label} label={fact.label} value={fact.value} confidence={fact.confidence} t={t} />
                  ))}
                </dl>
              </DnaPanel>
            </section>

            <section>
              <DnaSectionLabel>{t("howToRead")}</DnaSectionLabel>
              <DnaPanel className="mt-3 p-4">
                <ul className="flex flex-col gap-3">
                  {(Object.keys(CONFIDENCE_META) as UpcomingConfidence[]).map((level) => (
                    <li key={level} className="flex items-start gap-2.5">
                      <ConfidenceBadge level={level} t={t} />
                      <span className="font-sans text-xs text-muted">{t(CONFIDENCE_HINT[level])}</span>
                    </li>
                  ))}
                </ul>
              </DnaPanel>
            </section>

            <section>
              <DnaSectionLabel>{t("sources")}</DnaSectionLabel>
              <DnaPanel className="mt-3 p-4">
                <ul className="flex flex-col gap-2">
                  {text.sources.map((source) => (
                    <li key={source.label} className="font-sans text-xs text-muted">
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold transition-colors hover:text-gold-bright"
                        >
                          {source.label}
                        </a>
                      ) : (
                        source.label
                      )}
                    </li>
                  ))}
                </ul>
              </DnaPanel>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

const SHOT_KEYS = { art: "shotArt", inGame: "shotInGame", upgrade: "shotUpgrade" } as const;

/**
 * Une tenue ou un skin d'arme annoncé : nom, ce qu'en dit l'annonce, plans du
 * PV. Le premier visuel prend toute la largeur quand il y en a plusieurs.
 */
function CosmeticBlock({ cosmetic, t }: { cosmetic: UpcomingCosmetic; t: Translate }) {
  const isOutfit = cosmetic.kind === "outfit";
  const description = isOutfit
    ? cosmetic.banner
      ? t("cosmeticOutfit", { banner: cosmetic.banner })
      : t("cosmeticOutfitPlain")
    : t("cosmeticWeaponSkin");
  const hasUpgrade = cosmetic.images.some((image) => image.shot === "upgrade");
  const single = cosmetic.images.length === 1;

  return (
    <div className={cn("grid gap-4", single && "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center")}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl text-parch">{cosmetic.name}</h3>
          <DnaTag>{isOutfit ? t("kindOutfit") : t("kindWeaponSkin")}</DnaTag>
          <ConfidenceBadge level="announced" t={t} />
        </div>
        <p className="mt-1.5 font-sans text-sm text-muted">
          {description}
          {hasUpgrade ? ` ${t("cosmeticUpgrade")}` : null}
        </p>
      </div>
      <div className={cn("grid min-w-0 gap-3", !single && "sm:grid-cols-2")}>
        {cosmetic.images.map((image, index) => (
          <figure key={image.src} className={cn("min-w-0", !single && index === 0 && "sm:col-span-2")}>
            <div className="relative aspect-video w-full overflow-hidden border border-line/25 bg-panel">
              <Image
                src={image.src}
                alt={`${cosmetic.name} – ${t(SHOT_KEYS[image.shot])}`}
                fill
                sizes={!single && index === 0 ? "(min-width: 1024px) 44rem, 100vw" : "(min-width: 1024px) 22rem, 100vw"}
                className="object-cover"
              />
            </div>
            <figcaption className="mt-1.5 font-sans text-xs text-muted-2">{t(SHOT_KEYS[image.shot])}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  confidence,
  t,
}: {
  label: string;
  value: string;
  confidence: UpcomingConfidence;
  t: Translate;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/8 pb-2.5 last:border-b-0 last:pb-0">
      <dt className="font-caps text-[0.56rem] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right">
        <span className="break-words font-sans text-sm text-parch/90">{value}</span>
        <ConfidenceBadge level={confidence} t={t} />
      </dd>
    </div>
  );
}

/**
 * Visuel officiel publié par le studio avant la sortie, recadré en 3:4. Prend
 * la place du cartouche quand il existe.
 */
function OfficialPortrait({
  character,
  name,
  src,
  label,
}: {
  character: UpcomingCharacter;
  name: string;
  src: string;
  label: string;
}) {
  const element = ELEMENTS[character.element];
  return (
    <div
      className="relative aspect-[3/4] w-full max-w-[20rem] overflow-hidden border border-line/25 bg-panel"
      style={{ boxShadow: `0 0 60px -30px ${element.hex}` }}
    >
      <Image src={src} alt={name} fill priority sizes="(min-width: 1024px) 20rem, 100vw" className="object-cover" />
      <DnaCornerBrackets />
      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-sm bg-black/55 px-1.5 py-0.5 font-mono text-[0.6rem] text-parch/80">
        <Sparkles className="h-3 w-3" />
        {label}
      </span>
    </div>
  );
}

/**
 * Cartouche à la place du portrait, puisque le perso n'a pas de texture. Cadre
 * du design system, fond teinté par l'élément et initiale gravée.
 */
function CrestPlaceholder({ character, name, t }: { character: UpcomingCharacter; name: string; t: Translate }) {
  const element = ELEMENTS[character.element];
  return (
    <div className="relative aspect-[3/4] w-full max-w-[20rem] overflow-hidden border border-line/25 bg-panel">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 50% 20%, ${element.hex}26, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.35))`,
        }}
      />
      {/* Trame diagonale légère pour remplir la surface sans imiter une image. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 9px)",
          color: element.color,
        }}
      />
      <DnaCornerBrackets />

      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="font-display text-[7rem] leading-none opacity-25" style={{ color: element.color }} aria-hidden>
          {name.charAt(0)}
        </span>
        <div>
          <p className="font-caps text-[0.56rem] uppercase tracking-[0.2em] text-muted-2">{t("illustration")}</p>
          <p className="mt-1 font-sans text-sm text-muted">{t("illustrationMissing")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] text-muted-2">
          <Sparkles className="h-3 w-3" />
          {character.internalName} · {character.charId}
        </span>
      </div>
    </div>
  );
}
