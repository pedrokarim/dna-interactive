import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaStatRow } from "./StatRow";

const meta = {
  title: "DNA/Données/StatRow",
  component: DnaStatRow,
  tags: ["autodocs"],
  args: { label: "PV", value: "2 129" },
} satisfies Meta<typeof DnaStatRow>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Bloc: Story = {
  render: () => (
    <div className="w-72">
      <DnaStatRow label="ATQ Electro" value="1 628.69" accent="#a48ed0" />
      <DnaStatRow label="PV" value="2 129" />
      <DnaStatRow label="Bouclier" value="1 757" />
      <DnaStatRow label="DÉF" value="534.24" />
    </div>
  ),
};
