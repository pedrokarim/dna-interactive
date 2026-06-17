import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaItemPicker, type DnaPickerItem } from "./ItemPicker";
import { ELEMENTS, type ElementKey } from "./elements";

const meta = {
  title: "DNA/Builder/ItemPicker",
  component: DnaItemPicker,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof DnaItemPicker>;
export default meta;

type Story = StoryObj<typeof meta>;

/* —— Fixtures —— (icônes = icônes d'élément du jeu en stand-in illustratif) */
const els: ElementKey[] = ["Fire", "Water", "Thunder", "Wind", "Light", "Dark"];
const iconFor = (el?: ElementKey | null) => (el ? ELEMENTS[el].icon : null);

/** MOD / Demon Wedges : rareté + élément + polarité (les 3 filtres). */
const MODS: DnaPickerItem[] = Array.from({ length: 18 }, (_, i) => {
  const el = els[i % els.length];
  return {
    id: `mods-${5100 + i}`,
    name: `Demon Wedge ${ELEMENTS[el].label} ${String.fromCharCode(65 + (i % 6))}`,
    icon: iconFor(el),
    rarity: ((i % 5) + 1) as number,
    element: el,
    polarity: ((i % 4) + 1) as number,
  };
});

/** Armes : rareté + élément, PAS de polarité (filtre polarité masqué). */
const WEAPONS: DnaPickerItem[] = Array.from({ length: 12 }, (_, i) => {
  const el = i % 3 === 0 ? null : els[i % els.length];
  return {
    id: `weapons-${10400 + i}`,
    name: `${["Katana", "Mitrailleuse", "Fouet-épée", "Arbalète", "Épée", "Dualblade"][i % 6]} ${i + 1}`,
    icon: iconFor(el),
    rarity: (((i + 2) % 5) + 1) as number,
    element: el,
    polarity: null,
  };
});

/** Génimons : rareté seule (filtres élément + polarité masqués). */
const GENIMONS: DnaPickerItem[] = Array.from({ length: 9 }, (_, i) => ({
  id: `genimon-${4000 + i}`,
  name: `Génimon ${i + 1}`,
  icon: null,
  rarity: ((i % 5) + 1) as number,
  element: null,
  polarity: null,
}));

/** MOD avec recherche + filtres rareté/élément/polarité. */
export const Mods: Story = {
  render: function Render() {
    const [sel, setSel] = useState<string | null>("mods-5102");
    return (
      <div className="w-[44rem]">
        <DnaItemPicker items={MODS} selectedId={sel} onSelect={(it) => setSel(it.id)} columns={5} />
      </div>
    );
  },
};

/** Armes : le filtre polarité disparaît automatiquement (aucun item n'en a). */
export const Armes: Story = {
  render: function Render() {
    const [sel, setSel] = useState<string | null>(null);
    return (
      <div className="w-[40rem]">
        <DnaItemPicker items={WEAPONS} selectedId={sel} onSelect={(it) => setSel(it.id)} placeholder="Rechercher une arme…" />
      </div>
    );
  },
};

/** Génimons : seul le filtre rareté reste. */
export const Genimons: Story = {
  render: function Render() {
    const [sel, setSel] = useState<string | null>(null);
    return (
      <div className="w-[36rem]">
        <DnaItemPicker items={GENIMONS} selectedId={sel} onSelect={(it) => setSel(it.id)} placeholder="Rechercher un génimon…" columns={3} />
      </div>
    );
  },
};

/** Items déjà placés ailleurs (grisés + coche) pour éviter les doublons. */
export const AvecItemsUtilises: Story = {
  render: function Render() {
    const [sel, setSel] = useState<string | null>("mods-5100");
    return (
      <div className="w-[44rem]">
        <DnaItemPicker
          items={MODS}
          selectedId={sel}
          usedIds={["mods-5103", "mods-5104", "mods-5108"]}
          onSelect={(it) => setSel(it.id)}
          columns={5}
        />
      </div>
    );
  },
};

/** État vide après filtrage. */
export const SansResultat: Story = {
  render: () => (
    <div className="w-[40rem]">
      <DnaItemPicker items={WEAPONS.slice(0, 2)} emptyLabel="Aucune arme ne correspond." />
    </div>
  ),
};
