import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaSeal } from "./Seal";

const meta = {
  title: "DNA/Conteneurs/Seal",
  component: DnaSeal,
  tags: ["autodocs"],
  args: { title: "⬥ Sceau démoniaque", value: "Tolérance 139 / 145", percent: 94 },
} satisfies Meta<typeof DnaSeal>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Banniere: Story = { render: (args) => <div className="w-72"><DnaSeal {...args} /></div> };
