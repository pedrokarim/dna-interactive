import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaProgress } from "./ProgressBar";

const meta = {
  title: "DNA/Données/ProgressBar",
  component: DnaProgress,
  tags: ["autodocs"],
  args: { value: 64, max: 100 },
} satisfies Meta<typeof DnaProgress>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Barre: Story = { render: (args) => <div className="w-72"><DnaProgress {...args} /></div> };
