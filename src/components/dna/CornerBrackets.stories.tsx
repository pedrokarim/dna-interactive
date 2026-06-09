import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaCornerBrackets } from "./CornerBrackets";

const meta = {
  title: "DNA/Ornements/CornerBrackets",
  component: DnaCornerBrackets,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaCornerBrackets>;
export default meta;

type Story = StoryObj<typeof meta>;

export const SurUnCadre: Story = {
  render: (args) => (
    <div className="relative grid h-40 w-64 place-items-center border border-line/20 bg-panel/70 font-display text-xl text-parch">
      <DnaCornerBrackets {...args} size={22} />
      Contenu
    </div>
  ),
};
