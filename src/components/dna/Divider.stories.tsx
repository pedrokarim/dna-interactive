import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaDivider } from "./Divider";

const meta = {
  title: "DNA/Ornements/Divider",
  component: DnaDivider,
  tags: ["autodocs"],
} satisfies Meta<typeof DnaDivider>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Separateur: Story = { render: () => <div className="w-80"><DnaDivider /></div> };
