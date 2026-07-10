"use client";

import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { DnaItemIcon } from "@/components/dna/ItemIcon";
import { cn } from "@/components/dna/cn";
import { CALAMITY_ACCENT_HEX } from "@/lib/items/calamity-weapons";
import potentialsData from "@/data/weapons/calamity-potentials.json";

type LocalizedText = Record<string, string>;
type PotentialNode = {
  id: number;
  level: number;
  branch: number;
  unlock: number[];
  cost: { id: number; num: number }[] | null;
  icon: string | null;
  name: LocalizedText;
  desc: LocalizedText;
};
type WeaponPotentials = { weaponId: number; nodes: PotentialNode[] };

const DATA = potentialsData as Record<string, WeaponPotentials>;
const ROMAN = ["0", "I", "II", "III", "IV", "V"];
const LEVELS = [0, 1, 2, 3, 4, 5];

function pick(map: LocalizedText | undefined, lang: string): string {
  if (!map) return "";
  return map[lang] ?? map.EN ?? map.FR ?? Object.values(map)[0] ?? "";
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
  const nodes = useMemo(() => DATA[weaponItemId]?.nodes ?? [], [weaponItemId]);

  const byLevel = useMemo(() => {
    const m = new Map<number, PotentialNode[]>();
    for (const n of nodes) {
      const arr = m.get(n.level) ?? [];
      arr.push(n);
      m.set(n.level, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.branch - b.branch);
    return m;
  }, [nodes]);

  const [selectedId, setSelectedId] = useState<number>(nodes[0]?.id ?? 0);
  const selected = nodes.find((n) => n.id === selectedId) ?? nodes[0];

  if (nodes.length === 0) {
    return (
      <div className={cn("border border-white/10 bg-ink/55 p-4 text-sm text-muted", className)}>
        Les Potentiels de cette arme ne sont pas exposés dans les données du jeu (arme en acier /
        placeholder). Seuls Conflit perpétuel et Requiem d’épines disposent d’un arbre détaillé.
      </div>
    );
  }

  const unlockedCount = nodes.filter((n) => n.level <= fusionLevel).length;

  return (
    <div className={cn("grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]", className)}>
      {/* Arbre */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-caps text-[0.62rem] uppercase tracking-[0.24em] text-muted">
            Arbre de Potentiel
          </p>
          <span
            className="rounded-sm border px-2 py-0.5 font-caps text-[0.62rem] uppercase tracking-[0.18em]"
            style={{ borderColor: `${CALAMITY_ACCENT_HEX}55`, background: `${CALAMITY_ACCENT_HEX}18`, color: CALAMITY_ACCENT_HEX }}
          >
            {unlockedCount}/{nodes.length}
          </span>
        </div>

        <div className="space-y-0">
          {LEVELS.map((level) => {
            const levelNodes = byLevel.get(level) ?? [];
            const reached = level <= fusionLevel;
            const single = levelNodes.length === 1; // paliers 0 et V
            const isLast = level === 5;
            return (
              <div key={level} className="grid grid-cols-[2.25rem_1fr] gap-3">
                {/* Rail gauche : marqueur de palier + connecteurs verticaux */}
                <div className="relative flex flex-col items-center">
                  {level !== 0 ? (
                    <span
                      aria-hidden
                      className="h-3 w-px shrink-0"
                      style={{ background: reached ? `${CALAMITY_ACCENT_HEX}aa` : "rgba(255,255,255,0.12)" }}
                    />
                  ) : (
                    <span aria-hidden className="h-3 w-px shrink-0" />
                  )}
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full border font-caps text-xs font-semibold",
                      reached ? "text-parch" : "text-muted-2",
                    )}
                    style={{
                      borderColor: reached ? CALAMITY_ACCENT_HEX : "rgba(255,255,255,0.15)",
                      background: reached ? `${CALAMITY_ACCENT_HEX}22` : "rgba(10,10,11,0.6)",
                    }}
                  >
                    {ROMAN[level]}
                  </span>
                  {!isLast ? (
                    <span
                      aria-hidden
                      className="w-px flex-1"
                      style={{ background: level < fusionLevel ? `${CALAMITY_ACCENT_HEX}aa` : "rgba(255,255,255,0.12)" }}
                    />
                  ) : null}
                </div>

                {/* Nœuds du palier */}
                <div className={cn("grid gap-2 pb-3", single ? "grid-cols-1" : "grid-cols-2")}>
                  {levelNodes.map((node) => {
                    const locked = node.level > fusionLevel;
                    const active = node.id === selectedId;
                    const label = pick(node.name, lang);
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedId(node.id)}
                        aria-pressed={active}
                        className={cn(
                          "group flex items-center gap-2.5 border p-2 text-left transition-colors",
                          active
                            ? "border-crimson-bright/60 bg-crimson/15"
                            : locked
                              ? "border-white/10 bg-ink/40 hover:border-white/20"
                              : "border-white/12 bg-ink/60 hover:border-crimson-bright/40",
                        )}
                      >
                        <span
                          className={cn(
                            "relative grid h-10 w-10 shrink-0 place-items-center border bg-panel/70 p-1.5",
                            active ? "border-crimson-bright/60" : "border-white/12",
                          )}
                        >
                          <DnaItemIcon
                            src={node.icon}
                            alt=""
                            width={40}
                            height={40}
                            className={cn("max-h-full max-w-full object-contain", locked && "opacity-40 grayscale")}
                          />
                          {locked ? (
                            <span className="absolute inset-0 grid place-items-center bg-ink/55">
                              <Lock className="h-3.5 w-3.5 text-muted" />
                            </span>
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block truncate text-xs font-medium",
                              active ? "text-crimson-bright" : locked ? "text-muted" : "text-parch",
                            )}
                          >
                            {label}
                          </span>
                          <span className="block font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted-2">
                            Palier {ROMAN[node.level]}
                            {!single ? ` · Branche ${node.branch}` : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Détail du nœud sélectionné */}
      {selected ? (
        <div className="border border-crimson-bright/25 bg-ink/55 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center border border-crimson-bright/40 bg-panel/70 p-1.5">
              <DnaItemIcon src={selected.icon} alt="" width={48} height={48} className="max-h-full max-w-full object-contain" />
            </span>
            <div className="min-w-0">
              <p className="font-caps text-[0.58rem] uppercase tracking-[0.2em] text-crimson-bright">
                Potentiel · Palier {ROMAN[selected.level]}
                {byLevel.get(selected.level)?.length === 1 ? "" : ` · Branche ${selected.branch}`}
              </p>
              <h4 className="font-display text-lg text-parch">{pick(selected.name, lang)}</h4>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-parch/85">
            {pick(selected.desc, lang)}
          </p>
          {selected.level > fusionLevel ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-white/10 bg-ink/60 px-2 py-1 text-xs text-muted">
              <Lock className="h-3 w-3" />
              Débloqué au niveau de fusion {selected.level}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
