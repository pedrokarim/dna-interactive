import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaPanel } from "./Panel";
import { DnaSectionLabel } from "./SectionLabel";

const meta = {
  title: "DNA/Conteneurs/Panel",
  component: DnaPanel,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaPanel>;
export default meta;

type Story = StoryObj<typeof meta>;

export const DoubleFilet: Story = {
  args: { inner: true },
  render: (args) => (
    <DnaPanel {...args} className="w-72 p-5">
      <DnaSectionLabel>Identité</DnaSectionLabel>
      <div className="mt-3 font-display text-2xl text-parch">Rhythm</div>
      <div className="text-sm text-muted">Appel du Phare</div>
    </DnaPanel>
  ),
};

export const AvecFrise: Story = {
  args: { crest: true },
  render: (args) => (
    <DnaPanel {...args} className="w-72 px-5 pb-4 pt-6">
      <div className="text-center font-display text-xl text-gold-bright">Informations</div>
    </DnaPanel>
  ),
};
