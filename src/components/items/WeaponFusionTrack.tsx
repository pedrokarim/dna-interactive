"use client";

import { Lock } from "lucide-react";

const GOLD_HEX = "#c2a86a";

type WeaponFusionTrackProps = {
  /** Paliers disponibles, triés croissant (ex. [0,1,2,3,4,5]). */
  levels: number[];
  /** Palier sélectionné. */
  value: number;
  /** Couleur d'accent (élément de l'arme), sinon or. */
  accentHex?: string;
  onChange: (level: number) => void;
};

/**
 * Sélecteur de niveau de fusion (doublons) inspiré de la piste verticale du jeu :
 * losanges reliés par un trait, nœud actif en glow, paliers supérieurs verrouillés.
 * Remplace le range slider classique pour les armes.
 */
export function WeaponFusionTrack({
  levels,
  value,
  accentHex,
  onChange,
}: WeaponFusionTrackProps) {
  const accent = accentHex ?? GOLD_HEX;
  // Base (0) en haut, max en bas — sens du jeu (paliers atteints en haut, verrouillés dessous).
  const ordered = [...levels].sort((a, b) => a - b);

  return (
    <div className="mt-3 flex flex-col items-center" role="group" aria-label="Niveau de fusion">
      {ordered.map((level, index) => {
        const reached = level <= value;
        const active = level === value;
        const locked = level > value;
        // Connecteur au-dessus du nœud : rempli si ce nœud (palier plus élevé) est atteint.
        const connectorFilled = index > 0 && level <= value;

        return (
          <div key={level} className="flex flex-col items-center">
            {index > 0 ? (
              <span
                aria-hidden
                className="h-5 w-[3px] rounded-full transition-colors"
                style={{
                  background: connectorFilled ? accent : "rgba(255,255,255,0.12)",
                  boxShadow: connectorFilled ? `0 0 8px -2px ${accent}` : undefined,
                }}
              />
            ) : null}

            <button
              type="button"
              onClick={() => onChange(level)}
              aria-pressed={active}
              aria-label={`Niveau de fusion ${level}`}
              title={`Niveau de fusion ${level}`}
              className="group relative grid place-items-center outline-none"
              style={{ width: active ? 44 : 36, height: active ? 44 : 36 }}
            >
              {/* Halo du nœud actif */}
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full blur-md"
                  style={{ background: `radial-gradient(circle, ${accent}66, transparent 70%)` }}
                />
              ) : null}
              {/* Losange */}
              <span
                aria-hidden
                className="relative grid place-items-center rotate-45 border transition-all duration-150"
                style={{
                  width: active ? 26 : 20,
                  height: active ? 26 : 20,
                  borderColor: reached ? accent : "rgba(255,255,255,0.22)",
                  background: reached
                    ? active
                      ? accent
                      : `${accent}33`
                    : "rgba(10,9,8,0.6)",
                  boxShadow: active ? `0 0 16px -3px ${accent}` : undefined,
                }}
              >
                {/* Contenu non pivoté (chiffre ou cadenas) */}
                <span
                  className="-rotate-45 font-caps text-[0.62rem] font-semibold leading-none"
                  style={{ color: active ? "#0c0b0a" : reached ? accent : "rgba(255,255,255,0.5)" }}
                >
                  {locked ? (
                    <Lock className="h-3 w-3" style={{ color: "rgba(255,255,255,0.45)" }} />
                  ) : (
                    level
                  )}
                </span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
