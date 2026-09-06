"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { DnaItemIcon } from "@/components/dna/ItemIcon";
import { cn } from "@/components/dna/cn";
import { CALAMITY_ACCENT_HEX } from "@/lib/items/calamity-weapons";
import potentialsData from "@/data/weapons/calamity-potentials.json";
import materialsData from "@/data/weapons/calamity-potential-materials.json";

type LocalizedText = Record<string, string>;
type NodeAttribute = {
  attrName: string;
  rate: number | null;
  value: number | null;
  rateZone: string | null;
};
type PotentialNode = {
  id: number;
  level: number;
  branch: number;
  unlock: number[];
  cost: { id: number; num: number }[] | null;
  icon: string | null;
  name: LocalizedText;
  /** Absente sur les nœuds « de stat » : leur effet est dans `attrs`. */
  desc: LocalizedText | null;
  attrs: NodeAttribute[] | null;
};

/**
 * Correspondance attribut de jeu → clé de libellé (namespace `characterDetail`),
 * alignée sur celle de la fiche personnage pour que « Intensité » se dise pareil
 * partout sur le site.
 */
const ATTR_LABEL_KEYS: Record<string, string> = {
  ATK: "statATK",
  DEF: "statDEF",
  MaxHp: "statMaxHp",
  MaxES: "statMaxES",
  MaxSp: "statMaxSp",
  SkillIntensity: "statSkillIntensity",
  SkillEfficiency: "statSkillEfficiency",
  SkillSustain: "statSkillSustain",
  SkillRange: "statSkillRange",
  SkillSpeed: "statSkillSpeed",
  StrongValue: "statStrongValue",
  EnmityValue: "statEnmityValue",
  DamageRate: "statDamageRate",
};

/** `0.45` → `+45 %`. `Rate` comme `Value` sont des fractions dans les tables. */
function formatAttributeAmount(attribute: NodeAttribute): string {
  const raw = attribute.rate ?? attribute.value ?? 0;
  const percent = raw * 100;
  return `+${percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(1)} %`;
}
type WeaponPotentials = { weaponId: number; nodes: PotentialNode[] };
type Material = { itemId: string; icon: string | null; name: LocalizedText };

const DATA = potentialsData as Record<string, WeaponPotentials>;
const MATERIALS = materialsData as Record<string, Material>;
const ROMAN = ["0", "I", "II", "III", "IV", "V"];
const LEVELS = [0, 1, 2, 3, 4, 5];

/**
 * Géométrie de l'arbre, en unités du `viewBox`.
 *
 * Reprise de l'écran « Fusion de calamité » du jeu : les paliers ne sont pas
 * alignés en colonne mais posés sur un **arc convexe**, et chaque palier ouvre
 * vers la droite sur une capsule qui contient un ou deux Potentiels. C'est ce
 * décalage progressif qui donne son allure organique à l'ensemble.
 *
 * Tout est exprimé dans un repère fixe, puis mis à l'échelle par le conteneur
 * (rapport d'aspect verrouillé) : les connecteurs SVG et les boutons HTML
 * restent alignés à n'importe quelle taille.
 */
const VIEW = { w: 300, h: 560 };
const ROW_Y = [56, 148, 240, 332, 424, 516];
/** Renflement de l'arc : les paliers du milieu sont poussés vers la droite. */
const BADGE_X = [18, 42, 58, 58, 42, 18];
const BADGE_R = 17;
/** Coin biseauté de la capsule, comme les cadres anguleux du jeu. */
const CAPSULE = { x1: 84, x2: 288, h: 62, bevel: 12 };
const NODE_X_SINGLE = 134;
const NODE_X_PAIR = [134, 228];
const NODE_R = 23;

/**
 * Courbe lissée passant par tous les points (Catmull-Rom converti en cubiques).
 * Une polyligne rendrait l'arc anguleux ; c'est justement la souplesse du tracé
 * qui donne son allure au panneau du jeu.
 */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Contour biseauté d'une capsule de palier. */
function capsulePath(y: number): string {
  const { x1, x2, h, bevel: b } = CAPSULE;
  const top = y - h / 2;
  const bottom = y + h / 2;
  return [
    `M ${x1 + b} ${top}`,
    `L ${x2 - b} ${top}`,
    `L ${x2} ${top + b}`,
    `L ${x2} ${bottom - b}`,
    `L ${x2 - b} ${bottom}`,
    `L ${x1 + b} ${bottom}`,
    `L ${x1} ${bottom - b}`,
    `L ${x1} ${top + b}`,
    "Z",
  ].join(" ");
}

function pick(map: LocalizedText | undefined, lang: string): string {
  if (!map) return "";
  return map[lang] ?? map.EN ?? map.FR ?? Object.values(map)[0] ?? "";
}

/** Position d'un nœud dans le repère du `viewBox`. */
function nodeCenter(node: PotentialNode, siblings: PotentialNode[]): { x: number; y: number } {
  const y = ROW_Y[node.level] ?? 0;
  if (siblings.length <= 1) return { x: NODE_X_SINGLE, y };
  const index = siblings.findIndex((n) => n.id === node.id);
  return { x: NODE_X_PAIR[Math.max(0, index)] ?? NODE_X_PAIR[0], y };
}

/** Pourcentages de positionnement, pour superposer du HTML au SVG. */
function pct(x: number, y: number) {
  return { left: `${(x / VIEW.w) * 100}%`, top: `${(y / VIEW.h) * 100}%` };
}

type CalamityPotentialTreeProps = {
  /** id de l'item arme (ex. "weapons-10299"). */
  weaponItemId: string;
  lang: string;
  /** Niveau de fusion courant (0→5) : verrouille les paliers au-dessus. */
  fusionLevel: number;
  className?: string;
};

export function CalamityPotentialTree({ weaponItemId, lang, fusionLevel, className }: CalamityPotentialTreeProps) {
  const t = useTranslations("items");
  const nodes = useMemo(() => DATA[weaponItemId]?.nodes ?? [], [weaponItemId]);

  const byLevel = useMemo(() => {
    const map = new Map<number, PotentialNode[]>();
    for (const node of nodes) {
      const list = map.get(node.level) ?? [];
      list.push(node);
      map.set(node.level, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.branch - b.branch);
    return map;
  }, [nodes]);

  /** Centre de chaque nœud, indexé par id : sert aux connecteurs et aux boutons. */
  const centers = useMemo(() => {
    const map = new Map<number, { x: number; y: number }>();
    for (const [, list] of byLevel) {
      for (const node of list) map.set(node.id, nodeCenter(node, list));
    }
    return map;
  }, [byLevel]);

  // La sélection retient l'arme à laquelle elle appartient : changer d'arme la
  // périme d'elle-même et le premier nœud du nouvel arbre reprend la main, sans
  // effet de synchronisation.
  const [selection, setSelection] = useState<{ weapon: string; id: number } | null>(null);
  const selectedId = selection?.weapon === weaponItemId ? selection.id : (nodes[0]?.id ?? 0);
  const setSelectedId = (id: number) => setSelection({ weapon: weaponItemId, id });

  const selected = nodes.find((n) => n.id === selectedId) ?? nodes[0];

  if (nodes.length === 0) {
    return (
      <div className={cn("border border-white/10 bg-ink/55 p-4 text-sm text-muted", className)}>
        {t("potentialTreeUnavailable")}
      </div>
    );
  }

  const unlockedCount = nodes.filter((n) => n.level <= fusionLevel).length;

  return (
    <div className={cn("grid items-start gap-5 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]", className)}>
      {/* ------------------------------------------------------------ arbre */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-caps text-[0.62rem] uppercase tracking-[0.24em] text-muted">{t("potentialTree")}</p>
          <span
            className="rounded-sm border px-2 py-0.5 font-caps text-[0.62rem] uppercase tracking-[0.18em]"
            style={{
              borderColor: `${CALAMITY_ACCENT_HEX}55`,
              background: `${CALAMITY_ACCENT_HEX}18`,
              color: CALAMITY_ACCENT_HEX,
            }}
          >
            {unlockedCount}/{nodes.length}
          </span>
        </div>

        <div className="relative mx-auto w-full max-w-[22rem]" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
          <TreeConnectors byLevel={byLevel} centers={centers} fusionLevel={fusionLevel} />

          {/* Pastilles de palier, posées sur l'arc */}
          {LEVELS.map((level) => {
            const reached = level <= fusionLevel;
            const position = pct(BADGE_X[level], ROW_Y[level]);
            return (
              <span
                key={`badge-${level}`}
                aria-hidden
                className={cn(
                  "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center",
                  "font-caps text-[0.7rem] font-semibold",
                  reached ? "text-parch" : "text-muted-2",
                )}
                style={{
                  ...position,
                  width: `${((BADGE_R * 2) / VIEW.w) * 100}%`,
                  aspectRatio: "1",
                  clipPath: "polygon(50% 0%, 82% 18%, 100% 50%, 82% 82%, 50% 100%, 18% 82%, 0% 50%, 18% 18%)",
                  background: reached ? "linear-gradient(180deg,#f4ecd8,#c2a86a)" : "rgba(16,16,18,0.92)",
                  color: reached ? "#241a08" : undefined,
                  border: reached ? "none" : "1px solid rgba(255,255,255,0.14)",
                }}
              >
                {ROMAN[level]}
              </span>
            );
          })}

          {/* Nœuds */}
          {LEVELS.flatMap((level) => {
            const list = byLevel.get(level) ?? [];
            return list.map((node) => {
              const center = centers.get(node.id)!;
              const locked = node.level > fusionLevel;
              const active = node.id === selectedId;
              const position = pct(center.x, center.y);
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  aria-pressed={active}
                  title={pick(node.name, lang)}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
                    "transition-[border-color,box-shadow,transform] hover:scale-105",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    active ? "border-crimson-bright" : locked ? "border-white/12" : "border-gold/45",
                  )}
                  style={{
                    ...position,
                    width: `${((NODE_R * 2) / VIEW.w) * 100}%`,
                    aspectRatio: "1",
                    background: active ? `${CALAMITY_ACCENT_HEX}26` : "rgba(12,15,21,0.92)",
                    boxShadow: active ? `0 0 14px -2px ${CALAMITY_ACCENT_HEX}` : undefined,
                  }}
                >
                  {/* Dimensionné en pourcentage du bouton : la taille du bouton est
                      elle-même relative au conteneur, donc l'icône suit l'échelle. */}
                  <DnaItemIcon
                    src={node.icon}
                    alt=""
                    className={cn(
                      "absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 object-contain",
                      locked && "opacity-35 grayscale",
                    )}
                  />
                  {locked ? (
                    <span className="absolute -bottom-1 -left-1 grid h-4 w-4 place-items-center rounded-full border border-white/15 bg-ink">
                      <Lock className="h-2.5 w-2.5 text-muted-2" />
                    </span>
                  ) : null}
                </button>
              );
            });
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------- détail */}
      {selected ? <NodeDetail node={selected} lang={lang} locked={selected.level > fusionLevel} /> : null}
    </div>
  );
}

/**
 * Couche des liaisons : l'arc qui relie les paliers, l'amorce vers chaque
 * capsule, la capsule elle-même, et les liens de prérequis entre nœuds.
 * Purement décorative — d'où l'`aria-hidden`.
 */
function TreeConnectors({
  byLevel,
  centers,
  fusionLevel,
}: {
  byLevel: Map<number, PotentialNode[]>;
  centers: Map<number, { x: number; y: number }>;
  fusionLevel: number;
}) {
  const dim = "rgba(255,255,255,0.10)";
  const lit = `${CALAMITY_ACCENT_HEX}99`;

  // Arc passant par les pastilles : une courbe lissée, pas une colonne droite.
  const spine = ROW_Y.map((y, i) => ({ x: BADGE_X[i], y }));

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={smoothPath(spine)} fill="none" stroke={dim} strokeWidth={1.5} strokeLinecap="round" />
      {/* Portion de l'arc déjà atteinte, en accent */}
      <path
        d={smoothPath(spine.slice(0, fusionLevel + 1))}
        fill="none"
        stroke={lit}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {LEVELS.map((level) => {
        const list = byLevel.get(level) ?? [];
        if (list.length === 0) return null;
        const reached = level <= fusionLevel;
        const y = ROW_Y[level];
        return (
          <g key={`row-${level}`}>
            {/* Amorce pastille → capsule */}
            <line
              x1={BADGE_X[level] + BADGE_R}
              y1={y}
              x2={CAPSULE.x1}
              y2={y}
              stroke={reached ? lit : dim}
              strokeWidth={1.5}
            />
            {/* Capsule d'accueil des nœuds */}
            <path
              d={capsulePath(y)}
              fill={reached ? `${CALAMITY_ACCENT_HEX}10` : "rgba(255,255,255,0.022)"}
              stroke={reached ? `${CALAMITY_ACCENT_HEX}44` : "rgba(255,255,255,0.07)"}
              strokeWidth={1}
            />
          </g>
        );
      })}

      {/* Liens de prérequis : chaque nœud vers ceux qu'il exige au palier au-dessus */}
      {[...byLevel.values()].flat().map((node) =>
        node.unlock.map((requiredId) => {
          const from = centers.get(requiredId);
          const to = centers.get(node.id);
          if (!from || !to) return null;
          const active = node.level <= fusionLevel;
          return (
            <line
              key={`${requiredId}-${node.id}`}
              x1={from.x}
              y1={from.y + NODE_R}
              x2={to.x}
              y2={to.y - NODE_R}
              stroke={active ? `${CALAMITY_ACCENT_HEX}77` : dim}
              strokeWidth={1.25}
            />
          );
        }),
      )}
    </svg>
  );
}

/** Panneau de droite : le Potentiel sélectionné et son coût de déblocage. */
function NodeDetail({ node, lang, locked }: { node: PotentialNode; lang: string; locked: boolean }) {
  const t = useTranslations("items");
  const tStat = useTranslations("characterDetail");
  const attributeLabel = (attrName: string) => {
    const key = ATTR_LABEL_KEYS[attrName];
    return key ? tStat(key) : attrName;
  };
  const cost = node.cost ?? [];

  return (
    <div className="border border-crimson-bright/25 bg-ink/55 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-crimson-bright/40 bg-panel/70 p-2">
          <DnaItemIcon src={node.icon} alt="" width={56} height={56} className="max-h-full max-w-full object-contain" />
        </span>
        <div className="min-w-0">
          <p className="font-caps text-[0.58rem] uppercase tracking-[0.2em] text-crimson-bright">
            {t("potentialTier", { tier: ROMAN[node.level] })}
          </p>
          <p className="mt-0.5 font-display text-xl text-parch">{pick(node.name, lang)}</p>
          {locked ? (
            <p className="mt-1 inline-flex items-center gap-1.5 font-sans text-[0.72rem] text-muted-2">
              <Lock className="h-3 w-3" />
              {t("potentialLockedHint")}
            </p>
          ) : null}
        </div>
      </div>

      {node.desc ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-parch/85">{pick(node.desc, lang)}</p>
      ) : null}

      {/* Nœuds « de stat » : pas de phrase dans le jeu, seulement un bonus chiffré. */}
      {node.attrs && node.attrs.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {node.attrs.map((attribute) => (
            <li
              key={attribute.attrName}
              className="inline-flex items-baseline gap-2 border border-white/10 bg-panel/50 px-2.5 py-1.5"
            >
              <span className="font-caps text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                {attributeLabel(attribute.attrName)}
              </span>
              <span className="font-mono text-sm text-gold-bright tabular-nums">
                {formatAttributeAmount(attribute)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="font-caps text-[0.58rem] uppercase tracking-[0.2em] text-muted">{t("potentialMaterials")}</p>
        {cost.length === 0 ? (
          <p className="mt-2 font-sans text-[0.8rem] text-muted-2">{t("potentialNoMaterial")}</p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {cost.map((entry) => {
              const material = MATERIALS[String(entry.id)];
              const label = pick(material?.name, lang) || `#${entry.id}`;
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-2 border border-white/10 bg-panel/50 px-2 py-1.5"
                  title={label}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center">
                    <DnaItemIcon
                      src={material?.icon ?? null}
                      alt=""
                      width={32}
                      height={32}
                      className="max-h-full max-w-full object-contain"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-sans text-[0.72rem] text-parch/85">{label}</span>
                    <span className="block font-mono text-[0.68rem] text-gold-bright tabular-nums">×{entry.num}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
