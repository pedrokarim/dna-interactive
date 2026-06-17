import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaConsonanceEditor } from "./ConsonanceEditor";
import { ELEMENTS, type ElementKey } from "./elements";
import type { WedgeSlotData } from "./_wedge";
import type { DnaPickerItem } from "./ItemPicker";

const meta = {
  title: "DNA/Builder/ConsonanceEditor",
  component: DnaConsonanceEditor,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Les 4 MOD se réorganisent par drag (drop = échange) et s'éditent au clic. L'arme centrale est verrouillée (cadenas) : elle ne bouge pas et n'est pas remplaçable.",
      },
    },
  },
} satisfies Meta<typeof DnaConsonanceEditor>;
export default meta;

type Story = StoryObj<typeof meta>;

const els: ElementKey[] = ["Thunder", "Water", "Fire", "Light"];
const mod = (pos: number, el: ElementKey, track: number): WedgeSlotData => ({
  position: pos,
  track,
  item: {
    id: `mods-${5500 + pos}`,
    name: `MOD Consonance ${ELEMENTS[el].label} ${pos}`,
    icon: ELEMENTS[el].icon, // stand-in illustratif
    rarity: ((pos % 5) + 1) as number,
    element: el,
    polarity: track,
  },
});

const WEAPON: DnaPickerItem = {
  id: "weapons-10499",
  name: "Arme de consonance",
  icon: ELEMENTS.Thunder.icon,
  rarity: 5,
  element: "Thunder",
  polarity: null,
};

const INITIAL: WedgeSlotData[] = [1, 2, 3, 4].map((p) => mod(p, els[(p - 1) % els.length], ((p - 1) % 4) + 1));

/** Éditeur interactif : drag des 4 MOD, arme verrouillée. */
export const Editable: Story = {
  render: function Render() {
    const [slots, setSlots] = useState<WedgeSlotData[]>(INITIAL);
    const [log, setLog] = useState("Glisse un MOD sur un autre pour les échanger. L'arme ne bouge pas.");
    return (
      <div className="flex flex-col items-center gap-4">
        <DnaConsonanceEditor
          slots={slots}
          weapon={WEAPON}
          accentHex={ELEMENTS.Thunder.hex}
          scale="lg"
          onChange={(next) => {
            setSlots(next);
            setLog(`Ordre MOD : ${next.map((s) => s.item?.element?.[0] ?? "·").join(" ")}`);
          }}
          onSlotClick={(pos) => setLog(`Clic MOD ${pos} → ouvrirait le picker`)}
        />
        <p className="max-w-md text-center font-sans text-xs text-muted">{log}</p>
      </div>
    );
  },
};

/** Quelques emplacements vides + lecture seule. */
export const LectureSeule: Story = {
  render: () => (
    <DnaConsonanceEditor
      slots={[mod(1, "Thunder", 1), { position: 2, item: null, track: null }, mod(3, "Water", 3), mod(4, "Fire", 2)]}
      weapon={WEAPON}
      accentHex={ELEMENTS.Thunder.hex}
      scale="md"
      readOnly
    />
  ),
};
