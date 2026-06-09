import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaRewardsGrid } from "./RewardsGrid";

const meta = {
  title: "DNA/Données/RewardsGrid",
  component: DnaRewardsGrid,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaRewardsGrid>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Butin: Story = {
  render: () => (
    <div className="w-[28rem]">
      <DnaRewardsGrid
        columns={8}
        items={[
          { sym: "✦", qty: "×1", rare: true, bonus: true },
          { sym: "◈", qty: "×4", bonus: true },
          { sym: "⬡", qty: "×27k", bonus: true },
          { sym: "❖", qty: "×8", bonus: true },
          { sym: "✧", qty: "×3", bonus: true },
          { sym: "⬥", qty: "×1", rare: true, bonus: true },
          { sym: "◆", qty: "×12", bonus: true },
          { sym: "✤", qty: "×5", bonus: true },
        ]}
      />
    </div>
  ),
};
