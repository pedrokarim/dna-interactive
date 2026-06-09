import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaTooltip } from "./Tooltip";
import { DnaButton } from "./Button";

const meta = {
  title: "DNA/Contrôles/Tooltip",
  component: DnaTooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaTooltip>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Survol: Story = {
  render: () => (
    <DnaTooltip label="Astuce · texte d'aide">
      <DnaButton variant="ghost">Survol</DnaButton>
    </DnaTooltip>
  ),
};
