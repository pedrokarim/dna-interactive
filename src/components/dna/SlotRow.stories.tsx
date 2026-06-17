import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaSlotRow, type SlotEntry } from "./SlotRow";
import { ELEMENTS, type ElementKey } from "./elements";
import type { DnaPickerItem } from "./ItemPicker";

const meta = {
  title: "DNA/Builder/SlotRow",
  component: DnaSlotRow,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Emplacements (≤ max) avec rang best/alternative. Cliquer « + » ou un emplacement ouvre le picker. Le tag « Alt » se clique pour désigner le meilleur choix ; la croix retire l'item.",
      },
    },
  },
} satisfies Meta<typeof DnaSlotRow>;
export default meta;

type Story = StoryObj<typeof meta>;

const els: ElementKey[] = ["Fire", "Water", "Thunder", "Wind", "Light", "Dark"];

const WEAPON_POOL: DnaPickerItem[] = Array.from({ length: 14 }, (_, i) => {
  const el = i % 4 === 0 ? null : els[i % els.length];
  return {
    id: `weapons-${10400 + i}`,
    name: `${["Katana", "Mitrailleuse", "Fouet-épée", "Arbalète", "Épée", "Dualblade"][i % 6]} ${i + 1}`,
    icon: el ? ELEMENTS[el].icon : null,
    rarity: ((i % 5) + 1) as number,
    element: el,
    polarity: null,
  };
});

const GENIMON_POOL: DnaPickerItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `genimon-${4000 + i}`,
  name: `Génimon ${i + 1}`,
  icon: null,
  rarity: ((i % 5) + 1) as number,
  element: null,
  polarity: null,
}));

/** Armes (≤3, best/alt) — flux complet : ajout, remplacement, rang, retrait. */
export const Armes: Story = {
  render: function Render() {
    const [entries, setEntries] = useState<SlotEntry[]>([
      { item: WEAPON_POOL[1], rank: "best" },
      { item: WEAPON_POOL[5], rank: "alternative" },
    ]);
    return (
      <div className="max-w-xl">
        <DnaSlotRow entries={entries} pool={WEAPON_POOL} label="Choisir une arme" onChange={setEntries} />
      </div>
    );
  },
};

/** Vide : seul le bouton « Ajouter » est présent. */
export const Vide: Story = {
  render: function Render() {
    const [entries, setEntries] = useState<SlotEntry[]>([]);
    return (
      <div className="max-w-xl">
        <DnaSlotRow entries={entries} pool={WEAPON_POOL} label="Choisir une arme" onChange={setEntries} />
      </div>
    );
  },
};

/** Génimons sans rang (allowRanks=false). */
export const GenimonsSansRang: Story = {
  render: function Render() {
    const [entries, setEntries] = useState<SlotEntry[]>([{ item: GENIMON_POOL[0], rank: "best" }]);
    return (
      <div className="max-w-xl">
        <DnaSlotRow
          entries={entries}
          pool={GENIMON_POOL}
          label="Choisir un génimon"
          allowRanks={false}
          pickerColumns={3}
          onChange={setEntries}
        />
      </div>
    );
  },
};

/** Lecture seule (affichage sur la fiche). */
export const LectureSeule: Story = {
  render: () => (
    <DnaSlotRow
      entries={[
        { item: WEAPON_POOL[1], rank: "best" },
        { item: WEAPON_POOL[5], rank: "alternative" },
        { item: WEAPON_POOL[9], rank: "alternative" },
      ]}
      pool={WEAPON_POOL}
      readOnly
    />
  ),
};
