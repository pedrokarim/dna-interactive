import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaNouveau, DnaNotifDot } from "./Badges";

const meta = {
  title: "DNA/Affichage/Badges",
  component: DnaNouveau,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaNouveau>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Nouveau: Story = { args: { children: "Nouveau" } };

export const SurUneTuile: Story = {
  render: () => (
    <div className="relative h-[88px] w-[130px] border border-line/25 bg-panel/70">
      <DnaNouveau className="absolute right-2.5 top-0" />
      <DnaNotifDot className="absolute right-1.5 bottom-1.5" />
    </div>
  ),
};
