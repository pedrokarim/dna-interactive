import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaTag } from "./Tag";

const meta = {
  title: "DNA/Affichage/Tag",
  component: DnaTag,
  tags: ["autodocs"],
  args: { children: "DPS", tone: "gold" },
  argTypes: { tone: { control: "inline-radio", options: ["gold", "crimson"] } },
} satisfies Meta<typeof DnaTag>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Or: Story = { args: { children: "DPS", tone: "gold" } };
export const Cramoisi: Story = { args: { children: "Conflit", tone: "crimson" } };
export const Groupe: Story = {
  render: () => (
    <>
      <DnaTag>DPS</DnaTag>
      <DnaTag>SkillDPS</DnaTag>
      <DnaTag tone="crimson">Conflit</DnaTag>
    </>
  ),
};
