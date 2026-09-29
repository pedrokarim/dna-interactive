import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaPageMark } from "./PageMark";
import { DnaSectionLabel } from "./SectionLabel";

const meta = {
  title: "DNA/Ornements/PageMark",
  component: DnaPageMark,
  tags: ["autodocs"],
  args: { children: "Garde-robe" },
} satisfies Meta<typeof DnaPageMark>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** En-tête de page complet : sur-titre étoilé, titre, filet, puis un libellé de section (losange). */
export const EnTeteDePage: Story = {
  render: (args) => (
    <div className="max-w-xl">
      <DnaPageMark {...args} />
      <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">Cosmétiques</h1>
      <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
      <p className="mt-3 text-sm text-parch/75">Tenues, coiffures, accessoires, effets, skins d’armes…</p>
      <DnaSectionLabel className="mt-6">La Myriade du moment</DnaSectionLabel>
    </div>
  ),
};
