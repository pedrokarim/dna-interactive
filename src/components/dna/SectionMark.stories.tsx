import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaSectionMark } from "./SectionMark";

const meta = {
  title: "DNA/Ornements/SectionMark",
  component: DnaSectionMark,
  tags: ["autodocs"],
  args: { children: "Le Chœur" },
} satisfies Meta<typeof DnaSectionMark>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Chapeau: Story = {};

export const Compact: Story = { args: { size: "sm", children: "Arsenal" } };

/** Les trois emplois réels : fil d'Ariane, sur-titre de tuile, chapeau de section. */
export const EnSituation: Story = {
  render: () => (
    <div className="flex w-[28rem] flex-col gap-4">
      <div className="flex items-center gap-3 border border-line/25 bg-ink/70 px-4 py-3">
        <span className="font-caps text-sm font-bold uppercase tracking-[0.28em] text-gold-bright">DNA</span>
        <span className="h-5 w-px bg-line/25" />
        <DnaSectionMark size="sm">Arsenal</DnaSectionMark>
      </div>
      <div className="flex flex-col gap-1 border border-line/25 bg-panel/70 p-4">
        <DnaSectionMark size="sm">Le Chœur</DnaSectionMark>
        <span className="font-display text-lg text-parch">Personnages</span>
      </div>
      <DnaSectionMark>Éphémérides</DnaSectionMark>
    </div>
  ),
};
