import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { DnaPanel } from "@/components/dna/Panel";
import { cn } from "@/components/dna/cn";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import {
  CATEGORIES,
  categoryLabel,
  isInfiniteObjective,
  isKnownObjective,
  objectiveArt,
  objectiveLabel,
  REGION_LABELS,
  type Category,
  type Region,
} from "@/lib/commissions/types";

/** Glyphes du jeu : armurerie, arme de corps à corps, sceaux démoniaques (onglet Mod). */
export const CATEGORY_ICON: Record<Category, (typeof GlyphIcons)[keyof typeof GlyphIcons]> = {
  character: GlyphIcons.characters,
  weapon: GlyphIcons.weapons,
  demon_wedge: GlyphIcons.mods,
};

/** Vignette carrée de l'illustration du type d'objectif ; rien si le texte n'est pas un objectif connu. */
export function ObjectiveThumb({ objective, className }: { objective: string; className?: string }) {
  const art = objectiveArt(objective);
  if (!art) return null;
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 border border-white/10 bg-ink bg-cover bg-center", className)}
      style={{ backgroundImage: `url(${art})` }}
    />
  );
}

function Column({
  category,
  objectives,
  locale,
}: {
  category: Category;
  objectives: string[];
  locale: string;
}) {
  const t = useTranslations("commissions");
  const Icon = CATEGORY_ICON[category];
  const isWedge = category === "demon_wedge";
  const infTitle = t("infinite");
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 border-t border-line/15 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0 sm:first:border-l-0 sm:first:pl-0",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn("h-3.5 w-3.5 shrink-0", isWedge ? "text-crimson-bright" : "text-gold")}
          aria-hidden
        />
        <span
          className={cn(
            "whitespace-nowrap font-caps text-[0.6rem] uppercase leading-tight tracking-[0.1em]",
            isWedge ? "text-crimson-soft" : "text-gold",
          )}
        >
          {categoryLabel(category, locale)}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {objectives.map((obj, i) => (
          <li
            key={`${category}-${i}`}
            className={cn(
              "flex min-w-0 items-center gap-2 border py-1 pl-1 pr-2.5 text-[0.8rem]",
              isWedge
                ? "border-crimson-bright/25 bg-crimson/10 text-parch"
                : "border-line/15 bg-ink-2/60 text-parch/90",
            )}
          >
            <ObjectiveThumb objective={obj} className="h-7 w-7" />
            <span className="min-w-0 truncate" title={objectiveLabel(obj, locale)}>{objectiveLabel(obj, locale)}</span>
            {isInfiniteObjective(obj) ? (
              <span
                title={infTitle}
                aria-label={infTitle}
                className={cn(
                  "ml-auto shrink-0 font-display text-lg leading-none",
                  isWedge ? "text-crimson-bright" : "text-gold-bright",
                )}
              >
                ∞
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RegionCard({
  region,
  data,
  locale,
}: {
  region: Region;
  data: Record<Category, string[]> | undefined;
  locale: string;
}) {
  const t = useTranslations("commissions");

  // On ne garde que les vrais objectifs : le pipeline recopie verbatim l'embed
  // source, qui contient un message d'erreur quand le bot échoue à lire une
  // région. Si rien de valide n'arrive pour toute la région, on affiche un état
  // « indisponible » plutôt que de rendre le texte d'erreur comme un objectif.
  // `data` peut être absent malgré le typage : l'état vient d'une réponse
  // réseau, et un rendu ne doit pas planter parce qu'une région y manque.
  const src = data ?? ({} as Partial<Record<Category, string[]>>);
  const known: Record<Category, string[]> = {} as Record<Category, string[]>;
  let hasAnyKnown = false;
  for (const cat of CATEGORIES) {
    const filtered = (src[cat] ?? []).filter(isKnownObjective);
    known[cat] = filtered;
    if (filtered.length > 0) hasAnyKnown = true;
  }
  const hasRawEntries = CATEGORIES.some((cat) => (src[cat] ?? []).length > 0);
  const unavailable = !hasAnyKnown && hasRawEntries;

  return (
    <DnaPanel className="p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2.5 font-caps text-[0.72rem] uppercase tracking-[0.3em] text-gold-bright">
        <span className="text-gold">◈</span>
        {REGION_LABELS[region]}
        <span className="h-px flex-1 bg-gradient-to-r from-line/30 to-transparent" />
      </h2>
      {unavailable ? (
        <div className="flex items-center justify-center gap-2.5 border border-line/15 bg-ink-2/40 px-4 py-6 text-center">
          <TriangleAlert className="h-4 w-4 shrink-0 text-gold/60" aria-hidden />
          <span className="text-[0.82rem] text-parch/55">{t("unavailable")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Column key={cat} category={cat} objectives={known[cat]} locale={locale} />
          ))}
        </div>
      )}
    </DnaPanel>
  );
}
