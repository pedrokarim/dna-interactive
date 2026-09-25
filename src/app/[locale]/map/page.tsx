import InteractiveMap from "@/components/map/InteractiveMap";

/**
 * Carte interactive plein écran. Toute la logique vit dans
 * `@/components/map` ; la page ne fait que la monter (la `Suspense` exigée par
 * `nuqs` est posée par `layout.tsx`).
 */
export default function MapPage() {
  return <InteractiveMap />;
}
