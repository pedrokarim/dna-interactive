import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaTabs } from "./Tabs";

const meta = {
  title: "DNA/Contrôles/Tabs",
  component: DnaTabs,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaTabs>;
export default meta;

type Story = StoryObj<typeof meta>;

export const FichePerso: Story = {
  render: function Render() {
    const [v, setV] = useState("attributs");
    return (
      <DnaTabs
        value={v}
        onChange={setV}
        tabs={[
          { value: "attributs", label: "Attributs" },
          { value: "competences", label: "Compétences" },
          { value: "cosmetique", label: "Cosmétique" },
          { value: "profil", label: "Profil" },
        ]}
      />
    );
  },
};
