"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { cn } from "./cn";

/**
 * Fond atmosphérique : un visuel en effet Ken Burns, des lueurs qui suivent le
 * défilement.
 *
 * Deux mouvements indépendants, volontairement :
 *
 * - **Les visuels vivent dans le temps.** Chacun dérive et se rapproche
 *   lentement (Ken Burns), puis passe la main au suivant en fondu enchaîné.
 *   Le défilement ne choisit pas l'image — sinon le fond n'est qu'un diaporama
 *   piloté à la molette, et il se fige dès qu'on arrête de lire.
 * - **Les lueurs vivent dans le défilement.** Trois nappes teintées
 *   (cramoisi, teal, or) dont le poids et la dérive suivent la progression
 *   dans la page : la dominante change à mesure qu'on descend.
 *
 * Aucun rendu React n'est déclenché par le défilement : le gestionnaire écrit
 * des variables CSS (`--dna-scroll`, `--dna-flow-N`, `--dna-drift`) dans une
 * frame d'animation. Seul le passage d'un visuel au suivant, cadencé par une
 * horloge, provoque un rendu.
 */

/** Amplitude de la dérive verticale des visuels au défilement, en pixels. */
const PARALLAX_RANGE = 44;

/**
 * Courses du Ken Burns, une par visuel (cyclique). Directions et amplitudes
 * différentes pour que deux visuels consécutifs ne bougent jamais pareil.
 */
const KEN_BURNS_MOVES = [
  { x: "-2.5%", y: "-1.8%", scale: "1.16" },
  { x: "2.2%", y: "-2.4%", scale: "1.13" },
  { x: "-1.6%", y: "2.6%", scale: "1.18" },
  { x: "2.8%", y: "1.4%", scale: "1.14" },
  { x: "-2.8%", y: "0.8%", scale: "1.2" },
  { x: "1.2%", y: "-2.8%", scale: "1.15" },
] as const;

export type DnaAmbientBackdropProps = {
  /**
   * Visuels de fond, dans l'ordre de passage.
   *
   * La liste doit être une constante (définie hors composant) : elle sert de
   * dépendance à l'horloge et à l'abonnement au défilement.
   */
  frames: readonly string[];
  /** Densité du fond. `subtle` pour les pages denses, `bold` pour une vitrine. */
  intensity?: "subtle" | "normal" | "bold";
  /** Durée d'affichage d'un visuel, fondu compris (ms). */
  interval?: number;
  className?: string;
};

export function DnaAmbientBackdrop({
  frames,
  intensity = "normal",
  interval = 11000,
  className,
}: DnaAmbientBackdropProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // ------------------------------------------------------- défilement → lueurs
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let pending = 0;

    const apply = () => {
      pending = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      root.style.setProperty("--dna-scroll", progress.toFixed(4));
      root.style.setProperty("--dna-drift", `${(progress * PARALLAX_RANGE).toFixed(1)}px`);

      // Les trois nappes se relaient sur la hauteur de page : cramoisi en
      // haut, teal au milieu, or en bas, avec un large recouvrement.
      for (let i = 0; i < 3; i++) {
        const weight = Math.max(0.12, 1 - Math.abs(progress - i / 2) * 1.7);
        root.style.setProperty(`--dna-flow-${i}`, weight.toFixed(3));
      }
    };

    const schedule = () => {
      if (pending) return;
      pending = requestAnimationFrame(apply);
    };

    apply();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (pending) cancelAnimationFrame(pending);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // --------------------------------------------------- horloge des visuels
  useEffect(() => {
    if (frames.length < 2) return;
    // Mouvement réduit : on reste sur le premier visuel, sans rotation. Le Ken
    // Burns, lui, est neutralisé par la règle globale de `globals.css`.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setActive((i) => (i + 1) % frames.length), interval);
    return () => clearInterval(id);
  }, [frames, interval]);

  return (
    <div ref={rootRef} aria-hidden className={cn("dna-ambient", className)} data-intensity={intensity}>
      {frames.map((src, i) => {
        const move = KEN_BURNS_MOVES[i % KEN_BURNS_MOVES.length];
        return (
          <span
            key={src}
            className="dna-ambient-frame"
            data-active={i === active ? "true" : undefined}
            style={
              {
                "--dna-kb-x": move.x,
                "--dna-kb-y": move.y,
                "--dna-kb-scale": move.scale,
              } as CSSProperties
            }
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="100vw"
              quality={70}
              // Décor : il ne doit jamais concurrencer le contenu au chargement.
              loading="lazy"
              fetchPriority="low"
              className="dna-ambient-image"
            />
          </span>
        );
      })}

      {/* Nappes teintées : le conteneur porte la dérive au défilement, chaque
          couche sa propre respiration — deux transforms ne tiennent pas sur un
          même élément, l'animation écraserait la règle. */}
      <span className="dna-ambient-flow">
        <span className="dna-ambient-flow-layer" data-tint="crimson" />
        <span className="dna-ambient-flow-layer" data-tint="teal" />
        <span className="dna-ambient-flow-layer" data-tint="gold" />
      </span>

      <span className="dna-ambient-veil" />
      <span className="dna-ambient-grain" />
    </div>
  );
}
