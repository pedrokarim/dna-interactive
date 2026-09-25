import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaGenimonTraitEditor, type DnaTraitCategoryGroup } from "./GenimonTraitEditor";

const meta = {
  title: "DNA/Builder/GenimonTraitEditor",
  component: DnaGenimonTraitEditor,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Choix des Traits greffés sur un Géniemon. Le nombre d'emplacements vient de la créature — trois pour une variante ordinaire, quatre pour une scintillante — et n'est donc pas une constante. La pastille chiffrée donne l'ordre de sélection, qui se lit comme une priorité de farm et non comme un emplacement. Une fois la limite atteinte, un nouveau choix remplace le plus ancien plutôt que d'être refusé en silence.",
      },
    },
  },
} satisfies Meta<typeof DnaGenimonTraitEditor>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Glyphes réels du jeu, déjà embarqués pour le guide. */
const icon = (category: string, rarity?: number) =>
  `/assets/genimons/traits/${category}${rarity ? `-${rarity}` : ""}.png`;

const GROUPS: DnaTraitCategoryGroup[] = [
  {
    category: "battle",
    label: "Combat",
    icon: icon("battle"),
    traits: [
      { key: "t-brutal", name: "Brutal", effect: "Puissance de compétence +…", category: "battle", rarity: 5, icon: icon("battle", 5) },
      { key: "t-temeraire", name: "Téméraire", effect: "Taux CRIT +…", category: "battle", rarity: 5, icon: icon("battle", 5) },
      { key: "t-revigore", name: "Revigoré", effect: "DGT CRIT +…", category: "battle", rarity: 4, icon: icon("battle", 4) },
      { key: "t-veteran", name: "Vétéran", effect: "Niveau de Soutien de Géniemon et des passifs +1", category: "battle", rarity: 5, icon: icon("battle", 5) },
    ],
  },
  {
    category: "base",
    label: "Statistiques",
    icon: icon("base"),
    traits: [
      { key: "t-cuirasse", name: "Cuirassé", effect: "DÉF +…", category: "base", rarity: 4, icon: icon("base", 4) },
      { key: "t-dodu", name: "Dodu", effect: "PV max +…", category: "base", rarity: 3, icon: icon("base", 3) },
    ],
  },
  {
    category: "speed",
    label: "Mobilité",
    icon: icon("speed"),
    traits: [
      { key: "t-rapide", name: "Rapide", effect: "Vitesse de déplacement +…", category: "speed", rarity: 3, icon: icon("speed", 3) },
    ],
  },
  {
    category: "world",
    label: "Exploration",
    icon: icon("world"),
    traits: [
      { key: "t-avide", name: "Avide", effect: "Ramasse tous les objets au sol dans un rayon de 100 m", category: "world", rarity: 5, icon: icon("world", 5) },
      { key: "t-econome", name: "Économe", effect: "Coût d'endurance −…", category: "world", rarity: 3, icon: icon("world", 3) },
    ],
  },
];

function Demo({ max, initial }: { max: number; initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  return (
    <DnaGenimonTraitEditor
      groups={GROUPS}
      selected={selected}
      max={max}
      onChange={setSelected}
      countLabel={`${selected.length} sur ${max} emplacements`}
      fullHint="Tous les emplacements sont pris : un nouveau choix remplace le plus ancien."
    />
  );
}

/** Variante ordinaire : trois emplacements. */
export const VarianteOrdinaire: Story = {
  args: { groups: GROUPS, selected: [], max: 3, onChange: () => {}, countLabel: "" },
  render: () => <Demo max={3} initial={["t-brutal"]} />,
};

/** Variante scintillante : un emplacement de plus, et c'est tout l'écart. */
export const VarianteScintillante: Story = {
  args: { groups: GROUPS, selected: [], max: 4, onChange: () => {}, countLabel: "" },
  render: () => <Demo max={4} initial={["t-brutal", "t-temeraire"]} />,
};

/** Limite atteinte : choisir encore remplace le plus ancien. */
export const EmplacementsPleins: Story = {
  args: { groups: GROUPS, selected: [], max: 3, onChange: () => {}, countLabel: "" },
  render: () => <Demo max={3} initial={["t-brutal", "t-cuirasse", "t-avide"]} />,
};
