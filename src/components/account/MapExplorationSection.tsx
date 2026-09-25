import { getLocale, getTranslations } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
import { BookOpen, Compass, EyeOff, Heart, Package, Puzzle, Route, ScrollText, Signpost, type LucideIcon } from "lucide-react";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import { Link } from "@/i18n/navigation";
import { DnaPanel, DnaSectionLabel, cn } from "@/components/dna";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { formatPercent, percent, type Progress } from "@/lib/map/progress";
import {
  NATIONS,
  categoryProgressFromIndex,
  getMapLocation,
  localized,
  mapProgressFromIndex,
  sumProgress,
} from "@/lib/map/world";

/** Icône par catégorie suivie (celles qui comptent dans l'exploration). */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  waypoints: Signpost,
  chests: Package,
  puzzles: Puzzle,
  exploration: Compass,
  quests: ScrollText,
  readables: BookOpen,
};

/**
 * Progression de la carte interactive sur le profil : pourcentage global,
 * détail par catégorie et par zone, lu dans `map_progress` (synchronisé depuis
 * la carte quand le joueur y passe connecté).
 */
export async function MapExplorationSection({ userId }: { userId: string }) {
  const t = await getTranslations("account");
  const tCategories = await getTranslations("mapCategories");
  const locale = await getLocale();

  let row: { foundKeys: string[]; personalMarkers: unknown[]; updatedAt: Date } | undefined;
  try {
    [row] = await getDb()
      .select({
        foundKeys: schema.mapProgress.foundKeys,
        personalMarkers: schema.mapProgress.personalMarkers,
        updatedAt: schema.mapProgress.updatedAt,
      })
      .from(schema.mapProgress)
      .where(eq(schema.mapProgress.userId, userId))
      .limit(1);
  } catch (error) {
    // Table pas encore créée sur cette base : la section s'affiche vide.
    if (!isMissingTableError(error)) throw error;
  }

  // Itinéraires de farm publiés par le joueur (privés et masqués compris : c'est son profil).
  let routes: { id: string; mapId: string; title: string; voteCount: number; visibility: string; hidden: boolean }[] = [];
  try {
    routes = await getDb()
      .select({
        id: schema.farmRoutes.id,
        mapId: schema.farmRoutes.mapId,
        title: schema.farmRoutes.title,
        voteCount: schema.farmRoutes.voteCount,
        visibility: schema.farmRoutes.visibility,
        hidden: schema.farmRoutes.hidden,
      })
      .from(schema.farmRoutes)
      .where(eq(schema.farmRoutes.userId, userId))
      .orderBy(desc(schema.farmRoutes.voteCount), desc(schema.farmRoutes.createdAt))
      .limit(20);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  const marked = new Set(row?.foundKeys ?? []);
  const nations = NATIONS.map((nation) => {
    // Même ordre que le sélecteur de la carte : chapitre courant, puis Crépuscule.
    const maps = [...nation.areas]
      .sort((a, b) => Number(a.twilight) - Number(b.twilight))
      .flatMap((area) => area.maps.map((m) => ({ ...m, area, progress: mapProgressFromIndex(m.id, marked) })));
    return { nation, maps, progress: sumProgress(maps.map((m) => m.progress)) };
  });
  const total = sumProgress(nations.map((n) => n.progress));
  const categories = Object.entries(categoryProgressFromIndex(marked)).sort(
    ([a], [b]) => Object.keys(CATEGORY_ICONS).indexOf(a) - Object.keys(CATEGORY_ICONS).indexOf(b),
  );
  const updated = row?.updatedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(row.updatedAt)
    : null;

  return (
    <section className="mt-8">
      <DnaSectionLabel>{t("mapBox")}</DnaSectionLabel>
      <DnaPanel className="mt-3 p-5">
        {/* Synthèse */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <p className="font-display text-4xl leading-none text-gold-bright">{formatPercent(percent(total), locale)}</p>
            <p className="mt-1 font-caps text-[0.55rem] uppercase tracking-[0.18em] text-muted">{t("mapExplored")}</p>
          </div>
          <dl className="flex gap-5 font-sans text-sm">
            <div>
              <dt className="font-caps text-[0.52rem] uppercase tracking-[0.16em] text-muted">{t("mapPointsFound")}</dt>
              <dd className="font-mono text-parch">
                {total.found}
                <span className="text-muted">/{total.total}</span>
              </dd>
            </div>
            <div>
              <dt className="font-caps text-[0.52rem] uppercase tracking-[0.16em] text-muted">{t("mapPersonalMarkers")}</dt>
              <dd className="font-mono text-parch">{row?.personalMarkers.length ?? 0}</dd>
            </div>
          </dl>
          <Link
            href="/map"
            className="ml-auto inline-flex items-center gap-2 border border-gold/40 bg-gold/10 px-3.5 py-2 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/20 hover:text-gold-bright"
          >
            <GlyphIcons.map className="h-3.5 w-3.5" aria-hidden />
            {t("mapOpen")}
          </Link>
        </div>
        <Bar progress={total} className="mt-3 h-1.5" />
        <p className="mt-1.5 font-sans text-[0.72rem] text-muted-2">
          {updated ? t("mapLastSync", { date: updated }) : t("mapNeverSynced")}
        </p>

        {/* Par catégorie */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map(([category, p]) => {
            const Icon = CATEGORY_ICONS[category] ?? Compass;
            return (
              <div key={category} className="border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-gold/80" aria-hidden />
                  <span className="truncate font-sans text-[0.8rem] text-parch/90">{tCategories(category)}</span>
                  <span className="ml-auto font-mono text-[0.68rem] text-muted">{formatPercent(percent(p), locale)}</span>
                </div>
                <Bar progress={p} className="mt-2 h-1" />
                <p className="mt-1 font-mono text-[0.62rem] text-muted-2">
                  {p.found}/{p.total}
                </p>
              </div>
            );
          })}
        </div>

        {/* Itinéraires du joueur */}
        {routes.length > 0 && (
          <div className="mt-6">
            <h3 className="flex items-center gap-2 border-b border-line/15 pb-1.5 font-display text-lg text-parch">
              <Route className="h-4 w-4 text-gold/80" aria-hidden />
              {t("mapRoutes")}
              <span className="font-mono text-xs text-muted">{routes.length}</span>
            </h3>
            <ul className="mt-2 divide-y divide-line/10">
              {routes.map((r) => {
                const location = getMapLocation(r.mapId);
                return (
                  <li key={r.id}>
                    <Link href={`/map?mapId=${r.mapId}&route=${r.id}`} className="group flex items-center gap-3 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 truncate font-sans text-sm text-parch/90 transition-colors group-hover:text-gold-bright">
                          {r.visibility === "private" && <GlyphIcons.lock className="h-3 w-3 shrink-0 text-muted" aria-label={t("mapRoutePrivate")} />}
                          {r.hidden && <EyeOff className="h-3 w-3 shrink-0 text-crimson-soft" aria-label={t("mapRouteHidden")} />}
                          <span className="truncate">{r.title}</span>
                        </span>
                        <span className="font-sans text-[0.7rem] text-muted">{location ? localized(location.map.name, locale) : r.mapId}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-xs text-muted">
                        <Heart className="h-3.5 w-3.5" aria-hidden />
                        {r.voteCount}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Par nation et par zone */}
        <div className="mt-6 space-y-5">
          {nations.map(({ nation, maps, progress }) => (
            <div key={nation.id}>
              <div className="flex items-baseline justify-between border-b border-line/15 pb-1.5">
                <h3 className="font-display text-lg text-parch">{localized(nation.name, locale)}</h3>
                <span className="font-mono text-xs text-muted">
                  {formatPercent(percent(progress), locale)} · {progress.found}/{progress.total}
                </span>
              </div>
              <ul className="mt-2 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                {maps.map((m) => (
                  <li key={m.id}>
                    <Link href={`/map?mapId=${m.id}`} className="group block py-1">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate font-sans text-sm text-parch/90 transition-colors group-hover:text-gold-bright">
                          {localized(m.name, locale)}
                        </span>
                        <span className="ml-auto shrink-0 font-mono text-[0.68rem] text-muted">
                          {m.progress.found}/{m.progress.total}
                        </span>
                      </span>
                      <Bar progress={m.progress} className="mt-1 h-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DnaPanel>
    </section>
  );
}

function Bar({ progress, className }: { progress: Progress; className?: string }) {
  const pct = percent(progress);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("w-full overflow-hidden rounded-full bg-ink/60", className)}
    >
      <span
        className={cn("dna-bar-grow block h-full rounded-full", pct === 100 ? "bg-ok" : "bg-gradient-to-r from-gold-deep to-gold-bright")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
