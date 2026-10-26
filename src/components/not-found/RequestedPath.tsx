"use client";

import { usePathname } from "next/navigation";

/**
 * Adresse qui a mené à la 404. `not-found.tsx` ne reçoit ni params ni
 * chemin : seul le routeur client la connaît, d'où ce petit composant.
 */
export function RequestedPath({ label }: { label: string }) {
  const pathname = usePathname();
  if (!pathname) return null;

  return (
    <p className="mt-6 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
      <span className="text-parch/60">{label}</span>
      <code className="min-w-0 break-all font-mono text-[0.8rem] text-gold">{pathname}</code>
    </p>
  );
}
