"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

import { demarrerAnalytics, suivreLocale } from "@/lib/analytics";

/**
 * Démarre la mesure d'audience.
 *
 * Ne rend rien. Ce composant posait auparavant une balise `<script>` vers
 * `/s.js` ; le SDK est maintenant dans le bundle et s'initialise ici — voir
 * `@/lib/analytics` pour ce que la bascule a débloqué.
 *
 * `demarrerAnalytics` se garde elle-même contre un second appel, ce qui rend le
 * composant sûr sous le double montage du mode strict.
 */
export function SarutobiAnalytics() {
  const locale = useLocale();

  useEffect(() => {
    demarrerAnalytics(locale);
  }, [locale]);

  // Séparé de l'initialisation : changer de langue en cours de visite ne
  // réinitialise pas le SDK, ça ne fait que déplacer le contexte du lot.
  useEffect(() => {
    suivreLocale(locale);
  }, [locale]);

  return null;
}
