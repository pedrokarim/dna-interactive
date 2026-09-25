"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import { ArrowLeft, History, X } from "lucide-react";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import { SEARCH_HISTORY_MAX, searchHistoryAtom } from "@/lib/map/state";
import type { NormalizedMap } from "@/lib/map/taxonomy";
import { typeProgress } from "@/lib/map/progress";
import { TypeTile } from "./TypeTile";
import { useMapLabels } from "./useMapLabels";

/** Normalisation pour comparer sans casse ni accents. */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const MAX_POINT_RESULTS = 40;

/**
 * Mode recherche : le panneau entier bascule, comme sur HoYoLAB. Deux familles
 * de résultats : les types (on les active depuis ici) et les points nommés
 * (titres de lectures, événements, lieux), qui centrent la carte dessus.
 */
export function SearchView({
  map,
  marked,
  activeTypes,
  onToggleType,
  onClose,
  onLocate,
}: {
  map: NormalizedMap;
  marked: ReadonlySet<string>;
  activeTypes: ReadonlySet<string>;
  onToggleType: (id: string) => void;
  onClose: () => void;
  onLocate: (point: { x: number; y: number; key?: string; typeId?: string }) => void;
}) {
  const t = useTranslations("map");
  const { typeName, name } = useMapLabels();
  const [query, setQuery] = useState("");
  const [history, setHistory] = useAtom(searchHistoryAtom);

  const remember = (q: string) => {
    const clean = q.trim();
    if (clean.length < 2) return;
    setHistory((prev) => [clean, ...prev.filter((h) => h.toLowerCase() !== clean.toLowerCase())].slice(0, SEARCH_HISTORY_MAX));
  };

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return null;
    const types = map.types.filter((g) => fold(typeName(g)).includes(q) || fold(g.rawName).includes(q));
    const points: { key: string; title: string; x: number; y: number; typeId?: string; icon?: string }[] = [];
    for (const g of map.types)
      for (const p of g.points)
        if (p.title && fold(p.title).includes(q)) points.push({ key: p.key, title: p.title, x: p.x, y: p.y, typeId: g.id, icon: g.icon });
    for (const place of map.places) {
      const label = place.name ? name(place.name) : place.title;
      if (fold(label).includes(q) || fold(place.title).includes(q))
        points.push({ key: `place:${place.title}`, title: label, x: place.x, y: place.y });
    }
    return { types, points: points.slice(0, MAX_POINT_RESULTS), more: Math.max(0, points.length - MAX_POINT_RESULTS) };
  }, [map, query, typeName, name]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          remember(query);
        }}
        className="flex items-center gap-2 px-2.5 pb-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("back")}
          className="grid h-8 w-8 shrink-0 place-items-center text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <label className="flex h-8 min-w-0 flex-1 items-center gap-2 border border-line/25 bg-ink-2/80 px-2.5 focus-within:border-gold/60">
          <GlyphIcons.search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
          <input
            autoFocus
            type="text"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => remember(query)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent font-sans text-sm text-parch outline-none placeholder:text-muted-2"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label={t("clearSearch")} className="text-muted hover:text-parch">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
      </form>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {!results ? (
          history.length > 0 && (
            <div className="pt-1">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-sans text-[0.75rem] text-muted">
                  <History className="h-3.5 w-3.5" aria-hidden />
                  {t("searchHistory")}
                </h3>
                <button type="button" onClick={() => setHistory([])} className="font-sans text-[0.7rem] text-muted-2 hover:text-crimson-soft">
                  {t("clearHistory")}
                </button>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {history.map((h) => (
                  <li key={h} className="group flex items-center border border-line/20 bg-ink-2/80">
                    <button type="button" onClick={() => setQuery(h)} className="py-1 pl-2.5 pr-1.5 font-sans text-[0.75rem] text-parch/85 hover:text-gold-bright">
                      {h}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistory((prev) => prev.filter((x) => x !== h))}
                      aria-label={t("removeFromHistory", { query: h })}
                      className="pr-1.5 text-muted-2 opacity-60 hover:text-crimson-soft group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : results.types.length === 0 && results.points.length === 0 ? (
          <p className="pt-6 text-center font-sans text-sm text-muted">{t("noResults")}</p>
        ) : (
          <>
            {results.types.length > 0 && (
              <section className="pb-3">
                <h3 className="mb-2 font-sans text-[0.75rem] text-muted">{t("resultTypes")}</h3>
                <div className="grid grid-cols-5 gap-x-2 gap-y-2.5">
                  {results.types.map((g) => (
                    <TypeTile
                      key={g.id}
                      icon={g.icon}
                      name={typeName(g)}
                      active={activeTypes.has(g.id)}
                      tracked={g.tracked}
                      progress={typeProgress(g, marked)}
                      onToggle={() => {
                        remember(query);
                        onToggleType(g.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
            {results.points.length > 0 && (
              <section>
                <h3 className="mb-1.5 font-sans text-[0.75rem] text-muted">{t("resultPoints")}</h3>
                <ul className="divide-y divide-line/10 border-y border-line/10">
                  {results.points.map((p) => (
                    <li key={p.key}>
                      <button
                        type="button"
                        onClick={() => {
                          remember(query);
                          onLocate(p);
                        }}
                        className="flex w-full items-center gap-2.5 px-1 py-2 text-left transition-colors hover:bg-white/5"
                      >
                        {p.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.icon} alt="" className="h-5 w-5 shrink-0 object-contain" />
                        ) : (
                          <GlyphIcons.pin className="h-4 w-5 shrink-0 text-gold/70" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1 truncate font-sans text-[0.8rem] text-parch/90">{p.title}</span>
                        {marked.has(p.key) && <span className="shrink-0 font-caps text-[0.5rem] uppercase tracking-[0.14em] text-ok">{t("found")}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
                {results.more > 0 && <p className="pt-2 text-center font-sans text-[0.7rem] text-muted-2">{t("moreResults", { count: results.more })}</p>}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
