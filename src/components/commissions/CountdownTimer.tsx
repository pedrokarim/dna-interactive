"use client";

import { useEffect, useRef, useState } from "react";

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Compte à rebours vers `target` (ISO). Appelle `onComplete` une seule fois au
 * passage à 0. Rendu différé après montage pour éviter tout mismatch
 * d'hydratation (le temps courant diffère serveur/client).
 */
export function CountdownTimer({
  target,
  onComplete,
  className,
}: {
  target: string;
  onComplete?: () => void;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    const tick = () => {
      const left = targetMs - Date.now();
      setRemaining(left);
      if (left <= 0 && firedFor.current !== target) {
        firedFor.current = target;
        onComplete?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, onComplete]);

  return (
    <span className={className} suppressHydrationWarning>
      {remaining === null ? "--:--" : fmt(remaining)}
    </span>
  );
}
