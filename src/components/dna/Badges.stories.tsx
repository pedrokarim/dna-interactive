import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaNewTab, DnaNotifDot } from "./Badges";

const meta = {
  title: "DNA/Affichage/Badges",
  component: DnaNewTab,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaNewTab>;
export default meta;

type Story = StoryObj<typeof meta>;

export const New: Story = { name: "Nouveau", args: { children: "Nouveau" } };

export const OnATile: Story = { name: "Sur une tuile",
  render: () => (
    <div className="relative h-[88px] w-[130px] border border-line/25 bg-panel/70">
      <DnaNewTab className="absolute right-2.5 top-0" />
      <DnaNotifDot className="absolute right-1.5 bottom-1.5" />
    </div>
  ),
};
