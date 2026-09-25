"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCheck, EyeOff } from "lucide-react";
import { cn } from "@/components/dna";
import { MAP_CATEGORY_IDS, type MapCategoryId, type NormalizedMap } from "@/lib/map/taxonomy";
import { typeProgress } from "@/lib/map/progress";
import { MapSeoFooter } from "./MapSeoFooter";
import { PersonalSection } from "./PersonalSection";
import { TypeTile } from "./TypeTile";
import { useMapLabels } from "./useMapLabels";

type SectionId = MapCategoryId | "personal";

/**
 * Corps du panneau : onglets de catégories à gauche, sections à droite.
 * Comme sur HoYoLAB, les onglets ne filtrent pas : ils font défiler jusqu'à la
 * section, et l'onglet suit le défilement. Tout reste visible d'un geste.
 */
export function FiltersView({
  map,
  marked,
  activeTypes,
  onToggleType,
  onSetCategory,
  onLocate,
}: {
  map: NormalizedMap;
  marked: ReadonlySet<string>;
  activeTypes: ReadonlySet<string>;
  onToggleType: (id: string) => void;
  onSetCategory: (ids: string[], active: boolean) => void;
  onLocate: (point: { x: number; y: number }) => void;
}) {
  const t = useTranslations("map");
  const { typeName, categoryName } = useMapLabels();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<SectionId, HTMLElement>());
  const [current, setCurrent] = useState<SectionId | null>(null);

  // « Mes marqueurs » d'abord, comme l'onglet « Marqueurs personnels » de HoYoLAB.
  const sections = useMemo(
    () => [
      { id: "personal" as SectionId, types: [] as NormalizedMap["types"] },
      ...MAP_CATEGORY_IDS.map((id) => ({
        id: id as SectionId,
        types: map.types.filter((g) => g.category === id),
      })).filter((s) => s.types.length > 0),
    ],
    [map],
  );
  const sectionName = (id: SectionId) => (id === "personal" ? t("personalMarkers") : categoryName(id));

  // Onglet courant = dernière section dont le haut est passé sous le bord du
  // conteneur. Un simple calcul au défilement : 9 sections au plus, inutile
  // d'installer un IntersectionObserver par section.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const top = el.getBoundingClientRect().top;
      let found: SectionId | null = sections[0]?.id ?? null;
      for (const s of sections) {
        const node = sectionRefs.current.get(s.id);
        if (node && node.getBoundingClientRect().top - top <= 24) found = s.id;
      }
      // En bas de liste, la dernière section courte ne remonte jamais en haut.
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) found = sections.at(-1)?.id ?? found;
      setCurrent(found);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [sections]);

  const jumpTo = (id: SectionId) => {
    const el = scrollRef.current;
    const node = sectionRefs.current.get(id);
    if (!el || !node) return;
    el.scrollTo({ top: node.offsetTop - 4, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-0 flex-1">
      {/* Onglets */}
      <nav
        aria-label={t("categories")}
        className="custom-scrollbar w-[84px] shrink-0 overflow-y-auto border-r border-line/15 bg-ink-2/40"
      >
        {sections.map((s) => {
          const activeCount = s.types.filter((g) => activeTypes.has(g.id)).length;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => jumpTo(s.id)}
              aria-current={current === s.id}
              className={cn(
                "relative flex w-full items-start justify-between gap-1 px-2 py-2.5 text-left font-sans text-[0.72rem] leading-tight transition-colors",
                current === s.id
                  ? "bg-gold/10 text-gold-bright before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:bg-gold"
                  : "text-parch/70 hover:bg-white/5 hover:text-parch",
              )}
            >
              <span className="min-w-0 hyphens-auto">{sectionName(s.id)}</span>
              {activeCount > 0 && (
                <span className="shrink-0 font-mono text-[0.6rem] text-gold/80">{activeCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sections */}
      <div ref={scrollRef} className="custom-scrollbar relative min-w-0 flex-1 overflow-y-auto px-2.5 pb-3">
        {sections.map((s) => {
          const allActive = s.types.every((g) => activeTypes.has(g.id));
          return (
            <section
              key={s.id}
              ref={(node) => {
                if (node) sectionRefs.current.set(s.id, node);
                else sectionRefs.current.delete(s.id);
              }}
              aria-labelledby={`map-cat-${s.id}`}
              className="border-b border-line/10 pb-3 pt-2.5 last:border-b-0"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 id={`map-cat-${s.id}`} className="truncate font-display text-[0.95rem] text-parch">
                  {sectionName(s.id)}
                </h3>
                {s.id !== "personal" && (
                  <button
                    type="button"
                    onClick={() => onSetCategory(s.types.map((g) => g.id), !allActive)}
                    title={allActive ? t("hideCategory") : t("showCategory")}
                    aria-label={allActive ? t("hideCategory") : t("showCategory")}
                    className="grid h-6 w-6 shrink-0 place-items-center text-muted transition-colors hover:text-gold"
                  >
                    {allActive ? <EyeOff className="h-3.5 w-3.5" /> : <CheckCheck className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
              {s.id === "personal" ? (
                <PersonalSection mapId={map.id} onLocate={onLocate} />
              ) : (
                <div className="grid grid-cols-4 gap-x-2 gap-y-2.5">
                  {s.types.map((g) => (
                    <TypeTile
                      key={g.id}
                      icon={g.icon}
                      name={typeName(g)}
                      active={activeTypes.has(g.id)}
                      tracked={g.tracked}
                      progress={typeProgress(g, marked)}
                      onToggle={() => onToggleType(g.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
        <MapSeoFooter />
      </div>
    </div>
  );
}
