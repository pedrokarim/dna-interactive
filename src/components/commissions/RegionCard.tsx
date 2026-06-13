import { Gem, Sword, UserRound, type LucideIcon } from "lucide-react";
import { DnaPanel } from "@/components/dna/Panel";
import { cn } from "@/components/dna/cn";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  OBJECTIVE_FR,
  REGION_LABELS,
  type Category,
  type Objective,
  type Region,
} from "@/lib/commissions/types";

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  character: UserRound,
  weapon: Sword,
  demon_wedge: Gem,
};

function objectiveLabel(obj: string, locale: string): string {
  if (locale === "fr") return OBJECTIVE_FR[obj as Objective] ?? obj;
  return obj;
}

function categoryLabel(cat: Category, locale: string): string {
  return locale === "fr" ? CATEGORY_LABELS[cat].fr : CATEGORY_LABELS[cat].en;
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
  const Icon = CATEGORY_ICON[category];
  const isWedge = category === "demon_wedge";
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-line/15 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0 sm:first:border-l-0 sm:first:pl-0",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn("h-3.5 w-3.5", isWedge ? "text-crimson-bright" : "text-gold")}
          aria-hidden
        />
        <span
          className={cn(
            "font-caps text-[0.62rem] uppercase tracking-[0.18em]",
            isWedge ? "text-[#ffb3a6]" : "text-gold",
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
              "flex items-center gap-2 border px-2.5 py-1.5 text-[0.8rem]",
              isWedge
                ? "border-crimson-bright/25 bg-crimson/10 text-parch"
                : "border-line/15 bg-ink-2/60 text-parch/90",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rotate-45",
                isWedge ? "bg-crimson-bright/70" : "bg-gold/60",
              )}
            />
            {objectiveLabel(obj, locale)}
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
  data: Record<Category, string[]>;
  locale: string;
}) {
  return (
    <DnaPanel className="p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2.5 font-caps text-[0.72rem] uppercase tracking-[0.3em] text-gold-bright">
        <span className="text-gold">◈</span>
        {REGION_LABELS[region]}
        <span className="h-px flex-1 bg-gradient-to-r from-line/30 to-transparent" />
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Column key={cat} category={cat} objectives={data[cat] ?? []} locale={locale} />
        ))}
      </div>
    </DnaPanel>
  );
}
