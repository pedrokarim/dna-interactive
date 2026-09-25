"use client";

import { useTranslations } from "next-intl";
import { cn, DnaLozenge } from "@/components/dna";
import { formatPercent, percent } from "@/lib/map/progress";
import { NATIONS, mapProgressFromIndex, sumProgress } from "@/lib/map/world";
import { useMapLabels } from "./useMapLabels";

/**
 * Sélecteur de carte, organisé comme le jeu : nation → zone de la carte du
 * monde → sous-cartes. Chaque ligne porte son pourcentage d'exploration.
 */
export function RegionSwitcher({
  currentMapId,
  marked,
  onSelect,
}: {
  currentMapId: string | null;
  marked: ReadonlySet<string>;
  onSelect: (mapId: string) => void;
}) {
  const t = useTranslations("map");
  const { name, locale } = useMapLabels();

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
      {NATIONS.map((nation) => {
        const nationProgress = sumProgress(
          nation.areas.flatMap((a) => a.maps.map((m) => mapProgressFromIndex(m.id, marked))),
        );
        const areas = [...nation.areas].sort((a, b) => Number(a.twilight) - Number(b.twilight));
        return (
          <section key={nation.id} className="pt-3">
            <div className="mb-1.5 flex items-baseline justify-between gap-2 px-1">
              <h3 className="flex items-center gap-2 font-caps text-[0.62rem] uppercase tracking-[0.2em] text-gold/85">
                <DnaLozenge size={6} />
                {name(nation.name)}
              </h3>
              <span className="font-mono text-[0.62rem] text-muted">{formatPercent(percent(nationProgress), locale)}</span>
            </div>

            <div className="space-y-1.5">
              {areas.map((area) => (
                <div key={area.id} className="border border-line/15 bg-ink-2/50">
                  {/* Une zone à une seule carte n'a pas besoin d'un titre en plus du bouton. */}
                  {area.maps.length > 1 && (
                    <div className="flex items-center gap-2 border-b border-line/10 px-2.5 py-1.5">
                      <span className="truncate font-sans text-[0.72rem] font-medium text-parch/75">
                        {name(area.name)}
                      </span>
                      {area.twilight && <TwilightTag label={t("twilightChapter")} />}
                    </div>
                  )}
                  {area.maps.map((m) => {
                    const progress = mapProgressFromIndex(m.id, marked);
                    const pct = percent(progress);
                    const isCurrent = m.id === currentMapId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelect(m.id)}
                        aria-current={isCurrent}
                        className={cn(
                          "flex w-full items-center gap-3 px-2.5 py-2 text-left transition-colors",
                          isCurrent ? "bg-gold/15" : "hover:bg-white/5",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "truncate font-sans text-[0.82rem]",
                                isCurrent ? "text-gold-bright" : "text-parch",
                              )}
                            >
                              {name(m.name)}
                            </span>
                            {area.maps.length === 1 && area.twilight && (
                              <TwilightTag label={t("twilightChapter")} />
                            )}
                          </span>
                          <span className="mt-1 block h-[3px] w-full bg-line/10">
                            <span
                              className={cn("dna-bar-grow block h-full", pct === 100 ? "bg-ok" : "bg-gold/70")}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                        </span>
                        <span className="w-16 shrink-0 text-right font-mono text-[0.66rem] leading-tight text-muted">
                          <span className="block text-parch/85">{formatPercent(pct, locale)}</span>
                          {progress.found}/{progress.total}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        );
      })}

    </div>
  );
}

function TwilightTag({ label }: { label: string }) {
  return (
    <span className="shrink-0 border border-umbro/40 px-1 font-caps text-[0.5rem] uppercase tracking-[0.14em] text-umbro">
      {label}
    </span>
  );
}
