import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaCrest } from "./Crest";

const meta = {
  title: "DNA/Ornements/Crest",
  component: DnaCrest,
  tags: ["autodocs"],
  args: { width: 220 },
} satisfies Meta<typeof DnaCrest>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Frise: Story = {};
