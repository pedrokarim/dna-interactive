import InteractiveMap from "@/components/map/InteractiveMap";

/**
 * Carte plein écran : tout est dans `@/components/map`. La `Suspense` que
 * demande nuqs est déjà posée par layout.tsx.
 */
export default function MapPage() {
  return <InteractiveMap />;
}
