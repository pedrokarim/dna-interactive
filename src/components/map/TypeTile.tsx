"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/components/dna";
import type { Progress } from "@/lib/map/progress";

/**
 * Tuile d'un type de marqueur, calquée sur la carte HoYoLAB : icône carrée,
 * compteur en bas à droite, coche en haut à droite quand le type est affiché,
 * nom tronqué dessous. Tout tient en 64 px de large : quatre tuiles par ligne
 * dans un panneau de 380 px, sans marge perdue.
 */
export function TypeTile({
  icon,
  name,
  active,
  progress,
  tracked,
  onToggle,
}: {
  icon: string;
  name: string;
  active: boolean;
  progress: Progress;
  tracked: boolean;
  onToggle: () => void;
}) {
  const done = tracked && progress.total > 0 && progress.found === progress.total;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title={name}
      className="group flex w-full min-w-0 flex-col items-center gap-1 outline-none transition-transform duration-100 active:scale-95"
    >
      <span
        className={cn(
          "relative grid aspect-square w-full place-items-center border bg-ink-2/80 transition-colors",
          active
            ? "border-gold/70 bg-gold/10"
            : "border-line/15 group-hover:border-line/40",
          "group-focus-visible:ring-2 group-focus-visible:ring-gold/60",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- icônes du CDN du jeu, déjà petites */}
        <img
          src={icon}
          alt=""
          loading="lazy"
          draggable={false}
          className={cn(
            "h-[70%] w-[70%] object-contain transition-[opacity,filter] duration-150",
            !active && "opacity-60 grayscale-[35%] group-hover:opacity-90 group-hover:grayscale-0",
          )}
        />
        <AnimatePresence initial={false}>
          {active && (
            <motion.span
              key="check"
              className="absolute right-0 top-0 grid h-3.5 w-3.5 place-items-center bg-gold text-on-gold"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 26 }}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
        <span
          className={cn(
            "absolute bottom-0 right-0 px-1 font-mono text-[0.6rem] leading-[1.35] tabular-nums",
            done ? "bg-ok/85 text-ink" : "bg-ink/85 text-parch/85",
          )}
        >
          {tracked ? `${progress.found}/${progress.total}` : progress.total}
        </span>
      </span>
      <span className="w-full truncate text-center font-sans text-[0.68rem] leading-tight text-parch/80 group-hover:text-parch">
        {name}
      </span>
    </button>
  );
}
