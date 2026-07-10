"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeInfo,
  BookOpenText,
  FlameKindling,
  Gem,
  GitBranch,
  Lock,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Wrench,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DnaStatRow } from "@/components/dna/StatRow";
import { DnaItemIcon } from "@/components/dna/ItemIcon";
import { WeaponFusionTrack } from "@/components/items/WeaponFusionTrack";
import { CALAMITY_ACCENT_HEX, potentialNodesUnlocked } from "@/lib/items/calamity-weapons";

type GuideWedgeSlot = {
  position: number;
  name: string;
  icon: string;
  href: string | null;
  track: number | null;
};

type GuideForgeMaterial = {
  id: number;
  name: string;
  icon: string;
  quantity: number;
};

type GuideForgeStep = {
  level: number;
  materials: GuideForgeMaterial[];
  note: string | null;
};

export type CalamityGuideWeapon = {
  id: string;
  href: string;
  name: string;
  englishName: string;
  description: string | null;
  icon: string;
  type: "Melee" | "Ranged";
  typeLabel: string;
  subtype: string;
  subtypeLabel: string;
  atkType: string | null;
  baseAtk: number | null;
  maxAtk: number | null;
  critRate: number | null;
  critDamage: number | null;
  openVersion: number | null;
  passiveDescription: string | null;
  potentialTreeKnown: boolean;
  wedgePoolKey: "UI_Armory_Meleeweapon" | "UI_Armory_Longrange";
  wedgePoolLabel: string;
  wedgeBuildSlots: GuideWedgeSlot[];
  forgeSteps: GuideForgeStep[];
};

type CalamityWeaponsGuideClientProps = {
  categorySlug: string;
  totalWeaponCount: number;
  weapons: CalamityGuideWeapon[];
  wedgePools: {
    melee: number;
    ranged: number;
    consonanceMelee: number;
    consonanceRanged: number;
  };
};

const FUSION_STEPS = [
  {
    level: 0,
    label: "Base",
    title: "Arme obtenue",
    body: "L’arme est équipeable et son potentiel de base existe, mais le chemin de forge n’est pas encore monté.",
  },
  {
    level: 1,
    label: "I",
    title: "Four de calamité I",
    body: "Premier palier de Fusion de calamité. Les coûts commencent à utiliser le prototype de l’arme concernée.",
  },
  {
    level: 2,
    label: "II",
    title: "Four de calamité II",
    body: "Le chemin ajoute des potentiels ou des bonus de stats liés à l’arbre HyperWeaponSkillTree.",
  },
  {
    level: 3,
    label: "III",
    title: "Four de calamité III",
    body: "Les branches de potentiel avancent. Les effets restent conditionnés par l’arme de prédilection du personnage.",
  },
  {
    level: 4,
    label: "IV",
    title: "Four de calamité IV",
    body: "Les gros bonus de branche sont disponibles lorsque le niveau du four global suit.",
  },
  {
    level: 5,
    label: "V",
    title: "Four de calamité V",
    body: "Palier final actuellement exposé par les tables locales: niveau maximal de fusion 5.",
  },
] as const;

const ATK_TYPE_LABELS: Record<string, string> = {
  Psionic: "Psionique",
  Smash: "Contondant",
  Spike: "Perçant",
  Slash: "Tranchant",
};

function formatPercent(value: number | null, digits = 0): string {
  if (value === null) return "N/A";
  return `${(value * 100).toFixed(digits).replace(/\.0+$/, "")}%`;
}

function formatVersion(value: number | null): string {
  if (value === null) return "N/A";
  if (value < 10) return `v${value}`;
  return `v${Math.floor(value / 10)}.${value % 10}`;
}

function CalamityBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 px-3 py-1 text-xs text-parch">
      {children}
    </span>
  );
}

function FactCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="border border-white/10 bg-ink/55 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center border border-gold/25 bg-gold/10 text-gold">
          {icon}
        </span>
        <h3 className="font-display text-lg text-parch">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-parch/80">{children}</p>
    </article>
  );
}

export default function CalamityWeaponsGuideClient({
  categorySlug,
  totalWeaponCount,
  weapons,
  wedgePools,
}: CalamityWeaponsGuideClientProps) {
  const [selectedWeaponId, setSelectedWeaponId] = useState(weapons[0]?.id ?? "");
  const [fusionLevel, setFusionLevel] = useState(0);

  const activeWeapon = useMemo(
    () => weapons.find((weapon) => weapon.id === selectedWeaponId) ?? weapons[0],
    [selectedWeaponId, weapons],
  );

  if (!activeWeapon) {
    return null;
  }

  const currentStep = FUSION_STEPS.find((step) => step.level === fusionLevel) ?? FUSION_STEPS[0];
  const currentForgeStep = activeWeapon.forgeSteps.find((step) => step.level === Math.max(1, fusionLevel));
  const unlockedPotentialNodes = potentialNodesUnlocked(activeWeapon.id, fusionLevel);
  return (
    <div className="space-y-8">
      <DnaPanel className="overflow-hidden p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/items/${categorySlug}`}
            className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-sm text-parch transition-colors hover:border-gold/45 hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux armes
          </Link>
          <CalamityBadge>
            <BookOpenText className="h-3.5 w-3.5 text-crimson-bright" />
            Guide Armes de calamité
          </CalamityBadge>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="font-caps text-[0.68rem] uppercase tracking-[0.3em] text-crimson-bright">
              HyperWeapon / Fusion de calamité
            </p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl text-parch md:text-5xl">
              Comprendre les armes de calamité
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-parch/85 md:text-base">
              Dans les données du jeu, une arme de calamité est une arme dont le sous-type technique est{" "}
              <code>Hyper</code>. Elle possède une progression de Fusion de calamité de 0 à 5, des Potentiels
              d’arme, et une règle stricte: le Potentiel ne fonctionne que si le personnage maîtrise ce type d’arme.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-crimson-bright/25 bg-crimson/10 p-4">
              <p className="font-caps text-[0.62rem] uppercase tracking-[0.22em] text-muted">Catalogue</p>
              <p className="mt-1 font-display text-3xl text-parch">{weapons.length}</p>
              <p className="text-xs text-muted">armes Hyper sur {totalWeaponCount} armes locales</p>
            </div>
            <div className="border border-gold/25 bg-gold/10 p-4">
              <p className="font-caps text-[0.62rem] uppercase tracking-[0.22em] text-muted">Fusion</p>
              <p className="mt-1 font-display text-3xl text-parch">0-5</p>
              <p className="text-xs text-muted">paliers exposés par HyperWeaponCardLevel</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <CalamityBadge>
            <Swords className="h-3.5 w-3.5 text-gold" />
            1 arme de calamité max par personnage
          </CalamityBadge>
          <CalamityBadge>
            <Target className="h-3.5 w-3.5 text-hydro" />
            Potentiel actif seulement avec l’arme de prédilection
          </CalamityBadge>
          <CalamityBadge>
            <Gem className="h-3.5 w-3.5 text-umbro" />
            Builds Demon Wedges d’arme séparés
          </CalamityBadge>
        </div>
      </DnaPanel>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>Arsenal de calamité</DnaSectionLabel>
          <div className="mt-4 grid gap-2">
            {weapons.map((weapon) => {
              const active = weapon.id === activeWeapon.id;
              return (
                <button
                  key={weapon.id}
                  type="button"
                  onClick={() => {
                    setSelectedWeaponId(weapon.id);
                    setFusionLevel(0);
                  }}
                  aria-pressed={active}
                  className={`flex min-h-[76px] items-center gap-3 border p-3 text-left transition-colors ${
                    active
                      ? "border-crimson-bright/55 bg-crimson/15"
                      : "border-white/10 bg-ink/55 hover:border-gold/40"
                  }`}
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center border border-gold/20 bg-panel/70 p-2">
                    <DnaItemIcon
                      src={weapon.icon}
                      alt=""
                      width={56}
                      height={56}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg text-parch">{weapon.name}</span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {weapon.typeLabel} · {weapon.subtypeLabel} · {formatVersion(weapon.openVersion)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </DnaPanel>

        <DnaPanel className="p-4 md:p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
            <div className="min-w-0">
              <DnaSectionLabel>Fiche active</DnaSectionLabel>
              <div className="mt-5 flex flex-col gap-5 sm:flex-row">
                <div className="grid h-32 w-32 shrink-0 place-items-center border border-crimson-bright/35 bg-ink/70 p-4 shadow-[0_0_35px_rgba(181,48,42,0.16)]">
                  <DnaItemIcon
                    src={activeWeapon.icon}
                    alt={activeWeapon.name}
                    width={128}
                    height={128}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-caps text-[0.62rem] uppercase tracking-[0.24em] text-crimson-bright">
                    {activeWeapon.englishName}
                  </p>
                  <h2 className="mt-1 font-display text-3xl text-parch">{activeWeapon.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-sm border border-white/10 bg-ink/55 px-2 py-1 text-parch/85">
                      {activeWeapon.typeLabel}
                    </span>
                    <span className="rounded-sm border border-white/10 bg-ink/55 px-2 py-1 text-parch/85">
                      {activeWeapon.subtypeLabel}
                    </span>
                    <span className="rounded-sm border border-crimson-bright/35 bg-crimson/10 px-2 py-1 text-crimson-bright">
                      WeaponSubType: Hyper
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-parch/80">
                    {activeWeapon.description ?? "Aucune description localisée disponible dans l’extrait actuel."}
                  </p>
                  <Link
                    href={activeWeapon.href}
                    className="mt-4 inline-flex items-center gap-2 rounded-sm border border-gold/35 bg-gold/10 px-3 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
                  >
                    Ouvrir la fiche complète
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <DnaStatRow
                  label="ATQ"
                  value={
                    activeWeapon.baseAtk !== null && activeWeapon.maxAtk !== null
                      ? `${activeWeapon.baseAtk} -> ${activeWeapon.maxAtk}`
                      : "N/A"
                  }
                />
                <DnaStatRow
                  label="Type ATQ"
                  value={activeWeapon.atkType ? ATK_TYPE_LABELS[activeWeapon.atkType] ?? activeWeapon.atkType : "N/A"}
                />
                <DnaStatRow label="Taux critique" value={formatPercent(activeWeapon.critRate)} />
                <DnaStatRow label="Dégâts critiques" value={formatPercent(activeWeapon.critDamage)} />
              </div>
            </div>

            <div className="border border-white/10 bg-ink/55 p-4">
              <DnaSectionLabel>Fusion</DnaSectionLabel>
              <WeaponFusionTrack
                levels={[0, 1, 2, 3, 4, 5]}
                value={fusionLevel}
                accentHex={CALAMITY_ACCENT_HEX}
                onChange={setFusionLevel}
              />
              <div className="mt-4 border border-crimson-bright/25 bg-crimson/10 p-3">
                <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-crimson-bright">
                  Palier {currentStep.label}
                </p>
                <p className="mt-1 text-sm font-medium text-parch">{currentStep.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-parch/75">{currentStep.body}</p>
                <p className="mt-3 text-xs text-muted">
                  Potentiels connus déverrouillés:{" "}
                  <span className="text-parch">
                    {unlockedPotentialNodes === null ? "non détaillé dans l’export" : unlockedPotentialNodes}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </DnaPanel>
      </section>

      <section className="grid gap-5 lg:grid-cols-4">
        <FactCard icon={<FlameKindling className="h-5 w-5" />} title="Fusion de calamité">
          La Fusion de calamité augmente le niveau de fusion de l’arme. Les tables locales exposent les paliers 1 à
          5 via <code>HyperWeaponCardLevel</code>.
        </FactCard>
        <FactCard icon={<Sparkles className="h-5 w-5" />} title="Potentiels d’arme">
          Les Potentiels sont débloqués par la fusion. Dans le texte du jeu, ils ne prennent effet que si le type de
          l’arme correspond à l’arme de prédilection du personnage.
        </FactCard>
        <FactCard icon={<Lock className="h-5 w-5" />} title="Limite d’équipement">
          Le texte UI indique qu’un personnage ne peut équiper qu’une seule Arme de calamité à la fois.
        </FactCard>
        <FactCard icon={<ShieldCheck className="h-5 w-5" />} title="Pas une Consonance">
          Les armes de calamité sont les armes <code>Hyper</code>. Les clés <code>*Ultra</code> dans les Demon Wedges
          concernent les armes de Consonance.
        </FactCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>Coût du palier sélectionné</DnaSectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-parch/80">
            Les coûts ci-dessous viennent de la table <code>HyperWeaponCardLevel</code>. Les armes en acier exposent
            actuellement un coût minimal en Phoxène dans les données locales.
          </p>

          {fusionLevel === 0 ? (
            <div className="mt-4 border border-white/10 bg-ink/55 p-4 text-sm text-muted">
              Aucun coût de fusion pour le palier 0.
            </div>
          ) : currentForgeStep ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {currentForgeStep.materials.map((material) => (
                <div
                  key={`${currentForgeStep.level}-${material.id}`}
                  className="flex items-center gap-3 border border-white/10 bg-ink/55 p-3"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-gold/20 bg-panel/70 p-1.5">
                    <DnaItemIcon src={material.icon} alt="" width={40} height={40} loading="lazy" className="max-h-full max-w-full object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-parch">{material.name}</span>
                    <span className="text-xs text-muted">ID {material.id}</span>
                  </span>
                  <span className="font-caps text-sm text-gold">x{material.quantity}</span>
                </div>
              ))}
              {currentForgeStep.note ? (
                <p className="sm:col-span-2 text-xs text-muted">{currentForgeStep.note}</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 border border-white/10 bg-ink/55 p-4 text-sm text-muted">
              Coût non exposé pour ce palier dans l’extrait actuel.
            </div>
          )}
        </DnaPanel>

        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>Demon Wedges liés</DnaSectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-parch/80">
            La fiche d’arme du site peut afficher un build de Demon Wedges canonique. Pour{" "}
            <span className="text-parch">{activeWeapon.name}</span>, le pool compatible est{" "}
            <code>{activeWeapon.wedgePoolKey}</code>, soit {activeWeapon.wedgePoolLabel}.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="border border-white/10 bg-ink/55 p-3">
              <p className="text-muted">Mêlée</p>
              <p className="mt-1 font-display text-2xl text-parch">{wedgePools.melee}</p>
            </div>
            <div className="border border-white/10 bg-ink/55 p-3">
              <p className="text-muted">Distance</p>
              <p className="mt-1 font-display text-2xl text-parch">{wedgePools.ranged}</p>
            </div>
            <div className="border border-white/10 bg-ink/55 p-3">
              <p className="text-muted">Consonance mêlée</p>
              <p className="mt-1 font-display text-2xl text-parch">{wedgePools.consonanceMelee}</p>
            </div>
            <div className="border border-white/10 bg-ink/55 p-3">
              <p className="text-muted">Consonance distance</p>
              <p className="mt-1 font-display text-2xl text-parch">{wedgePools.consonanceRanged}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {activeWeapon.wedgeBuildSlots.map((slot) => (
              <Link
                key={`${activeWeapon.id}-${slot.position}`}
                href={slot.href ?? "/items/mods"}
                className="group border border-white/10 bg-ink/55 p-2 transition-colors hover:border-gold/40"
              >
                <div className="flex h-12 items-center justify-center">
                  <DnaItemIcon src={slot.icon} alt="" width={48} height={48} loading="lazy" className="max-h-full max-w-full object-contain" />
                </div>
                <p className="mt-2 line-clamp-2 min-h-8 text-center text-[11px] leading-tight text-parch/85 group-hover:text-gold">
                  {slot.position}. {slot.name}
                </p>
              </Link>
            ))}
          </div>
        </DnaPanel>
      </section>

      <DnaPanel className="p-4 md:p-5">
        <DnaSectionLabel>Lecture des données locales</DnaSectionLabel>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FactCard icon={<BadgeInfo className="h-5 w-5" />} title="Weapon">
            <code>WeaponSubType = Hyper</code> identifie les armes de calamité. C’est le signal utilisé pour cette
            fiche.
          </FactCard>
          <FactCard icon={<Zap className="h-5 w-5" />} title="BattleWeapon">
            Les stats de combat viennent de <code>BattleWeapon</code>: ATQ, type d’ATQ, critique et bonus liés aux
            potentiels.
          </FactCard>
          <FactCard icon={<GitBranch className="h-5 w-5" />} title="SkillTree">
            <code>HyperWeaponSkillTree</code> décrit les branches de potentiels connues pour Conflit perpétuel et
            Requiem d’épines.
          </FactCard>
          <FactCard icon={<Wrench className="h-5 w-5" />} title="CardLevel">
            <code>HyperWeaponCardLevel</code> donne les paliers de fusion, les conditions de four et les ressources.
          </FactCard>
        </div>
      </DnaPanel>
    </div>
  );
}
