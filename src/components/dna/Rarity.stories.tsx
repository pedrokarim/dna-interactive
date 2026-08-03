import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RARITIES, RARITY_LEVELS, rarityAttr, type RarityLevel } from "./rarity";

const LABELS: Record<RarityLevel, string> = {
  1: "Commun",
  2: "Peu commun",
  3: "Rare",
  4: "Épique",
  5: "Légendaire",
  6: "Calamité",
};

/** Vignette d'objet façon case du jeu (lueur qui monte du bas, au survol). */
function Slot({ level }: { level: RarityLevel | null }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        data-rarity={rarityAttr(level)}
        className="dna-rarity-slot grid h-20 w-20 place-items-center rounded-sm border bg-ink/80"
      >
        <span className="font-caps text-lg text-parch/70">{level ?? "—"}</span>
      </div>
      <span className="font-mono text-[0.65rem] text-muted-2">
        {level ? RARITIES[level].hex : "NoQuality"}
      </span>
    </div>
  );
}

const meta = {
  title: "DNA/Fondations/Rareté",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Code couleur de rareté relevé sur les textures du jeu (T_Item_Hover_N, " +
          "T_Com_TipsTextColor_N, T_Com_TipsLineColor_N). Le niveau est porté par " +
          "`data-rarity` et consommé par les classes `dna-rarity-*` de globals.css. " +
          "Détail dans docs/rarete-couleurs-jeu.md.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** L'échelle complète : teinte, nom teinté, filet et pastille. */
export const Echelle: Story = {
  render: () => (
    <div className="w-[44rem] max-w-full space-y-3 p-4">
      {RARITY_LEVELS.map((level) => {
        const meta = RARITIES[level];
        return (
          <div
            key={level}
            data-rarity={rarityAttr(level)}
            className="flex items-center gap-4 rounded-sm border border-white/10 bg-panel/70 p-3"
          >
            <div className="dna-rarity-slot grid h-14 w-14 shrink-0 place-items-center rounded-sm border bg-ink/80">
              <span className="font-caps text-base text-parch/70">{level}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="dna-rarity-name font-display text-xl">
                {LABELS[level]} · {meta.gameName}
              </p>
              <div aria-hidden className="dna-rarity-line my-1.5 w-48" />
              <p className="font-mono text-[0.68rem] text-muted-2">
                teinte {meta.hex} · texte {meta.textHex} · filet {meta.lineHex}
              </p>
            </div>
            <span className="dna-rarity-chip shrink-0 rounded-sm border px-2 py-0.5 text-xs">
              Rareté {level}
            </span>
          </div>
        );
      })}
    </div>
  ),
};

/** Les cases seules — survolez-les pour voir la lueur monter, comme en jeu. */
export const Cases: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4 p-4">
      {RARITY_LEVELS.map((level) => (
        <Slot key={level} level={level} />
      ))}
      <Slot level={null} />
    </div>
  ),
};
