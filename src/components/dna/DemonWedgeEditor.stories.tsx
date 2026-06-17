import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaDemonWedgeEditor, type WedgeSlotData } from "./DemonWedgeEditor";
import { ELEMENTS, type ElementKey } from "./elements";
import type { DnaPickerItem } from "./ItemPicker";

const meta = {
  title: "DNA/Builder/DemonWedgeEditor",
  component: DnaDemonWedgeEditor,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Glisse-dépose les 8 cases extérieures pour les réorganiser (drop = échange). Le centre est verrouillé : il ne bouge pas, mais reste cliquable pour changer son MOD.",
      },
    },
  },
} satisfies Meta<typeof DnaDemonWedgeEditor>;
export default meta;

type Story = StoryObj<typeof meta>;

const els: ElementKey[] = ["Fire", "Water", "Thunder", "Wind", "Light", "Dark"];
const mod = (pos: number, el: ElementKey, track: number): WedgeSlotData => ({
  position: pos,
  track,
  item: {
    id: `mods-${5100 + pos}`,
    name: `Demon Wedge ${ELEMENTS[el].label} ${pos}`,
    icon: ELEMENTS[el].icon, // stand-in illustratif
    rarity: ((pos % 5) + 1) as number,
    element: el,
    polarity: track,
  },
});

const CENTER: DnaPickerItem = {
  id: "mods-51799",
  name: "Feathered Serpent's Resolve",
  icon: ELEMENTS.Light.icon,
  rarity: 5,
  element: "Light",
  polarity: null,
};

const INITIAL: WedgeSlotData[] = [1, 2, 3, 4, 5, 6, 7, 8].map((p) => mod(p, els[(p - 1) % els.length], ((p - 1) % 4) + 1));

/** Éditeur interactif : drag des cases extérieures, centre verrouillé. */
export const Editable: Story = {
  render: function Render() {
    const [slots, setSlots] = useState<WedgeSlotData[]>(INITIAL);
    const [log, setLog] = useState<string>("Glisse une case sur une autre pour les échanger.");
    return (
      <div className="flex flex-col items-center gap-4">
        <DnaDemonWedgeEditor
          slots={slots}
          centerItem={CENTER}
          accentHex={ELEMENTS.Light.hex}
          scale="lg"
          onChange={(next) => {
            setSlots(next);
            setLog(`Ordre : ${next.map((s) => s.item?.element?.[0] ?? "·").join(" ")}`);
          }}
          onSlotClick={(pos) => setLog(`Clic case ${pos} → ouvrirait le picker`)}
          onCenterClick={() => setLog("Clic centre → changer le MOD central (reste fixe)")}
        />
        <p className="max-w-md text-center font-sans text-xs text-muted">{log}</p>
      </div>
    );
  },
};

/** Accent teinté par l'élément du perso (ici Pyro), quelques cases vides. */
export const TeintePyro: Story = {
  render: function Render() {
    const [slots, setSlots] = useState<WedgeSlotData[]>([
      mod(1, "Fire", 1),
      mod(2, "Fire", 2),
      { position: 3, item: null, track: null },
      mod(4, "Thunder", 3),
      mod(5, "Fire", 1),
      { position: 6, item: null, track: null },
      mod(7, "Water", 4),
      mod(8, "Fire", 2),
    ]);
    return (
      <DnaDemonWedgeEditor
        slots={slots}
        centerItem={{ ...CENTER, name: "Centre Pyro", icon: ELEMENTS.Fire.icon, element: "Fire" }}
        accentHex={ELEMENTS.Fire.hex}
        scale="md"
        onChange={setSlots}
      />
    );
  },
};

/** Lecture seule : pas de drag ni d'édition (affichage sur la fiche). */
export const LectureSeule: Story = {
  render: () => (
    <DnaDemonWedgeEditor slots={INITIAL} centerItem={CENTER} accentHex={ELEMENTS.Light.hex} scale="md" readOnly />
  ),
};
