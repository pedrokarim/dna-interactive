import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaChip } from "./Chip";
import { ELEMENTS, ELEMENT_KEYS } from "./elements";

const meta = {
  title: "DNA/Contrôles/Chip",
  component: DnaChip,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaChip>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Neutre: Story = { args: { children: "Katana", selected: false } };
export const Selectionnee: Story = { args: { children: "Espadon", selected: true } };

export const Elements: Story = {
  render: function Render() {
    const [active, setActive] = useState<string[]>(["Thunder"]);
    return (
      <>
        {ELEMENT_KEYS.map((k) => {
          const el = ELEMENTS[k];
          return (
            <DnaChip
              key={k}
              color={el.hex}
              selected={active.includes(k)}
              onClick={() =>
                setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]))
              }
            >
              {el.label}
            </DnaChip>
          );
        })}
      </>
    );
  },
};
