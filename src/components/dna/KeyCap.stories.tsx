import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaKey } from "./KeyCap";

const meta = {
  title: "DNA/Contrôles/KeyCap",
  component: DnaKey,
  tags: ["autodocs"],
  args: { children: "E" },
} satisfies Meta<typeof DnaKey>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Key: Story = { name: "Touche", args: { children: "E" } };
export const Sequence: Story = { name: "Série",
  render: () => (
    <>
      <DnaKey>E</DnaKey>
      <DnaKey>Esc</DnaKey>
      <DnaKey>L&nbsp;Ctrl</DnaKey>
      <DnaKey>Space</DnaKey>
    </>
  ),
};
