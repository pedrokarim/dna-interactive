import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaLabeledBar } from "./LabeledBar";

const meta = {
  title: "DNA/Données/LabeledBar",
  component: DnaLabeledBar,
  tags: ["autodocs"],
  args: { label: "STABILITÉ", value: 78 },
} satisfies Meta<typeof DnaLabeledBar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Telemetrie: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <DnaLabeledBar label="STABILITÉ" value={78} color="#a48ed0" />
      <DnaLabeledBar label="DIVERGENCE" value={23} color="#b5302a" />
    </div>
  ),
};
