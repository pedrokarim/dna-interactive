import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaPriorityList, type PriorityItem } from "./PriorityList";

const meta = {
  title: "DNA/Builder/PriorityList",
  component: DnaPriorityList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Liste ordonnée réordonnable au drag (1 = plus prioritaire). Retrait via la croix ; ajout depuis le reste du pool. Sert aux priorités de stats et de compétences.",
      },
    },
  },
} satisfies Meta<typeof DnaPriorityList>;
export default meta;

type Story = StoryObj<typeof meta>;

const STAT_POOL: PriorityItem[] = [
  { id: "ATK", label: "ATQ" },
  { id: "CritRate", label: "Taux Crit." },
  { id: "CritDmg", label: "Dégâts Crit." },
  { id: "SkillDmg", label: "Dégâts de compétence" },
  { id: "HP", label: "PV" },
  { id: "DEF", label: "DÉF" },
  { id: "ElementDmg", label: "Dégâts élémentaires" },
];

const SKILL_POOL: PriorityItem[] = [
  { id: "s1", label: "Compétence 1", sublabel: "Attaque normale" },
  { id: "s2", label: "Compétence 2", sublabel: "Esquive" },
  { id: "s3", label: "Compétence 3", sublabel: "Ultime" },
];

/** Priorités de stats — réordonnables, retrait, ajout depuis le pool. */
export const Stats: Story = {
  render: function Render() {
    const [items, setItems] = useState<PriorityItem[]>([
      STAT_POOL[0],
      STAT_POOL[1],
      STAT_POOL[3],
    ]);
    return (
      <div className="w-80">
        <DnaPriorityList items={items} pool={STAT_POOL} addLabel="Ajouter une stat" onChange={setItems} />
      </div>
    );
  },
};

/** Priorités de compétences — avec sous-libellés. */
export const Competences: Story = {
  render: function Render() {
    const [items, setItems] = useState<PriorityItem[]>([SKILL_POOL[2], SKILL_POOL[0]]);
    return (
      <div className="w-80">
        <DnaPriorityList items={items} pool={SKILL_POOL} max={3} addLabel="Ajouter une compétence" onChange={setItems} />
      </div>
    );
  },
};

/** Lecture seule (affichage sur la fiche). */
export const LectureSeule: Story = {
  render: () => (
    <div className="w-80">
      <DnaPriorityList items={[STAT_POOL[0], STAT_POOL[1], STAT_POOL[2]]} readOnly />
    </div>
  ),
};
