import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaSwitch } from "./Switch";

const meta = {
  title: "DNA/Contrôles/Switch",
  component: DnaSwitch,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaSwitch>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = { name: "Interactif",
  render: function Render() {
    const [on, setOn] = useState(true);
    return <DnaSwitch checked={on} onChange={setOn} aria-label="Enchaînement automatique" />;
  },
};
