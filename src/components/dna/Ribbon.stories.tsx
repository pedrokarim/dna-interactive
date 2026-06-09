import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaRibbon } from "./Ribbon";

const meta = {
  title: "DNA/Ornements/Ribbon",
  component: DnaRibbon,
  tags: ["autodocs"],
  args: { children: "Messager impérial" },
} satisfies Meta<typeof DnaRibbon>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Cartouche: Story = {};
