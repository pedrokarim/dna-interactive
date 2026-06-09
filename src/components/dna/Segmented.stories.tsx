import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaSegmented } from "./Segmented";

const meta = {
  title: "DNA/Contrôles/Segmented",
  component: DnaSegmented,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaSegmented>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Vues: Story = {
  render: function Render() {
    const [v, setV] = useState("grid");
    return (
      <DnaSegmented
        value={v}
        onChange={setV}
        options={[
          { value: "grid", label: "▦ Grille" },
          { value: "list", label: "≡ Liste" },
          { value: "detail", label: "▤ Détaillé" },
        ]}
      />
    );
  },
};
