import { ArrowLeft, FileSearch, Megaphone, ShieldQuestion, Sparkles } from "lucide-react";
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
import { statAtLevel, type UpcomingCharacter, type UpcomingConfidence } from "@/lib/characters/upcoming";
import { UpcomingCountdown } from "./UpcomingCountdown";

/**
 * Fiche d'un personnage annoncé mais pas encore sorti.
 *
 * Contrainte de départ : le jeu n'a livré aucune texture pour lui. Pas de
 * portrait, pas d'icône de compétence, pas d'illustration de bannière. Plutôt
 * que d'afficher des images cassées ou un placeholder gris, la mise en page est
 * bâtie autour de l'absence : un cartouche héraldique teinté par l'élément
 * tient la place du buste, et la fiche assume qu'elle documente un dossier,
 * pas un personnage jouable.
 *
 * Chaque information porte son niveau de fiabilité. C'est le point important :
 * une fiche « à venir » qui mélange les données extraites du jeu et les
 * rumeurs ne vaut rien.
 */

const CONFIDENCE_META: Record<UpcomingConfidence, { label: string; className: string; icon: typeof FileSearch }> = {
  dataMined: {
    label: "Fichiers du jeu",
    className: "border-gold/40 bg-gold/10 text-gold-bright",
    icon: FileSearch,
  },
  announced: {
    label: "Annoncé",
    className: "border-lumino/40 bg-lumino/10 text-lumino",
    icon: Megaphone,
  },
  community: {
    label: "À confirmer",
    className: "border-line/30 bg-white/[0.04] text-muted",
    icon: ShieldQuestion,
  },
};

/** Libellés des attributs recommandés, alignés sur ceux des fiches complètes. */
const ATTR_LABELS: Record<string, string> = {
  ATK_Fire: "ATQ Pyro",
  SkillIntensity: "Intensité",
  SkillEfficiency: "Efficacité",
  SkillSustain: "Persistance",
  SkillRange: "Portée",
  SkillSpeed: "Vitesse",
};

const POSITIONING_LABELS: Record<string, string> = {
  DPS: "DPS",
  SkillDPS: "DPS de compétence",
  WeaponDPS: "DPS d'arme",
  Support: "Soutien",
  Uweapon: "Arme de consonance",
};

const WEAPON_LABELS: Record<string, string> = {
  Dualblade: "Doubles lames",
  Cannon: "Canon",
  Sword: "Épée",
  Polearm: "Hallebarde",
  Shotgun: "Fusil à pompe",
  Crossbow: "Arbalète",
  Bow: "Arc",
  Pistol: "Pistolet",
};

function ConfidenceBadge({ level }: { level: UpcomingConfidence }) {
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
      {meta.label}
    </span>
  );
}

export function UpcomingCharacterPage({
  character,
  curves,
}: {
  character: UpcomingCharacter;
  curves: Record<string, Record<string, number>>;
}) {
  const element = ELEMENTS[character.element];
  const maxLevel = character.maxLevel;

  const stats = [
    { label: "ATQ", base: character.baseStats.atk, curve: character.growthCurves.atk },
    { label: "DÉF", base: character.baseStats.def, curve: character.growthCurves.def },
    { label: "PV max", base: character.baseStats.maxHp, curve: character.growthCurves.maxHp },
    { label: "Bouclier max", base: character.baseStats.maxEs, curve: character.growthCurves.maxEs },
  ].map((s) => ({
    ...s,
    atMax: statAtLevel(s.base, curves[s.curve], maxLevel),
  }));

  return (
    <div className="relative">
      {/* Halo élémentaire, seul « visuel » du personnage tant qu'aucune texture
          n'est livrée. Teinté par l'élément réel lu dans BattleChar. */}
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
          Retour aux personnages
        </Link>

        {/* ------------------------------------------------------------ en-tête */}
        <header className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <CrestPlaceholder character={character} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DnaTag tone="crimson">Version {character.version}</DnaTag>
              <DnaTag tone="gold">Non sorti</DnaTag>
              <span className="font-mono text-[0.62rem] text-muted-2">#{character.charId}</span>
            </div>

            <h1 className="mt-3 font-display text-5xl font-semibold text-parch md:text-6xl">{character.name}</h1>
            <p className="mt-1 font-serif text-lg italic text-gold">« {character.subtitle} »</p>
            <p className="mt-0.5 font-mono text-[0.68rem] text-muted-2">{character.subtitleEn}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <DnaElementBadge element={character.element} showLabel size={28} />
              <DnaStars value={character.rarity} className="text-base" />
              <span className="font-sans text-sm text-parch/80">{character.campLabel}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {character.weaponTags.map((tag) => (
                <DnaTag key={tag}>{WEAPON_LABELS[tag] ?? tag}</DnaTag>
              ))}
              {character.positioning.map((pos) => (
                <DnaTag key={pos} tone="crimson">
                  {POSITIONING_LABELS[pos] ?? pos}
                </DnaTag>
              ))}
            </div>

            {character.releaseDate ? (
              <div className="mt-6">
                <UpcomingCountdown
                  releaseDate={character.releaseDate}
                  versionName={character.versionName}
                  bannerName={character.bannerName}
                />
              </div>
            ) : null}
          </div>
        </header>

        <DnaDivider className="my-8" />

        {/* ------------------------------------------------------------ contenu */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="flex flex-col gap-6">
            <section>
              <DnaSectionMark>PROFILE.DOSSIER</DnaSectionMark>
              <DnaPanel className="mt-3 p-5">
                <div className="flex flex-col gap-3">
                  {character.lore.map((paragraph, index) => (
                    <p key={index} className="font-serif text-[0.98rem] leading-relaxed text-parch/85">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <p className="mt-4 font-sans text-xs text-muted-2">
                  Extraits reconstitués depuis les dialogues et les archives du jeu, toutes langues confondues.
                </p>
              </DnaPanel>
            </section>

            <section>
              <DnaSectionMark>KIT.PREVIEW</DnaSectionMark>
              <DnaPanel className="mt-3 p-5">
                <p className="font-sans text-sm text-muted">
                  Le jeu déclare {character.skillIds.length} compétences ({character.skillIds.join(", ")}), mais leurs
                  descriptions et leurs icônes ne sont pas encore livrées. Ce qui suit vient des présentations
                  communautaires et sera remplacé par les données réelles à la sortie.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  {character.skills.map((skill) => (
                    <div key={skill.name} className="border-l-2 border-gold/30 pl-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg text-parch">{skill.name}</h3>
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-2">
                          {skill.slot}
                        </span>
                        <ConfidenceBadge level={skill.confidence} />
                      </div>
                      <p className="mt-1 font-sans text-sm text-parch/80">{skill.description}</p>
                    </div>
                  ))}
                </div>
              </DnaPanel>
            </section>

            <section>
              <DnaSectionMark>STATS.BASELINE</DnaSectionMark>
              <DnaPanel className="mt-3 p-5">
                <p className="font-sans text-sm text-muted">
                  Valeurs lues dans <code className="font-mono text-[0.72rem] text-gold/80">BattleChar</code>, projetées
                  au niveau {maxLevel}{" "}avec les courbes de croissance déclarées. {character.name} utilise les
                  courbes &laquo;&nbsp;S&nbsp;&raquo; sur toutes ses statistiques, celles des personnages
                  5&nbsp;étoiles.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <thead>
                      <tr className="font-caps text-[0.56rem] uppercase tracking-[0.14em] text-muted">
                        <th className="pb-2 pr-4 font-normal">Statistique</th>
                        <th className="pb-2 pr-4 font-normal">Niveau 1</th>
                        <th className="pb-2 pr-4 font-normal">Niveau {maxLevel}</th>
                        <th className="pb-2 font-normal">Courbe</th>
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
                        <td className="py-2 pr-4">SP max</td>
                        <td className="py-2 pr-4 font-mono">{character.baseStats.maxSp}</td>
                        <td className="py-2 pr-4 font-mono text-gold-bright">{character.baseStats.maxSp}</td>
                        <td className="py-2 font-mono text-xs text-muted-2">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 font-sans text-xs text-muted-2">
                  La DÉF ne progresse pas avec le niveau dans ce jeu : sa courbe vaut 1 à tous les paliers.
                </p>
              </DnaPanel>
            </section>
          </div>

          {/* ------------------------------------------------------- colonne latérale */}
          <aside className="flex flex-col gap-6">
            <section>
              <DnaSectionLabel>Fiche technique</DnaSectionLabel>
              <DnaPanel className="mt-3 p-4">
                <dl className="flex flex-col gap-3">
                  <Row label="Élément" value={element.label} confidence="dataMined" />
                  <Row label="Rareté" value={`${character.rarity} étoiles`} confidence="dataMined" />
                  <Row label="Niveau max" value={`${maxLevel}`} confidence="dataMined" />
                  <Row label="Faction" value={character.campLabel} confidence="dataMined" />
                  <Row
                    label="Armes"
                    value={character.weaponTags.map((t) => WEAPON_LABELS[t] ?? t).join(" · ")}
                    confidence="dataMined"
                  />
                  <Row
                    label="Stats conseillées"
                    value={character.recommendAttr.map((a) => ATTR_LABELS[a] ?? a).join(" · ")}
                    confidence="dataMined"
                  />
                  <Row label="Apparences" value={`${character.skinCount}`} confidence="dataMined" />
                  {character.skinNames?.length ? (
                    <Row label="Skin de bannière" value={character.skinNames.join(", ")} confidence="community" />
                  ) : null}
                  {character.voiceActorEn ? (
                    <Row label="Voix (EN)" value={character.voiceActorEn} confidence="announced" />
                  ) : null}
                  {character.facts.map((fact) => (
                    <Row key={fact.label} label={fact.label} value={fact.value} confidence={fact.confidence} />
                  ))}
                </dl>
              </DnaPanel>
            </section>

            <section>
              <DnaSectionLabel>Comment lire cette fiche</DnaSectionLabel>
              <DnaPanel className="mt-3 p-4">
                <ul className="flex flex-col gap-3">
                  {(Object.keys(CONFIDENCE_META) as UpcomingConfidence[]).map((level) => (
                    <li key={level} className="flex items-start gap-2.5">
                      <ConfidenceBadge level={level} />
                      <span className="font-sans text-xs text-muted">
                        {level === "dataMined"
                          ? "Lu directement dans les fichiers du jeu – sûr, mais peut encore être équilibré d'ici la sortie."
                          : level === "announced"
                            ? "Communiqué officiellement par le studio."
                            : "Circule dans la communauté, pas encore vérifiable dans les fichiers."}
                      </span>
                    </li>
                  ))}
                </ul>
              </DnaPanel>
            </section>

            <section>
              <DnaSectionLabel>Sources</DnaSectionLabel>
              <DnaPanel className="mt-3 p-4">
                <ul className="flex flex-col gap-2">
                  {character.sources.map((source) => (
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

function Row({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string;
  confidence: UpcomingConfidence;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/8 pb-2.5 last:border-b-0 last:pb-0">
      <dt className="font-caps text-[0.56rem] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right">
        <span className="font-sans text-sm text-parch/90">{value}</span>
        <ConfidenceBadge level={confidence} />
      </dd>
    </div>
  );
}

/**
 * Cartouche tenant lieu de portrait.
 *
 * Aucune texture n'existe pour ce personnage : on ne cherche pas à en simuler
 * une. Le cadre reprend l'ornementation du design system, teinte le fond avec
 * la couleur de l'élément, et affiche l'initiale gravée – un blason, pas un
 * placeholder cassé.
 */
function CrestPlaceholder({ character }: { character: UpcomingCharacter }) {
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
      {/* Trame diagonale discrète : occupe la surface sans imiter une image. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 9px)",
          color: element.hex,
        }}
      />
      <DnaCornerBrackets />

      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <span
          className="font-display text-[7rem] leading-none opacity-25"
          style={{ color: element.hex }}
          aria-hidden
        >
          {character.name.charAt(0)}
        </span>
        <div>
          <p className="font-caps text-[0.56rem] uppercase tracking-[0.2em] text-muted-2">Illustration</p>
          <p className="mt-1 font-sans text-sm text-muted">non livrée par le jeu</p>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] text-muted-2">
          <Sparkles className="h-3 w-3" />
          {character.internalName} · {character.charId}
        </span>
      </div>
    </div>
  );
}
