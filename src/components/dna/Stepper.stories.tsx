import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaStepper } from "./Stepper";

const meta = {
  title: "DNA/Contrôles/Stepper",
  component: DnaStepper,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaStepper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Manche: Story = {
  render: function Render() {
    const [v, setV] = useState(30);
    return <DnaStepper value={v} min={1} max={99} suffix="/ 99" onChange={setV} />;
  },
};
